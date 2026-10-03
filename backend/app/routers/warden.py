from collections import defaultdict
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Query as SAQuery
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import require_warden
from app.models.asset import Asset
from app.models.device import Device
from app.models.enums import DeviceStatus, IncidentSeverity, IncidentStatus, UserRole
from app.models.incident import Incident
from app.models.notice import Notice
from app.models.user import User
from app.schemas.warden import (
    BlockStat,
    NoticeCreateIn,
    NoticeOut,
    RoomDeviceOut,
    RoomOut,
    RoomStudentOut,
    WardenAnalyticsOut,
    WardenIncidentOut,
)
from app.services.incidents import ACTIVE_STATUSES
from app.services import notices as notice_service

router = APIRouter(prefix="/warden", tags=["warden"])

_SEVERITY_RANK = {
    IncidentSeverity.CRITICAL: 0,
    IncidentSeverity.HIGH: 1,
    IncidentSeverity.MEDIUM: 2,
    IncidentSeverity.LOW: 3,
}


def _students(db: Session, warden: User) -> SAQuery:
    """Students this warden is responsible for: their block, or the whole hostel if unassigned."""
    query = db.query(User).filter(User.role == UserRole.STUDENT)
    if warden.hostel_block:
        query = query.filter(User.hostel_block == warden.hostel_block)
    return query


@router.get("/incidents", response_model=list[WardenIncidentOut])
def hostel_incidents(
    scope: str = Query(default="active", pattern="^(active|all)$"),
    limit: int = Query(default=100, ge=1, le=500),
    warden: User = Depends(require_warden),
    db: Session = Depends(get_db),
) -> list[WardenIncidentOut]:
    """Live board: active incidents sorted by severity then age (oldest unanswered first)."""
    student_ids = [s.id for s in _students(db, warden).with_entities(User.id)]
    query = (
        db.query(Incident, User, Device, Asset)
        .join(User, Incident.user_id == User.id)
        .join(Device, Incident.device_id == Device.id)
        .outerjoin(Asset, Incident.asset_id == Asset.id)
        .filter(Incident.user_id.in_(student_ids))
    )
    if scope == "active":
        query = query.filter(Incident.status.in_(ACTIVE_STATUSES))
    rows = query.order_by(Incident.triggered_at.desc()).limit(limit).all()

    if scope == "active":
        rows.sort(key=lambda r: (_SEVERITY_RANK[r[0].severity], r[0].triggered_at))

    return [
        WardenIncidentOut(
            id=incident.id,
            title=incident.title,
            status=incident.status,
            severity=incident.severity,
            triggered_at=incident.triggered_at,
            resolved_at=incident.resolved_at,
            student_id=student.id,
            student_name=student.full_name,
            room_number=student.room_number,
            hostel_block=student.hostel_block,
            phone=student.phone,
            device_name=device.name,
            asset_name=asset.name if asset else None,
        )
        for incident, student, device, asset in rows
    ]


@router.get("/rooms", response_model=list[RoomOut])
def rooms(warden: User = Depends(require_warden), db: Session = Depends(get_db)) -> list[RoomOut]:
    """Every occupied room, with a single state colour for the grid: alert > offline > armed > idle."""
    students = _students(db, warden).all()
    ids = [s.id for s in students]
    devices = db.query(Device).filter(Device.owner_id.in_(ids)).all() if ids else []
    assets = db.query(Asset).filter(Asset.owner_id.in_(ids)).all() if ids else []
    open_counts: dict = defaultdict(int)
    if ids:
        for (user_id,) in (
            db.query(Incident.user_id).filter(Incident.user_id.in_(ids), Incident.status.in_(ACTIVE_STATUSES)).all()
        ):
            open_counts[user_id] += 1

    by_room: dict[tuple, list[User]] = defaultdict(list)
    for student in students:
        by_room[(student.hostel_block, student.room_number)].append(student)

    result: list[RoomOut] = []
    for (block, room), occupants in by_room.items():
        occupant_ids = {s.id for s in occupants}
        room_devices = [d for d in devices if d.owner_id in occupant_ids]
        room_assets = [a for a in assets if a.owner_id in occupant_ids]
        armed = sum(1 for a in room_assets if a.is_armed)
        incidents = sum(open_counts[i] for i in occupant_ids)
        if incidents:
            state = "alert"
        elif any(d.status == DeviceStatus.OFFLINE for d in room_devices):
            state = "offline"
        elif armed:
            state = "armed"
        else:
            state = "idle"
        result.append(
            RoomOut(
                hostel_block=block,
                room_number=room,
                state=state,
                students=[RoomStudentOut(id=s.id, full_name=s.full_name, phone=s.phone) for s in occupants],
                devices=[
                    RoomDeviceOut(id=d.id, name=d.name, status=d.status, last_seen_at=d.last_seen_at)
                    for d in room_devices
                ],
                armed_assets=armed,
                total_assets=len(room_assets),
                open_incidents=incidents,
            )
        )
    result.sort(key=lambda r: (r.hostel_block or "~", r.room_number or "~"))
    return result


