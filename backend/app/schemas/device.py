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
    battery_percent: int | None = None
    signal_strength: int | None = None  # 0-100, from the last heartbeat's Wi-Fi RSSI


class DevicePairIn(BaseModel):
    device_uid: str
    name: str
    pairing_code: str


class DeviceUpdateIn(BaseModel):
    name: str | None = None
