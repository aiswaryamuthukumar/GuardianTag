from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.device import Device
from app.models.enums import DeviceStatus
from app.models.user import User
from app.schemas.device import DeviceOut, DevicePairIn, DeviceUpdateIn

router = APIRouter(prefix="/devices", tags=["devices"])


def _get_owned_device(db: Session, user: User, device_id: UUID) -> Device:
    device = db.get(Device, device_id)
    if device is None or device.owner_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Device not found")
    return device


@router.get("", response_model=list[DeviceOut])
def list_devices(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[Device]:
    return db.query(Device).filter(Device.owner_id == current_user.id).all()


@router.post("/pair", response_model=DeviceOut, status_code=status.HTTP_201_CREATED)
def pair_device(
    payload: DevicePairIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Device:
    existing = db.query(Device).filter(Device.device_uid == payload.device_uid).first()
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "Device already paired")

    device = Device(
        owner_id=current_user.id,
        name=payload.name,
        device_uid=payload.device_uid,
        pairing_code=payload.pairing_code,
        status=DeviceStatus.ONLINE,
    )
    db.add(device)
    db.commit()
    db.refresh(device)
    return device


@router.get("/{device_id}", response_model=DeviceOut)
def get_device(
    device_id: UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> Device:
    return _get_owned_device(db, current_user, device_id)


@router.patch("/{device_id}", response_model=DeviceOut)
def update_device(
    device_id: UUID,
    payload: DeviceUpdateIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Device:
    device = _get_owned_device(db, current_user, device_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(device, field, value)
    db.commit()
    db.refresh(device)
    return device


@router.delete("/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
def unpair_device(
    device_id: UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> None:
    device = _get_owned_device(db, current_user, device_id)
    db.delete(device)
    db.commit()
