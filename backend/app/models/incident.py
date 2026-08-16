import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPKMixin
from app.models.enums import EvidenceType, IncidentSeverity, IncidentStatus, TimelineActor
from app.models.pg_enums import (
    evidence_type_enum,
    incident_severity_enum,
    incident_status_enum,
    timeline_actor_enum,
)


class Incident(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "incidents"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    device_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("devices.id", ondelete="CASCADE"), index=True
    )
    asset_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("assets.id", ondelete="SET NULL"), nullable=True, index=True
    )
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[IncidentStatus] = mapped_column(
        incident_status_enum, default=IncidentStatus.OPEN, index=True
    )
    severity: Mapped[IncidentSeverity] = mapped_column(
        incident_severity_enum, default=IncidentSeverity.MEDIUM
    )
    triggered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    resolution_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    user: Mapped["User"] = relationship(back_populates="incidents")
    device: Mapped["Device"] = relationship(back_populates="incidents")
    asset: Mapped["Asset | None"] = relationship(back_populates="incidents")
    timeline_events: Mapped[list["IncidentTimelineEvent"]] = relationship(
        back_populates="incident", cascade="all, delete-orphan", order_by="IncidentTimelineEvent.occurred_at"
    )
    evidence_items: Mapped[list["Evidence"]] = relationship(
        back_populates="incident", cascade="all, delete-orphan"
    )


class IncidentTimelineEvent(UUIDPKMixin, Base):
    __tablename__ = "incident_timeline"

    incident_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("incidents.id", ondelete="CASCADE"), index=True
    )
    event_type: Mapped[str] = mapped_column(String(64))
    description: Mapped[str] = mapped_column(Text)
    actor: Mapped[TimelineActor] = mapped_column(timeline_actor_enum)
    event_metadata: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)

    incident: Mapped["Incident"] = relationship(back_populates="timeline_events")


class Evidence(UUIDPKMixin, Base):
    __tablename__ = "evidence"

    incident_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("incidents.id", ondelete="CASCADE"), index=True
    )
    type: Mapped[EvidenceType] = mapped_column(evidence_type_enum)
    url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    captured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)

    incident: Mapped["Incident"] = relationship(back_populates="evidence_items")
