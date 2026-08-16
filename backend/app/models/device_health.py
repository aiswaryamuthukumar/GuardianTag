import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import UUIDPKMixin
from app.models.enums import DeviceStatus
from app.models.pg_enums import device_status_enum


class DeviceHealth(UUIDPKMixin, Base):
    __tablename__ = "device_health"

    device_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("devices.id", ondelete="CASCADE"), index=True
    )
    status: Mapped[DeviceStatus] = mapped_column(device_status_enum)
    battery_level: Mapped[int | None] = mapped_column(Integer, nullable=True)
    wifi_rssi: Mapped[int | None] = mapped_column(Integer, nullable=True)
    uptime_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    firmware_version: Mapped[str | None] = mapped_column(String(32), nullable=True)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)

    device: Mapped["Device"] = relationship(back_populates="health_logs")
