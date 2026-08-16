from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.device import Device
from app.models.enums import IncidentStatus, NotificationType, SensorEventType, TimelineActor
from app.models.incident import Incident, IncidentTimelineEvent
from app.models.sensor_event import SensorEvent
from app.models.user import User
from app.services.gamification import award_xp, evaluate_gamification
from app.services.notify import notify_user

# How far back a "disarmed" event can reach to auto-resolve an open incident
# as a false alarm. Generous relative to the firmware's 3s disarm window to
# account for network delay in delivering the two events.
DISARM_LOOKBACK = timedelta(minutes=5)


def apply_event_to_incident_lifecycle(db: Session, device: Device, event: SensorEvent) -> Incident | None:
    """Creates or resolves an Incident in reaction to a just-ingested sensor event.

    Returns the affected Incident if one was created or updated, else None.
    Only dual_verified (open a new incident) and disarmed (auto-resolve the
    matching open incident as a false alarm) events cause a lifecycle change;
    other event types are just recorded on their own.
    """
    if event.event_type == SensorEventType.DUAL_VERIFIED:
        incident = Incident(
            user_id=device.owner_id,
            device_id=device.id,
            asset_id=event.asset_id,
            title="Unverified movement detected",
            description="Both the motion and hall sensors triggered within the correlation window.",
            status=IncidentStatus.OPEN,
            triggered_at=event.device_timestamp,
        )
        db.add(incident)
        db.flush()  # assign incident.id before the timeline row references it

        db.add(
            IncidentTimelineEvent(
                incident_id=incident.id,
                event_type="incident_created",
                description="Incident automatically created from a dual-verified sensor trigger.",
                actor=TimelineActor.SYSTEM,
                occurred_at=datetime.now(timezone.utc),
            )
        )
        db.commit()
        db.refresh(incident)

        owner = db.get(User, device.owner_id)
        if owner is not None:
            notify_user(
                db,
                owner,
                NotificationType.INCIDENT,
                title=incident.title,
                body=f"Unverified movement on {device.name}. Open the app to review.",
                data={"incident_id": str(incident.id), "device_id": str(device.id)},
                telegram_alert=True,
            )

        return incident

    if event.event_type == SensorEventType.DISARMED:
        cutoff = event.device_timestamp - DISARM_LOOKBACK
        incident = (
            db.query(Incident)
            .filter(
                Incident.device_id == device.id,
                Incident.status == IncidentStatus.OPEN,
                Incident.triggered_at >= cutoff,
            )
            .order_by(Incident.triggered_at.desc())
            .first()
        )
        if incident is None:
            return None

        incident.status = IncidentStatus.FALSE_ALARM
        incident.resolved_at = datetime.now(timezone.utc)
        incident.resolution_notes = "Automatically resolved: disarmed by the user within the alert window."
        db.add(
            IncidentTimelineEvent(
                incident_id=incident.id,
                event_type="auto_resolved",
                description="Disarmed by the user before the alarm escalated.",
                actor=TimelineActor.DEVICE,
                occurred_at=datetime.now(timezone.utc),
            )
        )
        db.commit()
        db.refresh(incident)

        owner = db.get(User, device.owner_id)
        if owner is not None:
            notify_user(
                db,
                owner,
                NotificationType.INCIDENT,
                title="Alert cancelled",
                body=f"{device.name} was disarmed before the alert escalated. No action needed.",
                data={"incident_id": str(incident.id), "device_id": str(device.id)},
            )
            # Reward the quick disarm itself, never the trigger that preceded it.
            award_xp(
                db,
                owner,
                5,
                f"Quick disarm avoided a false alarm on {device.name}",
                reference_type="incident_avoided",
                reference_id=incident.id,
            )
            evaluate_gamification(db, owner)

        return incident

    return None
