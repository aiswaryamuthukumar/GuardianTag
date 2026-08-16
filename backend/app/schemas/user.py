from pydantic import BaseModel

from app.models.enums import GuardianLevel
from app.schemas.common import TimestampedORMBase


class UserOut(TimestampedORMBase):
    clerk_user_id: str
    email: str
    full_name: str
    room_number: str | None = None
    phone: str | None = None
    avatar_url: str | None = None
    level: GuardianLevel
    telegram_chat_id: str | None = None


class UserSyncIn(BaseModel):
    email: str
    full_name: str
    room_number: str | None = None
    phone: str | None = None


class UserUpdateIn(BaseModel):
    full_name: str | None = None
    room_number: str | None = None
    phone: str | None = None
    avatar_url: str | None = None
    expo_push_token: str | None = None


class TelegramLinkCodeOut(BaseModel):
    link_code: str
    deep_link: str | None = None
