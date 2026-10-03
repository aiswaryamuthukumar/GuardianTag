from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.enums import UserRole
from app.models.notice import Notice
from app.models.user import User
from app.schemas.warden import NoticeOut
from app.services import notices as notice_service

router = APIRouter(prefix="/notices", tags=["notices"])


def _visible(db: Session, user: User):
    """Notices addressed to the caller's block or to everyone; hostel-wide wardens see all."""
    query = db.query(Notice)
    if not (user.role == UserRole.WARDEN and user.hostel_block is None):
        query = query.filter((Notice.hostel_block.is_(None)) | (Notice.hostel_block == user.hostel_block))
    return query


@router.get("", response_model=list[NoticeOut])
def list_notices(
    limit: int = Query(default=50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[NoticeOut]:
    notices = _visible(db, current_user).order_by(Notice.created_at.desc()).limit(limit).all()
    return notice_service.serialize(db, notices, current_user)


@router.post("/{notice_id}/read", response_model=NoticeOut)
def mark_notice_read(
    notice_id: UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> NoticeOut:
    """Student opened the notice: updates the warden's read receipt live."""
    notice = _visible(db, current_user).filter(Notice.id == notice_id).first()
    if notice is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Notice not found")
    notice_service.mark_read(db, current_user, notice_id)
    return notice_service.serialize(db, [notice], current_user)[0]
