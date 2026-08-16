from sqlalchemy import Enum as SAEnum

from app.models.enums import (
    AssetCategory,
    DeviceStatus,
    EvidenceType,
    GuardianLevel,
    IncidentSeverity,
    IncidentStatus,
    NotificationType,
    SensorEventType,
    TimelineActor,
)

# Each PostgreSQL enum TYPE must be declared exactly once and reused across every
# column/table that references it, otherwise SQLAlchemy/Alembic tries to CREATE
# TYPE twice for the same name.
guardian_level_enum = SAEnum(GuardianLevel, name="guardian_level")
device_status_enum = SAEnum(DeviceStatus, name="device_status")
asset_category_enum = SAEnum(AssetCategory, name="asset_category")
sensor_event_type_enum = SAEnum(SensorEventType, name="sensor_event_type")
incident_status_enum = SAEnum(IncidentStatus, name="incident_status")
incident_severity_enum = SAEnum(IncidentSeverity, name="incident_severity")
timeline_actor_enum = SAEnum(TimelineActor, name="timeline_actor")
evidence_type_enum = SAEnum(EvidenceType, name="evidence_type")
notification_type_enum = SAEnum(NotificationType, name="notification_type")
