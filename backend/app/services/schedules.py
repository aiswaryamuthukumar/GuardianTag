import logging
from datetime import datetime

from sqlalchemy.orm import Session

from app.models.asset import Asset
from app.models.enums import NotificationType
from app.models.schedule import ArmSchedule
from app.models.user import User
from app.schemas.asset import AssetOut
from app.services.notify import notify_user
from app.services.realtime import publish_user

logger = logging.getLogger(__name__)


def _day_enabled(mask: int, weekday: int) -> bool:
    return bool(mask >> weekday & 1)


def window_active(schedule: ArmSchedule, local_now: datetime) -> bool:
    """Whether local_now falls inside the schedule's weekly window."""
    now_t, weekday = local_now.time(), local_now.weekday()
    start, end = schedule.start_time, schedule.end_time
    if start < end:
        return _day_enabled(schedule.days_mask, weekday) and start <= now_t < end
    # Overnight window: starts on an enabled day, runs past midnight into the next.
    started_today = _day_enabled(schedule.days_mask, weekday) and now_t >= start
    started_yesterday = _day_enabled(schedule.days_mask, (weekday - 1) % 7) and now_t < end
    return started_today or started_yesterday


def apply_schedules(db: Session, local_now: datetime) -> int:
    """Arms/disarms assets whose schedule window just opened or closed.

    Acts only on transitions (tracked in last_active) so a student who
    manually disarms mid-window isn't overridden on the next pass.
    Returns how many assets changed.
    """
    changed = 0
    for schedule in db.query(ArmSchedule).filter(ArmSchedule.enabled.is_(True)).all():
        active = window_active(schedule, local_now)
        if schedule.last_active is not None and schedule.last_active == active:
            continue
        first_pass = schedule.last_active is None
        schedule.last_active = active
        asset = db.get(Asset, schedule.asset_id)
        # On the very first pass only arm (never disarm something the user armed by hand).
        if asset is None or asset.is_armed == active or (first_pass and not active):
            db.commit()
            continue
        asset.is_armed = active
        db.commit()
        db.refresh(asset)
        changed += 1

        publish_user(asset.owner_id, {"type": "asset_updated", "asset": AssetOut.model_validate(asset).model_dump(mode="json")})
        owner = db.get(User, asset.owner_id)
        if owner is not None:
            notify_user(
                db,
                owner,
                NotificationType.SYSTEM,
                title=f"{asset.name} {'armed' if active else 'disarmed'} by schedule",
                body=f"Guardian Mode schedule {'started' if active else 'ended'} for {asset.name}.",
                data={"asset_id": str(asset.id)},
            )
    return changed
