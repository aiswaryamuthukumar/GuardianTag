from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.models.enums import DeviceStatus
from app.schemas.common import ORMBase


class DeviceHealthOut(ORMBase):
    id: UUID
    device_id: UUID
    status: DeviceStatus
    battery_level: int | None = None
    wifi_rssi: int | None = None
    uptime_seconds: int | None = None
    firmware_version: str | None = None
    recorded_at: datetime


class DeviceHealthIn(BaseModel):
    device_uid: str
    status: DeviceStatus
    battery_level: int | None = None
    wifi_rssi: int | None = None
    uptime_seconds: int | None = None
    firmware_version: str | None = None
