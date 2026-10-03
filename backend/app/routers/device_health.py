from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.device import Device
from app.models.device_health import DeviceHealth
from app.models.enums import DeviceStatus
from app.models.user import User
from app.schemas.device_health import DeviceHealthIn, DeviceHealthOut
from app.services.realtime import publish_device

router = APIRouter(prefix="/device-health", tags=["device-health"])


@router.post("", response_model=DeviceHealthOut, status_code=status.HTTP_201_CREATED)
def ingest_device_health(payload: DeviceHealthIn, db: Session = Depends(get_db)) -> DeviceHealth:
    device = db.query(Device).filter(Device.device_uid == payload.device_uid).first()
    if device is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Unknown device_uid")

    now = datetime.now(timezone.utc)
    record = DeviceHealth(
        device_id=device.id,
        status=payload.status,
        battery_level=payload.battery_level,
        wifi_rssi=payload.wifi_rssi,
        uptime_seconds=payload.uptime_seconds,
        firmware_version=payload.firmware_version,
        recorded_at=now,
    )
    status_changed = device.status != payload.status
    device.status = payload.status
    device.last_seen_at = now
    if payload.firmware_version:
        device.firmware_version = payload.firmware_version
    if payload.battery_level is not None:
        device.battery_level = payload.battery_level
    if payload.wifi_rssi is not None:
        device.wifi_rssi = payload.wifi_rssi

    db.add(record)
    db.commit()
    db.refresh(record)

    publish_device(
        device,
        {"type": "device_health", "health": DeviceHealthOut.model_validate(record).model_dump(mode="json")},
    )
    if status_changed:
        publish_device(device, {"type": "device_status", "device_id": str(device.id), "status": device.status.value})

    return record


@router.get("/{device_id}", response_model=list[DeviceHealthOut])
def list_device_health(
    device_id: UUID,
    limit: int = Query(default=100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[DeviceHealth]:
    device = db.get(Device, device_id)
    if device is None or device.owner_id != current_user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Device not found")

    return (
        db.query(DeviceHealth)
        .filter(DeviceHealth.device_id == device_id)
        .order_by(DeviceHealth.recorded_at.desc())
        .limit(limit)
        .all()
    )
