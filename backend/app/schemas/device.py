from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.models.enums import DeviceStatus
from app.schemas.common import TimestampedORMBase


class DeviceOut(TimestampedORMBase):
    owner_id: UUID
    name: str
    device_uid: str
    status: DeviceStatus
    firmware_version: str | None = None
    last_seen_at: datetime | None = None


class DevicePairIn(BaseModel):
    device_uid: str
    name: str
    pairing_code: str


class DeviceUpdateIn(BaseModel):
    name: str | None = None
