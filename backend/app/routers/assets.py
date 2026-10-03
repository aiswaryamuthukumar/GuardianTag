from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.asset import Asset
from app.models.device import Device
from app.models.user import User
from app.schemas.asset import AssetCreateIn, AssetOut, AssetUpdateIn
from app.services.gamification import award_xp, evaluate_gamification
from app.services.realtime import publish_user

router = APIRouter(prefix="/assets", tags=["assets"])


class ArmAllIn(BaseModel):
    armed: bool


def _get_owned_asset(db: Session, user: User, asset_id: UUID) -> Asset:
    asset = db.get(Asset, asset_id)
    if asset is None or asset.owner_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Asset not found")
    return asset


def _check_device(db: Session, user: User, device_id: UUID | None) -> None:
    if device_id is None:
        return
    device = db.get(Device, device_id)
    if device is None or device.owner_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Device not found")


def _publish(asset: Asset) -> None:
    publish_user(asset.owner_id, {"type": "asset_updated", "asset": AssetOut.model_validate(asset).model_dump(mode="json")})


def _reward_arming(db: Session, user: User, asset: Asset) -> None:
    award_xp(db, user, 5, f"Armed {asset.name}", reference_type="asset_arm", reference_id=asset.id)


@router.get("", response_model=list[AssetOut])
def list_assets(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[Asset]:
    return db.query(Asset).filter(Asset.owner_id == current_user.id).order_by(Asset.created_at).all()


@router.post("", response_model=AssetOut, status_code=status.HTTP_201_CREATED)
def create_asset(
    payload: AssetCreateIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Asset:
    _check_device(db, current_user, payload.device_id)
    asset = Asset(owner_id=current_user.id, **payload.model_dump())
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset


@router.post("/arm-all", response_model=list[AssetOut])
def arm_all(
    payload: ArmAllIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Asset]:
    """Guardian Mode master switch: arms or disarms every belonging at once."""
    assets = db.query(Asset).filter(Asset.owner_id == current_user.id).all()
    newly_armed = [a for a in assets if payload.armed and not a.is_armed]
    for asset in assets:
        asset.is_armed = payload.armed
    db.commit()
    for asset in newly_armed:
        _reward_arming(db, current_user, asset)
    if newly_armed:
        evaluate_gamification(db, current_user)
    for asset in assets:
        db.refresh(asset)
        _publish(asset)
    return assets


@router.get("/{asset_id}", response_model=AssetOut)
def get_asset(
    asset_id: UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> Asset:
    return _get_owned_asset(db, current_user, asset_id)


@router.patch("/{asset_id}", response_model=AssetOut)
def update_asset(
    asset_id: UUID,
    payload: AssetUpdateIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Asset:
    asset = _get_owned_asset(db, current_user, asset_id)
    updates = payload.model_dump(exclude_unset=True)
    if "device_id" in updates:
        _check_device(db, current_user, updates["device_id"])
    newly_armed = updates.get("is_armed") is True and not asset.is_armed

    for field, value in updates.items():
        setattr(asset, field, value)
    db.commit()
    db.refresh(asset)

    if newly_armed:
        _reward_arming(db, current_user, asset)
        evaluate_gamification(db, current_user)
        db.refresh(asset)
    _publish(asset)
    return asset


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_asset(
    asset_id: UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> None:
    asset = _get_owned_asset(db, current_user, asset_id)
    db.delete(asset)
    db.commit()
