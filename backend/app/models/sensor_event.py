import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import UUIDPKMixin
from app.models.enums import SensorEventType
from app.models.pg_enums import sensor_event_type_enum


class SensorEvent(UUIDPKMixin, Base):
    __tablename__ = "sensor_events"

    device_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("devices.id", ondelete="CASCADE"), index=True
    )
    asset_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("assets.id", ondelete="SET NULL"), nullable=True, index=True
    )
    event_type: Mapped[SensorEventType] = mapped_column(sensor_event_type_enum, index=True)
    payload: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    device_timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)

    device: Mapped["Device"] = relationship(back_populates="sensor_events")
    asset: Mapped["Asset | None"] = relationship(back_populates="sensor_events")
