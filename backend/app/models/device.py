import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPKMixin
from app.models.enums import DeviceStatus
from app.models.pg_enums import device_status_enum


class Device(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "devices"

    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(255))
    device_uid: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    pairing_code: Mapped[str | None] = mapped_column(String(16), nullable=True)
    status: Mapped[DeviceStatus] = mapped_column(device_status_enum, default=DeviceStatus.UNPAIRED)
    firmware_version: Mapped[str | None] = mapped_column(String(32), nullable=True)
    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    owner: Mapped["User"] = relationship(back_populates="devices")
    assets: Mapped[list["Asset"]] = relationship(back_populates="device")
    sensor_events: Mapped[list["SensorEvent"]] = relationship(
        back_populates="device", cascade="all, delete-orphan"
    )
    health_logs: Mapped[list["DeviceHealth"]] = relationship(
        back_populates="device", cascade="all, delete-orphan"
    )
    incidents: Mapped[list["Incident"]] = relationship(back_populates="device")