@router.get("/analytics", response_model=WardenAnalyticsOut)
def hostel_analytics(warden: User = Depends(require_warden), db: Session = Depends(get_db)) -> WardenAnalyticsOut:
    students = _students(db, warden).all()
    ids = [s.id for s in students]
    block_of = {s.id: s.hostel_block or "Unassigned" for s in students}
    since = datetime.now(timezone.utc) - timedelta(days=30)
    tz = ZoneInfo(get_settings().app_timezone)

    devices = db.query(Device).filter(Device.owner_id.in_(ids)).all() if ids else []
    incidents = db.query(Incident).filter(Incident.user_id.in_(ids)).all() if ids else []
    recent = [i for i in incidents if i.triggered_at >= since]

    by_block: dict[str, int] = defaultdict(int)
    by_hour = [0] * 24
    for incident in recent:
        by_block[block_of[incident.user_id]] += 1
        by_hour[incident.triggered_at.astimezone(tz).hour] += 1

    closed = [i for i in recent if i.resolved_at is not None]
    false_alarms = sum(1 for i in closed if i.status == IncidentStatus.FALSE_ALARM)
    response = [(i.resolved_at - i.triggered_at).total_seconds() for i in closed]

    return WardenAnalyticsOut(
        students=len(students),
        devices_total=len(devices),
        devices_online=sum(1 for d in devices if d.status == DeviceStatus.ONLINE),
        open_incidents=sum(1 for i in incidents if i.status in ACTIVE_STATUSES),
        incidents_30d=len(recent),
        false_alarm_rate=round(false_alarms / len(closed) * 100, 1) if closed else 0.0,
        avg_response_seconds=sum(response) / len(response) if response else None,
        by_block=[BlockStat(hostel_block=b, incidents=n) for b, n in sorted(by_block.items())],
        by_hour=by_hour,
    )


@router.post("/notices", response_model=NoticeOut, status_code=status.HTTP_201_CREATED)
def broadcast_notice(
    payload: NoticeCreateIn, warden: User = Depends(require_warden), db: Session = Depends(get_db)
) -> NoticeOut:
    """Sends a notice to every student in a block (default: the warden's own block, or everyone)."""
    block = payload.hostel_block if payload.hostel_block is not None else warden.hostel_block
    block = (block or "").strip().upper() or None
    if warden.hostel_block and block != warden.hostel_block:
        raise HTTPException(status.HTTP_403_FORBIDDEN, f"You can only send notices to block {warden.hostel_block}")
    notice = Notice(
        warden_id=warden.id, hostel_block=block, title=payload.title.strip(), body=payload.body.strip(), priority=payload.priority
    )
    db.add(notice)
    db.commit()
    db.refresh(notice)
    return notice_service.broadcast(db, warden, notice)


@router.delete("/notices/{notice_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notice(notice_id: UUID, warden: User = Depends(require_warden), db: Session = Depends(get_db)) -> None:
    """Withdraws a notice from every student. Block wardens can only withdraw their block's notices."""
    notice = db.get(Notice, notice_id)
    if notice is None or (warden.hostel_block and notice.hostel_block != warden.hostel_block):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Notice not found")
    notice_service.delete(db, notice)
