from uuid import UUID

from app.models.enums import NotificationType
from app.schemas.common import TimestampedORMBase


class NotificationOut(TimestampedORMBase):
    user_id: UUID
    type: NotificationType
    title: str
    body: str
    data: dict | None = None
    is_read: bool
