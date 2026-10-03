from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.enums import UserRole
from app.models.notice import Notice
from app.models.user import User
from app.schemas.warden import NoticeOut

router = APIRouter(prefix="/notices", tags=["notices"])


@router.get("", response_model=list[NoticeOut])
def list_notices(
    limit: int = Query(default=30, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Notice]:
    """Hostel notices addressed to the caller's block or to everyone.

    Wardens without a block see every notice.
    """
    query = db.query(Notice)
    if not (current_user.role == UserRole.WARDEN and current_user.hostel_block is None):
        query = query.filter((Notice.hostel_block.is_(None)) | (Notice.hostel_block == current_user.hostel_block))
    return query.order_by(Notice.created_at.desc()).limit(limit).all()
