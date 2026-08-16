from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.device import Device
from app.models.device_health import DeviceHealth
from app.models.user import User
from app.schemas.device_health import DeviceHealthIn, DeviceHealthOut
from app.ws.manager import manager

router = APIRouter(prefix="/device-health", tags=["device-health"])


@router.post("", response_model=DeviceHealthOut, status_code=status.HTTP_201_CREATED)
async def ingest_device_health(payload: DeviceHealthIn, db: Session = Depends(get_db)) -> DeviceHealth:
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
    device.status = payload.status
    device.last_seen_at = now
    if payload.firmware_version:
        device.firmware_version = payload.firmware_version

    db.add(record)
    db.commit()
    db.refresh(record)

    await manager.broadcast(
        device.id,
        {"type": "device_health", "health": DeviceHealthOut.model_validate(record).model_dump(mode="json")},
    )

    return record


@router.get("/{device_id}", response_model=list[DeviceHealthOut])
def list_device_health(
    device_id: UUID,
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
        .limit(100)
        .all()
    )
