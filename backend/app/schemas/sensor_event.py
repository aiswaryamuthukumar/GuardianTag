from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.models.enums import SensorEventType
from app.schemas.common import ORMBase


class SensorEventOut(ORMBase):
    id: UUID
    device_id: UUID
    asset_id: UUID | None = None
    event_type: SensorEventType
    payload: dict | None = None
    device_timestamp: datetime
    received_at: datetime


class SensorEventIn(BaseModel):
    device_uid: str
    asset_id: UUID | None = None
    event_type: SensorEventType
    payload: dict | None = None
    device_timestamp: datetime
