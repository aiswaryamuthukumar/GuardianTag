from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.asset import Asset
from app.models.user import User
from app.schemas.asset import AssetCreateIn, AssetOut, AssetUpdateIn
from app.services.gamification import award_xp, evaluate_gamification

router = APIRouter(prefix="/assets", tags=["assets"])


def _get_owned_asset(db: Session, user: User, asset_id: UUID) -> Asset:
    asset = db.get(Asset, asset_id)
    if asset is None or asset.owner_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Asset not found")
    return asset


@router.get("", response_model=list[AssetOut])
def list_assets(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[Asset]:
    return db.query(Asset).filter(Asset.owner_id == current_user.id).all()


@router.post("", response_model=AssetOut, status_code=status.HTTP_201_CREATED)
def create_asset(
    payload: AssetCreateIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Asset:
    asset = Asset(owner_id=current_user.id, **payload.model_dump())
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset


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
    newly_armed = updates.get("is_armed") is True and not asset.is_armed

    for field, value in updates.items():
        setattr(asset, field, value)
    db.commit()
    db.refresh(asset)

    if newly_armed:
        award_xp(
            db,
            current_user,
            5,
            f"Armed {asset.name}",
            reference_type="asset_arm",
            reference_id=asset.id,
        )
        evaluate_gamification(db, current_user)

    return asset


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_asset(
    asset_id: UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> None:
    asset = _get_owned_asset(db, current_user, asset_id)
    db.delete(asset)
    db.commit()
