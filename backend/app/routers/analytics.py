from collections import defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.asset import Asset
from app.models.device import Device
from app.models.enums import IncidentStatus
from app.models.incident import Incident
from app.models.user import User

router = APIRouter(prefix="/analytics", tags=["analytics"])


class AnalyticsSummary(BaseModel):
    total_devices: int
    total_assets: int
    open_incidents: int
    resolved_incidents: int
    false_alarms: int


class DailyIncidentCount(BaseModel):
    date: str
    count: int


class ResponseTimes(BaseModel):
    avg_resolution_seconds: float | None
    resolved_sample_size: int
    avg_disarm_seconds: float | None
    fastest_disarm_seconds: float | None
    disarm_sample_size: int


class AssetCoverage(BaseModel):
    total_assets: int
    armed_assets: int
    coverage_percent: float


@router.get("/summary", response_model=AnalyticsSummary)
def summary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> AnalyticsSummary:
    total_devices = db.query(func.count(Device.id)).filter(Device.owner_id == current_user.id).scalar()
    total_assets = db.query(func.count(Asset.id)).filter(Asset.owner_id == current_user.id).scalar()

    incident_counts = dict(
        db.query(Incident.status, func.count(Incident.id))
        .filter(Incident.user_id == current_user.id)
        .group_by(Incident.status)
        .all()
    )

    return AnalyticsSummary(
        total_devices=total_devices or 0,
        total_assets=total_assets or 0,
        open_incidents=incident_counts.get(IncidentStatus.OPEN, 0)
        + incident_counts.get(IncidentStatus.INVESTIGATING, 0),
        resolved_incidents=incident_counts.get(IncidentStatus.RESOLVED, 0),
        false_alarms=incident_counts.get(IncidentStatus.FALSE_ALARM, 0),
    )


@router.get("/incidents-trend", response_model=list[DailyIncidentCount])
def incidents_trend(
    days: int = Query(default=14, ge=1, le=90),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[DailyIncidentCount]:
    """Incident counts per calendar day (UTC) for the trailing `days` window, zero-filled."""
    now = datetime.now(timezone.utc)
    start = (now - timedelta(days=days - 1)).replace(hour=0, minute=0, second=0, microsecond=0)

    rows = (
        db.query(Incident.triggered_at)
        .filter(Incident.user_id == current_user.id, Incident.triggered_at >= start)
        .all()
    )

    counts: dict[str, int] = defaultdict(int)
    for (triggered_at,) in rows:
        counts[triggered_at.date().isoformat()] += 1

    result = []
    for offset in range(days):
        day = (start + timedelta(days=offset)).date().isoformat()
        result.append(DailyIncidentCount(date=day, count=counts.get(day, 0)))
    return result


@router.get("/response-times", response_model=ResponseTimes)
def response_times(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> ResponseTimes:
    """Average time-to-resolve (manual RESOLVED) vs. average/fastest auto-disarm (FALSE_ALARM)."""
    resolved = (
        db.query(Incident.triggered_at, Incident.resolved_at)
        .filter(
            Incident.user_id == current_user.id,
            Incident.status == IncidentStatus.RESOLVED,
            Incident.resolved_at.isnot(None),
        )
        .all()
    )
    disarmed = (
        db.query(Incident.triggered_at, Incident.resolved_at)
        .filter(
            Incident.user_id == current_user.id,
            Incident.status == IncidentStatus.FALSE_ALARM,
            Incident.resolved_at.isnot(None),
        )
        .all()
    )

    def durations(rows: list[tuple[datetime, datetime]]) -> list[float]:
        return [(resolved_at - triggered_at).total_seconds() for triggered_at, resolved_at in rows]

    resolved_durations = durations(resolved)
    disarm_durations = durations(disarmed)

    return ResponseTimes(
        avg_resolution_seconds=(sum(resolved_durations) / len(resolved_durations)) if resolved_durations else None,
        resolved_sample_size=len(resolved_durations),
        avg_disarm_seconds=(sum(disarm_durations) / len(disarm_durations)) if disarm_durations else None,
        fastest_disarm_seconds=min(disarm_durations) if disarm_durations else None,
        disarm_sample_size=len(disarm_durations),
    )


@router.get("/asset-coverage", response_model=AssetCoverage)
def asset_coverage(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> AssetCoverage:
    total = db.query(func.count(Asset.id)).filter(Asset.owner_id == current_user.id).scalar() or 0
    armed = (
        db.query(func.count(Asset.id))
        .filter(Asset.owner_id == current_user.id, Asset.is_armed.is_(True))
        .scalar()
        or 0
    )
    coverage = (armed / total * 100) if total else 0.0
    return AssetCoverage(total_assets=total, armed_assets=armed, coverage_percent=round(coverage, 1))
