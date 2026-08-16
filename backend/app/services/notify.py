from sqlalchemy.orm import Session

from app.models.enums import NotificationType
from app.models.notification import Notification
from app.models.user import User
from app.services.push import send_expo_push
from app.services.telegram import send_telegram_message


def notify_user(
    db: Session,
    user: User,
    notif_type: NotificationType,
    title: str,
    body: str,
    data: dict | None = None,
    telegram_alert: bool = False,
) -> Notification:
    """Records a Notification row and best-effort dispatches it to push/Telegram.

    Delivery failures never raise - a user without a linked push token or
    Telegram chat still gets the in-app notification record and the live
    WebSocket push; this is purely an additional delivery channel.
    """
    notification = Notification(user_id=user.id, type=notif_type, title=title, body=body, data=data)
    db.add(notification)
    db.commit()
    db.refresh(notification)

    if user.expo_push_token:
        send_expo_push(user.expo_push_token, title, body, data)
    if telegram_alert and user.telegram_chat_id:
        send_telegram_message(user.telegram_chat_id, f"{title}\n{body}")

    return notification
