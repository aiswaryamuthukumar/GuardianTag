import secrets

import httpx

from app.core.config import get_settings


def send_telegram_message(chat_id: str, text: str) -> bool:
    settings = get_settings()
    if not settings.telegram_bot_token or not chat_id:
        return False

    url = f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendMessage"
    try:
        response = httpx.post(url, json={"chat_id": chat_id, "text": text}, timeout=5.0)
        return response.status_code == 200
    except httpx.HTTPError:
        return False


def generate_link_code() -> str:
    return secrets.token_hex(4)  # 8 hex chars - short enough to type, plenty of entropy for a link code


def telegram_deep_link(link_code: str) -> str | None:
    settings = get_settings()
    if not settings.telegram_bot_username:
        return None
    return f"https://t.me/{settings.telegram_bot_username}?start={link_code}"
