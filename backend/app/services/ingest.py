import logging
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.device import Device
from app.models.enums import DeviceStatus, SensorEventType
from app.models.incident import Incident
from app.models.sensor_event import SensorEvent
from app.schemas.sensor_event import SensorEventOut
from app.services.incidents import apply_event_to_incident_lifecycle, resolve_arming
from app.services.realtime import publish_device

logger = logging.getLogger(__name__)

# The ESP32 has no NTP sync: its RTC is set from the build machine's *local*
# time (IST), which read as UTC lands ~5.5h in the future. Rather than reject
# such events (the firmware would retry and then drop a real alert), we fall
# back to our own receive time. Past timestamps are kept up to a week, since
# they can be a genuine backlog from a device that was offline.
MAX_FUTURE_SKEW = timedelta(minutes=5)
MAX_PAST_AGE = timedelta(days=7)


def record_event(
    db: Session,
    device: Device,
    event_type: SensorEventType,
    device_timestamp: datetime | None = None,
    asset_id: UUID | None = None,
    payload: dict | None = None,
) -> tuple[SensorEvent, Incident | None]:
    """The one path every sensor event takes, whether from the ESP32 or Demo Controls:
    store it, stream it live, then run the incident lifecycle."""
    now = datetime.now(timezone.utc)
    device_timestamp = device_timestamp or now
    event_payload = dict(payload or {})
    if device_timestamp - now > MAX_FUTURE_SKEW or now - device_timestamp > MAX_PAST_AGE:
        event_payload["clock_skew_seconds"] = int((device_timestamp - now).total_seconds())
        device_timestamp = now

    if event_type == SensorEventType.DUAL_VERIFIED and not resolve_arming(db, device, asset_id)[0]:
        # Guardian Mode is off in the app for everything on this device.
        event_payload["ignored"] = "disarmed"

    event = SensorEvent(
        device_id=device.id,
        asset_id=asset_id,
        event_type=event_type,
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

    incident = None
    try:
        incident = apply_event_to_incident_lifecycle(db, device, event)
    except Exception:
        db.rollback()
        logger.exception("Incident lifecycle failed for event %s", event.id)
    return event, incident
