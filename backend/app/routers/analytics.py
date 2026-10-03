from collections import defaultdict
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.asset import Asset
from app.models.device import Device
from app.models.enums import IncidentSeverity, IncidentStatus
from app.models.gamification import XPTransaction
from app.models.incident import Incident
from app.models.sensor_event import SensorEvent
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


class HeatmapOut(BaseModel):
    """cells[weekday][hour] = number of incidents; weekday 0 = Monday, local time."""

    days: int
    cells: list[list[int]]
    peak_weekday: int | None
    peak_hour: int | None


class EventMixItem(BaseModel):
    event_type: str
    count: int


@router.get("/heatmap", response_model=HeatmapOut)
def heatmap(
    days: int = Query(default=30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> HeatmapOut:
    """When do alerts happen? Incidents bucketed by local weekday x hour."""
    tz = ZoneInfo(get_settings().app_timezone)
    since = datetime.now(timezone.utc) - timedelta(days=days)
    rows = (
        db.query(Incident.triggered_at)
        .filter(Incident.user_id == current_user.id, Incident.triggered_at >= since)
        .all()
    )
    cells = [[0] * 24 for _ in range(7)]
    for (triggered_at,) in rows:
        local = triggered_at.astimezone(tz)
        cells[local.weekday()][local.hour] += 1

    peak = max(((d, h) for d in range(7) for h in range(24)), key=lambda dh: cells[dh[0]][dh[1]])
    has_data = cells[peak[0]][peak[1]] > 0
    return HeatmapOut(
        days=days,
        cells=cells,
        peak_weekday=peak[0] if has_data else None,
        peak_hour=peak[1] if has_data else None,
    )


@router.get("/event-mix", response_model=list[EventMixItem])
def event_mix(
    days: int = Query(default=7, ge=1, le=90),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[EventMixItem]:
    """Raw sensor activity by type - shows how often dual verification filtered out single-sensor noise."""
    since = datetime.now(timezone.utc) - timedelta(days=days)
    rows = (
        db.query(SensorEvent.event_type, func.count(SensorEvent.id))
        .join(Device, SensorEvent.device_id == Device.id)
        .filter(Device.owner_id == current_user.id, SensorEvent.received_at >= since)
        .group_by(SensorEvent.event_type)
        .all()
    )
    return [EventMixItem(event_type=event_type.value, count=count) for event_type, count in rows]


class SecurityDay(BaseModel):
    """One square of the rewards heatmap: what happened on this local day."""

    date: str
    alert: bool
    resolved: bool
    checked: bool


class AlertTimelineEntry(BaseModel):
    id: str
    triggered_at: datetime
    device_name: str
    asset_name: str | None
    severity: IncidentSeverity
    status: IncidentStatus


@router.get("/security-heatmap", response_model=list[SecurityDay])
def security_heatmap(
    days: int = Query(default=28, ge=7, le=120),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[SecurityDay]:
    """Per-day activity, oldest first: alerts raised, cases closed, and daily check-ins."""
    tz = ZoneInfo(get_settings().app_timezone)
    today = datetime.now(tz).date()
    start = today - timedelta(days=days - 1)
    since = datetime.combine(start, datetime.min.time(), tzinfo=tz)

    def local_dates(rows) -> set:
        return {value.astimezone(tz).date() for (value,) in rows if value is not None}

    alerts = local_dates(
        db.query(Incident.triggered_at).filter(Incident.user_id == current_user.id, Incident.triggered_at >= since)
    )
    resolved = local_dates(
        db.query(Incident.resolved_at).filter(Incident.user_id == current_user.id, Incident.resolved_at >= since)
    )
    checked = local_dates(
        db.query(XPTransaction.created_at).filter(
            XPTransaction.user_id == current_user.id,
            XPTransaction.reference_type == "daily_check",
            XPTransaction.created_at >= since,
        )
    )
    return [
        SecurityDay(date=day.isoformat(), alert=day in alerts, resolved=day in resolved, checked=day in checked)
        for day in (start + timedelta(days=i) for i in range(days))
    ]


@router.get("/alert-timeline", response_model=list[AlertTimelineEntry])
def alert_timeline(
    limit: int = Query(default=10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[AlertTimelineEntry]:
    rows = (
        db.query(Incident, Device.name, Asset.name)
        .join(Device, Incident.device_id == Device.id)
        .outerjoin(Asset, Incident.asset_id == Asset.id)
        .filter(Incident.user_id == current_user.id)
        .order_by(Incident.triggered_at.desc())
        .limit(limit)
        .all()
    )
    return [
        AlertTimelineEntry(
            id=str(incident.id),
            triggered_at=incident.triggered_at,
            device_name=device_name,
            asset_name=asset_name,
            severity=incident.severity,
            status=incident.status,
        )
        for incident, device_name, asset_name in rows
    ]
