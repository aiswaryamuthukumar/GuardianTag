import uuid

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPKMixin
from app.models.enums import GuardianLevel, UserRole
from app.models.pg_enums import guardian_level_enum, user_role_enum


class User(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)  # stored lower-case
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)  # bcrypt
    full_name: Mapped[str] = mapped_column(String(255))
    room_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    level: Mapped[GuardianLevel] = mapped_column(guardian_level_enum, default=GuardianLevel.ROOKIE)
    role: Mapped[UserRole] = mapped_column(user_role_enum, default=UserRole.STUDENT, index=True)
    hostel_block: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)

    # Delivery preferences. Quiet hours ("HH:MM", app timezone) mute non-incident pushes only;
    # security alerts always go through.
    notify_push: Mapped[bool] = mapped_column(Boolean, default=True)
    notify_telegram: Mapped[bool] = mapped_column(Boolean, default=True)
    quiet_start: Mapped[str | None] = mapped_column(String(5), nullable=True)
    quiet_end: Mapped[str | None] = mapped_column(String(5), nullable=True)

    expo_push_token: Mapped[str | None] = mapped_column(String(255), nullable=True)
    telegram_chat_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    telegram_link_code: Mapped[str | None] = mapped_column(String(16), unique=True, nullable=True)

    @property
    def has_push_token(self) -> bool:
        return bool(self.expo_push_token)

    devices: Mapped[list["Device"]] = relationship(back_populates="owner", cascade="all, delete-orphan")
    assets: Mapped[list["Asset"]] = relationship(back_populates="owner", cascade="all, delete-orphan")
    incidents: Mapped[list["Incident"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    notifications: Mapped[list["Notification"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    xp_transactions: Mapped[list["XPTransaction"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    user_achievements: Mapped[list["UserAchievement"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    challenge_completions: Mapped[list["ChallengeCompletion"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    security_score: Mapped["SecurityScore | None"] = relationship(
        back_populates="user", cascade="all, delete-orphan", uselist=False
    )
