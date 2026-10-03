import uuid
from datetime import time

from sqlalchemy import Boolean, ForeignKey, Integer, Time
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPKMixin


class ArmSchedule(UUIDPKMixin, TimestampMixin, Base):
    """A weekly window during which an asset is automatically armed.

    days_mask is a 7-bit set, bit 0 = Monday ... bit 6 = Sunday. A window whose
    end_time is before its start_time runs overnight into the next day.
    """

    __tablename__ = "arm_schedules"

    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    asset_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("assets.id", ondelete="CASCADE"), index=True
    )
    days_mask: Mapped[int] = mapped_column(Integer, default=0b0011111)
    start_time: Mapped[time] = mapped_column(Time)
    end_time: Mapped[time] = mapped_column(Time)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    # Whether the window was active on the last monitor pass. The monitor only
    # arms/disarms on a transition, so a manual toggle mid-window sticks.
    last_active: Mapped[bool | None] = mapped_column(Boolean, nullable=True)

    asset: Mapped["Asset"] = relationship(back_populates="schedules")
