from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.models.enums import EvidenceType, IncidentSeverity, IncidentStatus, TimelineActor
from app.schemas.common import ORMBase, TimestampedORMBase


class IncidentTimelineEventOut(ORMBase):
    id: UUID
    incident_id: UUID
    event_type: str
    description: str
    actor: TimelineActor
    event_metadata: dict | None = None
    occurred_at: datetime


class EvidenceOut(ORMBase):
    id: UUID
    incident_id: UUID
    type: EvidenceType
    url: str | None = None
    content: str | None = None
    captured_at: datetime


class EvidenceCreateIn(BaseModel):
    type: EvidenceType
    url: str | None = None
    content: str | None = None


class IncidentOut(TimestampedORMBase):
    user_id: UUID
    device_id: UUID
    asset_id: UUID | None = None
    title: str
    description: str | None = None
    status: IncidentStatus
    severity: IncidentSeverity
    triggered_at: datetime
    resolved_at: datetime | None = None
    resolution_notes: str | None = None


class IncidentDetailOut(IncidentOut):
    timeline_events: list[IncidentTimelineEventOut] = []
    evidence_items: list[EvidenceOut] = []


class IncidentResolveIn(BaseModel):
    status: IncidentStatus
    resolution_notes: str | None = None
