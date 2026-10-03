"""Demo Controls: act out what the ESP32 would send, from inside the app.

These are not fakes. Each action goes through exactly the same ingest,
incident lifecycle, notification and WebSocket path as a real device, so the
dashboard, emergency screen and warden board react live. They only act on the
caller's own devices. Turn them off with DEMO_TOOLS_ENABLED=false.
"""

import random
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.device import Device
from app.models.enums import DeviceStatus, IncidentStatus, NotificationType, SensorEventType
from app.models.incident import Incident
from app.models.user import User
from app.routers.device_health import ingest_device_health
from app.routers.incidents import resolve_incident
from app.schemas.device import DeviceOut
from app.schemas.device_health import DeviceHealthIn
from app.schemas.incident import IncidentOut, IncidentResolveIn
from app.services.incidents import ACTIVE_STATUSES
from app.services.ingest import record_event
from app.services.notify import notify_user
from app.services.realtime import publish_device


def _require_enabled() -> None:
    if not get_settings().demo_tools_enabled:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Demo tools are disabled")


router = APIRouter(prefix="/demo", tags=["demo"], dependencies=[Depends(_require_enabled)])


class DemoTarget(BaseModel):
    device_id: UUID | None = None


class SimulateOut(BaseModel):
    ignored: bool  # true when Guardian Mode is off for everything on the device
    incident: IncidentOut | None = None


_NEXT_STATUS = {
    DeviceStatus.ONLINE: DeviceStatus.DEGRADED,
    DeviceStatus.DEGRADED: DeviceStatus.OFFLINE,
    DeviceStatus.OFFLINE: DeviceStatus.ONLINE,
    DeviceStatus.UNPAIRED: DeviceStatus.ONLINE,
}


def _pick_device(db: Session, user: User, target: DemoTarget | None) -> Device:
    query = db.query(Device).filter(Device.owner_id == user.id)
    if target and target.device_id:
        query = query.filter(Device.id == target.device_id)
    device = query.order_by(Device.created_at).first()
    if device is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Pair a device first")
    return device


@router.post("/simulate-incident", response_model=SimulateOut)
def simulate_incident(
    target: DemoTarget | None = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> SimulateOut:
    """Someone moves and opens the bag: movement, hall trigger, then the firmware's dual-verified event."""
    device = _pick_device(db, current_user, target)
    record_event(db, device, SensorEventType.MOVEMENT)
    record_event(db, device, SensorEventType.HALL_TRIGGER)
    event, incident = record_event(db, device, SensorEventType.DUAL_VERIFIED)
    return SimulateOut(
        ignored=bool((event.payload or {}).get("ignored")),
        incident=IncidentOut.model_validate(incident) if incident else None,
    )


@router.post("/disarm", response_model=IncidentOut | None)
def disarm_on_device(
    target: DemoTarget | None = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> Incident | None:
    """The owner presses the device's button within the alert window: auto false alarm, +5 XP."""
    device = _pick_device(db, current_user, target)
    _, incident = record_event(db, device, SensorEventType.DISARMED)
    return incident


@router.post("/resolve-latest", response_model=IncidentOut | None)
def resolve_latest(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Incident | None:
    incident = (
        db.query(Incident)
        .filter(Incident.user_id == current_user.id, Incident.status.in_(ACTIVE_STATUSES))
        .order_by(Incident.triggered_at.desc())
        .first()
    )
    if incident is None:
        return None
    return resolve_incident(
        incident.id,
        IncidentResolveIn(status=IncidentStatus.RESOLVED, resolution_notes="Resolved from Demo Controls."),
        current_user,
        db,
    )


@router.post("/heartbeat", response_model=DeviceOut)
def send_heartbeat(
    target: DemoTarget | None = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> Device:
    """A 60-second heartbeat with realistic readings, as the firmware sends."""
    device = _pick_device(db, current_user, target)
    ingest_device_health(
        DeviceHealthIn(
            device_uid=device.device_uid,
            status=DeviceStatus.ONLINE,
            wifi_rssi=random.randint(-75, -45),
            battery_level=max(5, (device.battery_level or 100) - random.randint(0, 3)),
            uptime_seconds=random.randint(600, 90_000),
            firmware_version=device.firmware_version or "1.0.0",
        ),
        db,
    )
    db.refresh(device)
    return device


@router.post("/cycle-device", response_model=DeviceOut)
def cycle_device(
    target: DemoTarget | None = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> Device:
    """Online, then degraded, then offline, then back: exercises the device-health UI and the offline alert."""
    device = _pick_device(db, current_user, target)
    device.status = _NEXT_STATUS[device.status]
    db.commit()
    db.refresh(device)
    publish_device(device, {"type": "device_status", "device_id": str(device.id), "status": device.status.value})
    if device.status == DeviceStatus.OFFLINE:
        notify_user(
            db,
            current_user,
            NotificationType.DEVICE_HEALTH,
            title=f"{device.name} went offline",
            body="No heartbeat for a few minutes. Check its battery and Wi-Fi.",
            data={"device_id": str(device.id)},
        )
    return device
