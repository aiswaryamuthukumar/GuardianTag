from uuid import UUID

from pydantic import BaseModel

from app.models.enums import AssetCategory
from app.schemas.common import TimestampedORMBase


class AssetOut(TimestampedORMBase):
    owner_id: UUID
    device_id: UUID | None = None
    name: str
    category: AssetCategory
    description: str | None = None
    photo_url: str | None = None
    is_armed: bool
    location: str | None = None


class AssetCreateIn(BaseModel):
    name: str
    category: AssetCategory = AssetCategory.OTHER
    description: str | None = None
    photo_url: str | None = None
    device_id: UUID | None = None
    location: str | None = None


class AssetUpdateIn(BaseModel):
    name: str | None = None
    category: AssetCategory | None = None
    description: str | None = None
    photo_url: str | None = None
    device_id: UUID | None = None
    is_armed: bool | None = None
    location: str | None = None
