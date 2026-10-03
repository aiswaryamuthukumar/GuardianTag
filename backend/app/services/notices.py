"""Hostel notices: delivery, read receipts and live updates.

A notice is delivered as one Notification per student (data.notice_id links
them), so the student's inbox, push and Telegram all come for free, and the
Notification's is_read doubles as the read receipt the warden sees.
"""

from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.enums import NotificationType, UserRole
from app.models.notice import Notice
from app.models.notification import Notification
from app.models.user import User
from app.schemas.warden import NoticeOut
from app.services.notify import notify_user
from app.services.realtime import publish_user, warden_channels
from app.ws.manager import manager


def _notice_key():
    return Notification.data["notice_id"].astext


def receipt_counts(db: Session, notice_ids: list[UUID]) -> dict[str, tuple[int, int]]:
    """notice_id -> (delivered to, read by)."""
    if not notice_ids:
        return {}
    rows = (
        db.query(_notice_key(), func.count(Notification.id), func.count(Notification.id).filter(Notification.is_read))
        .filter(_notice_key().in_([str(i) for i in notice_ids]))
        .group_by(_notice_key())
        .all()
    )
    return {notice_id: (total, read) for notice_id, total, read in rows}


def serialize(db: Session, notices: list[Notice], viewer: User) -> list[NoticeOut]:
    ids = [n.id for n in notices]
    counts = receipt_counts(db, ids)
    read_by_viewer: set[str] = set()
    if viewer.role == UserRole.STUDENT and ids:
        read_by_viewer = {
            nid
            for (nid,) in db.query(_notice_key()).filter(
                Notification.user_id == viewer.id,
                Notification.is_read.is_(True),
                _notice_key().in_([str(i) for i in ids]),
            )
        }
    authors = {u.id: u.full_name for u in db.query(User).filter(User.id.in_({n.warden_id for n in notices if n.warden_id}))}
    out = []
    for notice in notices:
        recipients, read = counts.get(str(notice.id), (0, 0))
        item = NoticeOut.model_validate(notice)
        item.author_name = authors.get(notice.warden_id)
        item.recipients, item.read_count = recipients, read
        item.is_read = str(notice.id) in read_by_viewer if viewer.role == UserRole.STUDENT else True
        out.append(item)
    return out


def _publish_to_wardens(block: str | None, message: dict) -> None:
    manager.broadcast_from_sync(warden_channels(block), message)


def broadcast(db: Session, warden: User, notice: Notice) -> NoticeOut:
    """Delivers a new notice to every student in its block (or the whole hostel)."""
    recipients = db.query(User).filter(User.role == UserRole.STUDENT)
    if notice.hostel_block:
        recipients = recipients.filter(User.hostel_block == notice.hostel_block)
    students = recipients.all()
    urgent = notice.priority == "urgent"

    for student in students:
        notify_user(
            db,
            student,
            NotificationType.INCIDENT if urgent else NotificationType.SYSTEM,  # urgent ignores quiet hours
            title=f"{'URGENT: ' if urgent else 'Notice: '}{notice.title}",
            body=notice.body,
            data={"notice_id": str(notice.id)},
            telegram_alert=True,
        )
    out = serialize(db, [notice], warden)[0]
    student_view = out.model_copy(update={"is_read": False})
    message = {"type": "notice", "notice": student_view.model_dump(mode="json")}
    for student in students:
        publish_user(student.id, message)
    _publish_to_wardens(notice.hostel_block, {"type": "notice", "notice": out.model_dump(mode="json")})
    return out


def publish_receipt(db: Session, notice_id: str) -> None:
    """Tells the notice's wardens its new read count, live."""
    notice = db.get(Notice, UUID(notice_id))
    if notice is None:
        return
    recipients, read = receipt_counts(db, [notice.id]).get(notice_id, (0, 0))
    _publish_to_wardens(
        notice.hostel_block,
        {"type": "notice_read", "notice_id": notice_id, "recipients": recipients, "read_count": read},
    )


def mark_read(db: Session, student: User, notice_id: UUID) -> None:
    updated = (
        db.query(Notification)
        .filter(Notification.user_id == student.id, _notice_key() == str(notice_id), Notification.is_read.is_(False))
        .update({Notification.is_read: True}, synchronize_session=False)
    )
    db.commit()
    if updated:
        publish_receipt(db, str(notice_id))


def delete(db: Session, notice: Notice) -> None:
    """Withdraws a notice: removes it from every student's inbox, live."""
    student_ids = [
        uid for (uid,) in db.query(Notification.user_id).filter(_notice_key() == str(notice.id)).distinct()
    ]
    db.query(Notification).filter(_notice_key() == str(notice.id)).delete(synchronize_session=False)
    block, notice_id = notice.hostel_block, str(notice.id)
    db.delete(notice)
    db.commit()
    message = {"type": "notice_deleted", "notice_id": notice_id}
    for uid in student_ids:
        publish_user(uid, message)
    _publish_to_wardens(block, message)
