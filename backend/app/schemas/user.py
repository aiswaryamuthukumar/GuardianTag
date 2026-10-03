import re

from pydantic import BaseModel, Field, field_validator

from app.models.enums import GuardianLevel, UserRole
from app.schemas.common import ORMBase, TimestampedORMBase

_HHMM = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")


class UserOut(TimestampedORMBase):
    email: str
    full_name: str
    room_number: str | None = None
    hostel_block: str | None = None
    phone: str | None = None
    avatar_url: str | None = None
    level: GuardianLevel
    role: UserRole
    telegram_chat_id: str | None = None
    notify_push: bool
    notify_telegram: bool
    quiet_start: str | None = None
    quiet_end: str | None = None
    has_push_token: bool = False


_EMAIL = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


class RegisterIn(BaseModel):
    email: str
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=2, max_length=255)
    role: UserRole = UserRole.STUDENT
    # Required when role is warden (hostel staff); ignored for students.
    invite_code: str | None = None
    hostel_block: str | None = Field(default=None, max_length=50)
    room_number: str | None = Field(default=None, max_length=50)
    phone: str | None = Field(default=None, max_length=30)

    @field_validator("email")
    @classmethod
    def _email(cls, v: str) -> str:
        v = v.strip().lower()
        if not _EMAIL.match(v):
            raise ValueError("Enter a valid email address")
        return v


class LoginIn(BaseModel):
    email: str
    password: str
    # Which tab the user signed in from; must match the account's role.
    role: UserRole = UserRole.STUDENT

    @field_validator("email")
    @classmethod
    def _email(cls, v: str) -> str:
        return v.strip().lower()


class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


class UserUpdateIn(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=255)
    room_number: str | None = Field(default=None, max_length=50)
    hostel_block: str | None = Field(default=None, max_length=50)
    phone: str | None = Field(default=None, max_length=30)
    avatar_url: str | None = None
    expo_push_token: str | None = None
    notify_push: bool | None = None
    notify_telegram: bool | None = None
    quiet_start: str | None = None
    quiet_end: str | None = None

    @field_validator("quiet_start", "quiet_end")
    @classmethod
    def _hhmm(cls, v: str | None) -> str | None:
        if v not in (None, "") and not _HHMM.match(v):
            raise ValueError("Use 24-hour HH:MM")
        return v or None


class WardenContactOut(ORMBase):
    full_name: str
    phone: str | None = None
    hostel_block: str | None = None


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class TelegramLinkCodeOut(BaseModel):
    link_code: str
    deep_link: str | None = None
