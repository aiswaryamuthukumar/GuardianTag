from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import DeviceStatus, IncidentSeverity, IncidentStatus
from app.schemas.common import TimestampedORMBase


class WardenIncidentOut(BaseModel):
    id: UUID
    title: str
    status: IncidentStatus
    severity: IncidentSeverity
    triggered_at: datetime
    resolved_at: datetime | None = None
    student_id: UUID
    student_name: str
    room_number: str | None = None
    hostel_block: str | None = None
    phone: str | None = None
    device_name: str
    asset_name: str | None = None


class RoomDeviceOut(BaseModel):
    id: UUID
    name: str
    status: DeviceStatus
    last_seen_at: datetime | None = None


class RoomStudentOut(BaseModel):
    id: UUID
    full_name: str
    phone: str | None = None


class RoomOut(BaseModel):
    hostel_block: str | None
    room_number: str | None
    state: str  # alert | offline | armed | idle
    students: list[RoomStudentOut]
    devices: list[RoomDeviceOut]
    armed_assets: int
    total_assets: int
    open_incidents: int


class BlockStat(BaseModel):
    hostel_block: str
    incidents: int


class WardenAnalyticsOut(BaseModel):
    students: int
    devices_total: int
    devices_online: int
    open_incidents: int
    incidents_30d: int
    false_alarm_rate: float
    avg_response_seconds: float | None
    by_block: list[BlockStat]
    by_hour: list[int]  # 24 buckets, local time


class NoticeCreateIn(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    body: str = Field(min_length=1, max_length=4000)
    hostel_block: str | None = None


class NoticeOut(TimestampedORMBase):
    warden_id: UUID | None = None
    hostel_block: str | None = None
    title: str
    body: str
