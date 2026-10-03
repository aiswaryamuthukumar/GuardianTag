import logging
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.limiter import limiter
from app.core.security import get_current_user
from app.models.device import Device
from app.models.enums import DeviceStatus, SensorEventType
from app.models.sensor_event import SensorEvent
from app.models.user import User
from app.schemas.sensor_event import SensorEventIn, SensorEventOut
from app.services.incidents import apply_event_to_incident_lifecycle, resolve_arming
from app.services.realtime import publish_device

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/events", tags=["events"])

# The ESP32 has no NTP sync: its RTC is set from the build machine's *local*
# time (IST), which read as UTC lands ~5.5h in the future. Rather than reject
# such events (the firmware would retry and then drop a real alert), we fall
# back to our own receive time. Past timestamps are kept up to a week, since
# they can be a genuine backlog from a device that was offline.
MAX_FUTURE_SKEW = timedelta(minutes=5)
MAX_PAST_AGE = timedelta(days=7)


@router.post("", response_model=SensorEventOut, status_code=status.HTTP_201_CREATED)
@limiter.limit("100/minute")
def ingest_event(request: Request, payload: SensorEventIn, db: Session = Depends(get_db)) -> SensorEvent:
    """Ingest a sensor event from an ESP32 device (unauthenticated, rate-limited)."""
    device = db.query(Device).filter(Device.device_uid == payload.device_uid).first()
    if device is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Unknown device_uid")
    if device.status == DeviceStatus.UNPAIRED:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Device is unpaired - cannot ingest events")

    now = datetime.now(timezone.utc)
    device_timestamp = payload.device_timestamp
    event_payload = dict(payload.payload or {})
    if device_timestamp - now > MAX_FUTURE_SKEW or now - device_timestamp > MAX_PAST_AGE:
        event_payload["clock_skew_seconds"] = int((device_timestamp - now).total_seconds())
        device_timestamp = now

    if payload.event_type == SensorEventType.DUAL_VERIFIED:
        if not resolve_arming(db, device, payload.asset_id)[0]:
            # Guardian Mode is off in the app for everything on this device.
            event_payload["ignored"] = "disarmed"

    event = SensorEvent(
        device_id=device.id,
        asset_id=payload.asset_id,
        event_type=payload.event_type,
        payload=event_payload or None,
        device_timestamp=device_timestamp,
        received_at=now,
    )
    came_back = device.status == DeviceStatus.OFFLINE
    device.last_seen_at = now
    device.status = DeviceStatus.ONLINE
    db.add(event)
    db.commit()
    db.refresh(event)

    if came_back:
        publish_device(device, {"type": "device_status", "device_id": str(device.id), "status": "online"})

    publish_device(device, {"type": "sensor_event", "event": SensorEventOut.model_validate(event).model_dump(mode="json")})

    try:
        apply_event_to_incident_lifecycle(db, device, event)
    except Exception:
        db.rollback()
        logger.exception("Incident lifecycle failed for event %s", event.id)
    return event


@router.get("", response_model=list[SensorEventOut])
def list_events(
    device_id: UUID | None = Query(default=None),
    asset_id: UUID | None = Query(default=None),
    event_type: SensorEventType | None = Query(default=None),
    limit: int = Query(default=50, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[SensorEvent]:
    query = (
        db.query(SensorEvent)
        .join(Device, SensorEvent.device_id == Device.id)
        .filter(Device.owner_id == current_user.id)
    )
    if device_id is not None:
        query = query.filter(SensorEvent.device_id == device_id)
    if asset_id is not None:
        query = query.filter(SensorEvent.asset_id == asset_id)
    if event_type is not None:
        query = query.filter(SensorEvent.event_type == event_type)
    return query.order_by(SensorEvent.received_at.desc()).limit(limit).all()
