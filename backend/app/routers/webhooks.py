from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.models.user import User
from app.services.telegram import send_telegram_message

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


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
        send_telegram_message(str(chat_id), "That link code is invalid or has expired. Generate a new one from the GuardianTag app.")
        return

    user.telegram_chat_id = str(chat_id)
    user.telegram_link_code = None
    db.commit()
    send_telegram_message(str(chat_id), "GuardianTag is linked! You'll get emergency alerts here from now on.")
