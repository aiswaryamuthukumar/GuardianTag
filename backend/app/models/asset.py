import uuid

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPKMixin
from app.models.enums import AssetCategory
from app.models.pg_enums import asset_category_enum


class Asset(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "assets"

    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    device_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("devices.id", ondelete="SET NULL"), nullable=True, index=True
    )
    name: Mapped[str] = mapped_column(String(255))
    category: Mapped[AssetCategory] = mapped_column(asset_category_enum, default=AssetCategory.OTHER)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    photo_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    is_armed: Mapped[bool] = mapped_column(Boolean, default=False)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)

    owner: Mapped["User"] = relationship(back_populates="assets")
    device: Mapped["Device | None"] = relationship(back_populates="assets")
    sensor_events: Mapped[list["SensorEvent"]] = relationship(back_populates="asset")
    incidents: Mapped[list["Incident"]] = relationship(back_populates="asset")
    schedules: Mapped[list["ArmSchedule"]] = relationship(back_populates="asset", cascade="all, delete-orphan")
