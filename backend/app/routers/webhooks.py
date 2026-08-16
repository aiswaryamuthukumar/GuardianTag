from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from svix.webhooks import Webhook, WebhookVerificationError

from app.core.config import get_settings
from app.core.database import get_db
from app.models.user import User
from app.services.telegram import send_telegram_message

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


def _primary_email(data: dict) -> str:
    addresses = data.get("email_addresses") or []
    primary_id = data.get("primary_email_address_id")
    for address in addresses:
        if address.get("id") == primary_id:
            return address.get("email_address", "")
    return addresses[0].get("email_address", "") if addresses else ""


def _full_name(data: dict) -> str:
    return " ".join(filter(None, [data.get("first_name"), data.get("last_name")])) or _primary_email(data)


@router.post("/clerk", status_code=status.HTTP_204_NO_CONTENT)
async def clerk_webhook(request: Request, db: Session = Depends(get_db)) -> None:
    settings = get_settings()
    if not settings.clerk_webhook_secret:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Webhook secret not configured")

    payload = await request.body()
    try:
        event = Webhook(settings.clerk_webhook_secret).verify(payload, dict(request.headers))
    except WebhookVerificationError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid webhook signature") from exc

    event_type = event.get("type")
    data = event.get("data", {})
    clerk_user_id = data.get("id")
    if not clerk_user_id:
        return

    user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()

    if event_type == "user.created" and user is None:
        db.add(User(clerk_user_id=clerk_user_id, email=_primary_email(data), full_name=_full_name(data)))
        db.commit()
    elif event_type == "user.updated" and user is not None:
        user.email = _primary_email(data)
        user.full_name = _full_name(data)
        if data.get("image_url"):
            user.avatar_url = data["image_url"]
        db.commit()
    elif event_type == "user.deleted" and user is not None:
        db.delete(user)
        db.commit()


@router.post("/telegram", status_code=status.HTTP_204_NO_CONTENT)
async def telegram_webhook(request: Request, db: Session = Depends(get_db)) -> None:
    settings = get_settings()
    if not settings.telegram_webhook_secret:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Webhook secret not configured")

    if request.headers.get("x-telegram-bot-api-secret-token") != settings.telegram_webhook_secret:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid webhook secret")

    update = await request.json()
    message = update.get("message") or {}
    text = (message.get("text") or "").strip()
    chat_id = message.get("chat", {}).get("id")

    if not text.startswith("/start ") or chat_id is None:
        return

    link_code = text.removeprefix("/start ").strip()
    user = db.query(User).filter(User.telegram_link_code == link_code).first()
    if user is None:
        send_telegram_message(str(chat_id), "That link code is invalid or has expired. Generate a new one from the HostDost app.")
        return

    user.telegram_chat_id = str(chat_id)
    user.telegram_link_code = None
    db.commit()
    send_telegram_message(str(chat_id), "HostDost is linked! You'll get emergency alerts here from now on.")
