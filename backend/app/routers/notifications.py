from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationOut
from app.services.notices import publish_receipt

router = APIRouter(prefix="/notifications", tags=["notifications"])


class UnreadCountOut(BaseModel):
    unread: int


@router.get("", response_model=list[NotificationOut])
def list_notifications(
    unread_only: bool = Query(default=False),
    limit: int = Query(default=100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Notification]:
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    if unread_only:
        query = query.filter(Notification.is_read.is_(False))
    return query.order_by(Notification.created_at.desc()).limit(limit).all()


@router.get("/unread-count", response_model=UnreadCountOut)
def unread_count(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> UnreadCountOut:
    count = (
        db.query(func.count(Notification.id))
        .filter(Notification.user_id == current_user.id, Notification.is_read.is_(False))
        .scalar()
    )
    return UnreadCountOut(unread=count or 0)


@router.patch("/read-all", response_model=UnreadCountOut)
def mark_all_read(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> UnreadCountOut:
    unread = db.query(Notification).filter(Notification.user_id == current_user.id, Notification.is_read.is_(False))
    notice_ids = {n.data["notice_id"] for n in unread if (n.data or {}).get("notice_id")}
    unread.update({Notification.is_read: True}, synchronize_session=False)
    db.commit()
    for notice_id in notice_ids:
        publish_receipt(db, notice_id)
    return UnreadCountOut(unread=0)


@router.patch("/{notification_id}/read", response_model=NotificationOut)
def mark_read(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Notification:
    notification = db.get(Notification, notification_id)
    if notification is None or notification.user_id != current_user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Notification not found")
    was_unread = not notification.is_read
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    if was_unread and (notification.data or {}).get("notice_id"):
        publish_receipt(db, notification.data["notice_id"])
    return notification
