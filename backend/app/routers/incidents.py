from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.enums import IncidentSeverity, IncidentStatus, NotificationType, TimelineActor, UserRole
from app.models.incident import Evidence, Incident
from app.models.user import User
from app.schemas.incident import (
    EvidenceCreateIn,
    EvidenceOut,
    IncidentDetailOut,
    IncidentNoteIn,
    IncidentOut,
    IncidentResolveIn,
)
from app.services.gamification import award_xp, evaluate_gamification
from app.services.incidents import ACTIVE_STATUSES, add_timeline, publish_incident
from app.services.notify import notify_user

router = APIRouter(prefix="/incidents", tags=["incidents"])


def _warden_can_see(db: Session, warden: User, incident: Incident) -> bool:
    if warden.role != UserRole.WARDEN:
        return False
    if warden.hostel_block is None:
        return True
    student = db.get(User, incident.user_id)
    return student is not None and student.hostel_block == warden.hostel_block


def get_accessible_incident(db: Session, user: User, incident_id: UUID) -> Incident:
    """The owner, or a warden responsible for the owner's block, may act on an incident."""
    incident = (
        db.query(Incident)
        .options(selectinload(Incident.timeline_events), selectinload(Incident.evidence_items))
        .filter(Incident.id == incident_id)
        .first()
    )
    if incident is None or (incident.user_id != user.id and not _warden_can_see(db, user, incident)):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Incident not found")
    return incident


def _actor_label(user: User, incident: Incident) -> str:
    return "the owner" if user.id == incident.user_id else f"warden {user.full_name}"


@router.get("", response_model=list[IncidentOut])
def list_incidents(
    status_filter: IncidentStatus | None = Query(default=None, alias="status"),
    active: bool = Query(default=False, description="Only open or investigating"),
    severity: IncidentSeverity | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Incident]:
    query = db.query(Incident).filter(Incident.user_id == current_user.id)
    if status_filter is not None:
        query = query.filter(Incident.status == status_filter)
    if active:
        query = query.filter(Incident.status.in_(ACTIVE_STATUSES))
    if severity is not None:
        query = query.filter(Incident.severity == severity)
    return query.order_by(Incident.triggered_at.desc()).limit(limit).all()


@router.get("/{incident_id}", response_model=IncidentDetailOut)
def get_incident(
    incident_id: UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> Incident:
    return get_accessible_incident(db, current_user, incident_id)


@router.post("/{incident_id}/acknowledge", response_model=IncidentOut)
def acknowledge_incident(
    incident_id: UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> Incident:
    """Marks an open incident as being looked into (status -> investigating)."""
    incident = get_accessible_incident(db, current_user, incident_id)
    if incident.status != IncidentStatus.OPEN:
        return incident
    incident.status = IncidentStatus.INVESTIGATING
    add_timeline(
        db, incident, "acknowledged", f"Acknowledged by {_actor_label(current_user, incident)}.", TimelineActor.USER
    )
    db.commit()
    db.refresh(incident)

    if current_user.id != incident.user_id:
        owner = db.get(User, incident.user_id)
        if owner is not None:
            notify_user(
                db,
                owner,
                NotificationType.INCIDENT,
                title="Warden is on it",
                body=f"{current_user.full_name} acknowledged: {incident.title}",
                data={"incident_id": str(incident.id)},
            )
    publish_incident(db, incident, "incident_updated")
    return incident


@router.post("/{incident_id}/notes", response_model=IncidentDetailOut)
def add_note(
    incident_id: UUID,
    payload: IncidentNoteIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Incident:
    incident = get_accessible_incident(db, current_user, incident_id)
    add_timeline(
        db,
        incident,
        "note",
        payload.note,
        TimelineActor.USER,
        {"author": current_user.full_name, "author_role": current_user.role.value},
    )
    db.commit()
    db.refresh(incident)
    publish_incident(db, incident, "incident_updated")
    return incident


@router.patch("/{incident_id}/resolve", response_model=IncidentOut)
def resolve_incident(
    incident_id: UUID,
    payload: IncidentResolveIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Incident:
    incident = get_accessible_incident(db, current_user, incident_id)
    was_open = incident.status in ACTIVE_STATUSES

    incident.status = payload.status
    incident.resolution_notes = payload.resolution_notes
    if was_open:
        incident.resolved_at = datetime.now(timezone.utc)
        verdict = "resolved" if payload.status == IncidentStatus.RESOLVED else "marked as a false alarm"
        add_timeline(
            db,
            incident,
            payload.status.value,
            f"Incident {verdict} by {_actor_label(current_user, incident)}.",
            TimelineActor.USER,
            {"notes": payload.resolution_notes} if payload.resolution_notes else None,
        )
    db.commit()
    db.refresh(incident)

    if was_open:
        owner = db.get(User, incident.user_id)
        if owner is not None:
            # XP always goes to the student who owns the belonging.
            award_xp(
                db,
                owner,
                15 if payload.status == IncidentStatus.RESOLVED else 5,
                f"Resolved incident: {incident.title}",
                reference_type="incident_resolved",
                reference_id=incident.id,
            )
            evaluate_gamification(db, owner)
        publish_incident(db, incident, "incident_updated")

    return incident


@router.post("/{incident_id}/evidence", response_model=EvidenceOut, status_code=status.HTTP_201_CREATED)
def add_evidence(
    incident_id: UUID,
    payload: EvidenceCreateIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Evidence:
    if not payload.url and not payload.content:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Evidence needs a url or content")
    incident = get_accessible_incident(db, current_user, incident_id)
    evidence = Evidence(incident_id=incident.id, captured_at=datetime.now(timezone.utc), **payload.model_dump())
    db.add(evidence)
    label = payload.type.value.replace("_", " ").capitalize()
    add_timeline(
        db,
        incident,
        "evidence_added",
        f"{label} evidence added by {_actor_label(current_user, incident)}.",
        TimelineActor.USER,
    )
    db.commit()
    db.refresh(evidence)
    publish_incident(db, incident, "incident_updated")
    return evidence
