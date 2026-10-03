from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.asset import Asset
from app.models.schedule import ArmSchedule
from app.models.user import User
from app.schemas.schedule import ArmScheduleCreateIn, ArmScheduleOut, ArmScheduleUpdateIn

router = APIRouter(prefix="/schedules", tags=["schedules"])


def _get_owned_schedule(db: Session, user: User, schedule_id: UUID) -> ArmSchedule:
    schedule = db.get(ArmSchedule, schedule_id)
    if schedule is None or schedule.owner_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Schedule not found")
    return schedule


@router.get("", response_model=list[ArmScheduleOut])
def list_schedules(
    asset_id: UUID | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ArmSchedule]:
    query = db.query(ArmSchedule).filter(ArmSchedule.owner_id == current_user.id)
    if asset_id is not None:
        query = query.filter(ArmSchedule.asset_id == asset_id)
    return query.order_by(ArmSchedule.start_time).all()


@router.post("", response_model=ArmScheduleOut, status_code=status.HTTP_201_CREATED)
def create_schedule(
    payload: ArmScheduleCreateIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ArmSchedule:
    asset = db.get(Asset, payload.asset_id)
    if asset is None or asset.owner_id != current_user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Asset not found")
    if payload.start_time == payload.end_time:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Start and end time must differ")
    schedule = ArmSchedule(owner_id=current_user.id, **payload.model_dump())
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule


@router.patch("/{schedule_id}", response_model=ArmScheduleOut)
def update_schedule(
    schedule_id: UUID,
    payload: ArmScheduleUpdateIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ArmSchedule:
    schedule = _get_owned_schedule(db, current_user, schedule_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(schedule, field, value)
    if schedule.start_time == schedule.end_time:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Start and end time must differ")
    schedule.last_active = None  # re-evaluate from scratch on the next monitor pass
    db.commit()
    db.refresh(schedule)
    return schedule


@router.delete("/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_schedule(
    schedule_id: UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> None:
    schedule = _get_owned_schedule(db, current_user, schedule_id)
    db.delete(schedule)
    db.commit()
