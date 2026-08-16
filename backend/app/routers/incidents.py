from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.enums import IncidentStatus
from app.models.incident import Evidence, Incident
from app.models.user import User
from app.schemas.incident import (
    EvidenceCreateIn,
    EvidenceOut,
    IncidentDetailOut,
    IncidentOut,
    IncidentResolveIn,
)
from app.services.gamification import award_xp, evaluate_gamification

router = APIRouter(prefix="/incidents", tags=["incidents"])


def _get_owned_incident(db: Session, user: User, incident_id: UUID) -> Incident:
    incident = (
        db.query(Incident)
        .options(
            selectinload(Incident.timeline_events),
            selectinload(Incident.evidence_items),
        )
        .filter(Incident.id == incident_id, Incident.user_id == user.id)
        .first()
    )
    if incident is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Incident not found")
    return incident


@router.get("", response_model=list[IncidentOut])
def list_incidents(
    status_filter: IncidentStatus | None = Query(default=None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Incident]:
    query = db.query(Incident).filter(Incident.user_id == current_user.id)
    if status_filter is not None:
        query = query.filter(Incident.status == status_filter)
    return query.order_by(Incident.triggered_at.desc()).all()


@router.get("/{incident_id}", response_model=IncidentDetailOut)
def get_incident(
    incident_id: UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> Incident:
    return _get_owned_incident(db, current_user, incident_id)


@router.patch("/{incident_id}/resolve", response_model=IncidentOut)
def resolve_incident(
    incident_id: UUID,
    payload: IncidentResolveIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Incident:
    incident = _get_owned_incident(db, current_user, incident_id)
    was_open = incident.status in (IncidentStatus.OPEN, IncidentStatus.INVESTIGATING)

    incident.status = payload.status
    incident.resolution_notes = payload.resolution_notes
    if payload.status in (IncidentStatus.RESOLVED, IncidentStatus.FALSE_ALARM):
        incident.resolved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(incident)

    if was_open and payload.status in (IncidentStatus.RESOLVED, IncidentStatus.FALSE_ALARM):
        award_xp(
            db,
            current_user,
            15 if payload.status == IncidentStatus.RESOLVED else 5,
            f"Resolved incident: {incident.title}",
            reference_type="incident_resolved",
            reference_id=incident.id,
        )
        evaluate_gamification(db, current_user)

    return incident


@router.post(
    "/{incident_id}/evidence", response_model=EvidenceOut, status_code=status.HTTP_201_CREATED
)
def add_evidence(
    incident_id: UUID,
    payload: EvidenceCreateIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Evidence:
    incident = _get_owned_incident(db, current_user, incident_id)
    evidence = Evidence(
        incident_id=incident.id,
        captured_at=datetime.now(timezone.utc),
        **payload.model_dump(),
    )
    db.add(evidence)
    db.commit()
    db.refresh(evidence)
    return evidence
