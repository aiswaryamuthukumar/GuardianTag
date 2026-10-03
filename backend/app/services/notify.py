import logging
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, time
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.enums import NotificationType, UserRole
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationOut
from app.services.push import send_expo_push
from app.services.realtime import publish_user
from app.services.telegram import send_telegram_message

logger = logging.getLogger(__name__)

# Push and Telegram are slow third-party HTTP calls; never make a request (or
# the sensor ingest path) wait on them.
_delivery_pool = ThreadPoolExecutor(max_workers=4, thread_name_prefix="notify")


def _parse_hhmm(value: str | None) -> time | None:
    if not value:
        return None
    try:
        hours, minutes = value.split(":")
        return time(int(hours), int(minutes))
    except ValueError:
        return None


def in_quiet_hours(user: User, now: datetime | None = None) -> bool:
    start, end = _parse_hhmm(user.quiet_start), _parse_hhmm(user.quiet_end)
    if start is None or end is None or start == end:
        return False
    local = (now or datetime.now(ZoneInfo(get_settings().app_timezone))).time()
    if start < end:
        return start <= local < end
    return local >= start or local < end  # overnight window, e.g. 23:00-07:00


def _deliver(push_token: str | None, chat_id: str | None, title: str, body: str, data: dict | None) -> None:
    try:
        if push_token:
            send_expo_push(push_token, title, body, data)
        if chat_id:
            send_telegram_message(chat_id, f"{title}\n{body}")
    except Exception:
        logger.exception("Notification delivery failed")


def notify_user(
    db: Session,
    user: User,
    notif_type: NotificationType,
    title: str,
    body: str,
    data: dict | None = None,
    telegram_alert: bool = False,
) -> Notification:
    """Records a Notification row, pushes it live to the user's socket, and
    best-effort dispatches it to Expo push / Telegram in the background.

    Honours the user's channel toggles. Quiet hours mute everything except
    security incidents. Delivery failures never raise.
    """
    notification = Notification(user_id=user.id, type=notif_type, title=title, body=body, data=data)
    db.add(notification)
    db.commit()
    db.refresh(notification)

    publish_user(
        user.id,
        {"type": "notification", "notification": NotificationOut.model_validate(notification).model_dump(mode="json")},
    )

    muted = notif_type != NotificationType.INCIDENT and in_quiet_hours(user)
    push_token = user.expo_push_token if user.notify_push and not muted else None
    chat_id = user.telegram_chat_id if telegram_alert and user.notify_telegram and not muted else None
    if push_token or chat_id:
        _delivery_pool.submit(_deliver, push_token, chat_id, title, body, data)

    return notification


def wardens_for_block(db: Session, hostel_block: str | None) -> list[User]:
    """Wardens responsible for a block: those assigned to it plus hostel-wide (no block) wardens."""
    query = db.query(User).filter(User.role == UserRole.WARDEN)
    if hostel_block:
        query = query.filter((User.hostel_block == hostel_block) | (User.hostel_block.is_(None)))
    else:
        query = query.filter(User.hostel_block.is_(None))
    return query.all()
