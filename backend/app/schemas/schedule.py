from datetime import time
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import TimestampedORMBase


class ArmScheduleOut(TimestampedORMBase):
    asset_id: UUID
    days_mask: int
    start_time: time
    end_time: time
    enabled: bool


class ArmScheduleCreateIn(BaseModel):
    asset_id: UUID
    days_mask: int = Field(default=0b0011111, ge=1, le=0b1111111)
    start_time: time
    end_time: time
    enabled: bool = True


class ArmScheduleUpdateIn(BaseModel):
    days_mask: int | None = Field(default=None, ge=1, le=0b1111111)
    start_time: time | None = None
    end_time: time | None = None
    enabled: bool | None = None
