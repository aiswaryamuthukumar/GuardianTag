import logging
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.asset import Asset
from app.models.device import Device
from app.models.enums import IncidentSeverity, IncidentStatus, NotificationType, SensorEventType, TimelineActor
from app.models.incident import Incident, IncidentTimelineEvent
from app.models.sensor_event import SensorEvent
from app.models.user import User
from app.schemas.incident import IncidentOut
from app.services.gamification import award_xp, evaluate_gamification
from app.services.notify import notify_user, wardens_for_block
from app.services.realtime import publish_device

logger = logging.getLogger(__name__)

# How far back a "disarmed" event can reach to auto-resolve an open incident
# as a false alarm. Generous relative to the firmware's 3s disarm window to
# account for network delay in delivering the two events.
DISARM_LOOKBACK = timedelta(minutes=5)

ACTIVE_STATUSES = (IncidentStatus.OPEN, IncidentStatus.INVESTIGATING)


def add_timeline(
    db: Session,
    incident: Incident,
    event_type: str,
    description: str,
    actor: TimelineActor,
    metadata: dict | None = None,
) -> None:
    db.add(
        IncidentTimelineEvent(
            incident_id=incident.id,
            event_type=event_type,
            description=description,
            actor=actor,
            event_metadata=metadata,
            occurred_at=datetime.now(timezone.utc),
        )
    )


def publish_incident(db: Session, incident: Incident, message_type: str) -> None:
    """Sends an incident_created/incident_updated message to the owner and their block's wardens."""
    device = db.get(Device, incident.device_id)
    owner = db.get(User, incident.user_id)
    if device is None:
        return
    publish_device(
        device,
        {"type": message_type, "incident": IncidentOut.model_validate(incident).model_dump(mode="json")},
        owner=owner,
        to_wardens=True,
    )


def resolve_arming(db: Session, device: Device, asset_id: UUID | None) -> tuple[bool, Asset | None]:
    """Decides whether a trigger from this device should raise an incident.

    The firmware arms itself from its physical button and has no idea what the
    app says, so the backend enforces the app's Guardian Mode in software:
    - device has no linked assets -> the device button is the only authority; raise.
    - device has linked assets    -> raise only if at least one is armed, and
                                     attribute the incident to it.
    """
    if asset_id is not None:
        asset = db.get(Asset, asset_id)
        if asset is not None and asset.owner_id == device.owner_id:
            return asset.is_armed, asset

    linked = db.query(Asset).filter(Asset.device_id == device.id).all()
    if not linked:
        return True, None
    armed = [a for a in linked if a.is_armed]
    return (True, armed[0]) if armed else (False, None)


def apply_event_to_incident_lifecycle(db: Session, device: Device, event: SensorEvent) -> Incident | None:
    """Creates or resolves an Incident in reaction to a just-ingested sensor event.

    Returns the affected Incident if one was created or updated, else None.
    Only dual_verified (open a new incident) and disarmed (auto-resolve the
    matching open incident as a false alarm) events cause a lifecycle change;
    other event types are just recorded on their own. Publishes the change
    over WebSocket itself.
    """
    if event.event_type == SensorEventType.DUAL_VERIFIED:
        if (event.payload or {}).get("ignored"):
            logger.info("Ignored trigger from %s: no linked asset armed", device.id)
            return None
        _, asset = resolve_arming(db, device, event.asset_id)

        if asset is not None and event.asset_id is None:
            event.asset_id = asset.id  # committed with the incident below
        target = asset.name if asset else device.name
        incident = Incident(
            user_id=device.owner_id,
            device_id=device.id,
            asset_id=asset.id if asset else None,
            title=f"Tamper alert: {target}",
            description="Both the motion and hall sensors triggered within the correlation window.",
            status=IncidentStatus.OPEN,
            severity=IncidentSeverity.MEDIUM,
            triggered_at=event.device_timestamp,
        )
        db.add(incident)
        db.flush()  # assign incident.id before the timeline row references it
        add_timeline(
            db,
            incident,
            "incident_created",
            "Incident automatically created from a dual-verified sensor trigger.",
            TimelineActor.SYSTEM,
            {"sensor_event_id": str(event.id)},
        )
        db.commit()
        db.refresh(incident)
        logger.info("Created incident %s for device %s", incident.id, device.id)

        owner = db.get(User, device.owner_id)
        if owner is not None:
            notify_user(
                db,
                owner,
                NotificationType.INCIDENT,
                title=incident.title,
                body=f"Movement and opening detected on {target}. Open the app to review.",
                data={"incident_id": str(incident.id), "device_id": str(device.id)},
                telegram_alert=True,
            )
        publish_incident(db, incident, "incident_created")
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
        add_timeline(
            db, incident, "auto_resolved", "Disarmed on the device before the alarm escalated.", TimelineActor.DEVICE
        )
        db.commit()
        db.refresh(incident)
        logger.info("Auto-resolved incident %s as false alarm", incident.id)

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
        publish_incident(db, incident, "incident_updated")
        return incident

    return None


def escalate_incident(db: Session, incident: Incident, reason: str) -> None:
    """Raises an unanswered incident to HIGH and pulls in the student's wardens."""
    incident.severity = IncidentSeverity.HIGH
    add_timeline(db, incident, "escalated", reason, TimelineActor.SYSTEM)
    db.commit()
    db.refresh(incident)

    owner = db.get(User, incident.user_id)
    data = {"incident_id": str(incident.id), "device_id": str(incident.device_id)}
    if owner is not None:
        notify_user(
            db,
            owner,
            NotificationType.INCIDENT,
            title=f"Escalated: {incident.title}",
            body="Nobody disarmed the device in time. Your warden has been alerted.",
            data=data,
            telegram_alert=True,
        )
        room = f"room {owner.room_number}" if owner.room_number else "an unknown room"
        for warden in wardens_for_block(db, owner.hostel_block):
            notify_user(
                db,
                warden,
                NotificationType.INCIDENT,
                title=f"Unanswered alert in {room}",
                body=f"{owner.full_name}: {incident.title}",
                data=data,
                telegram_alert=True,
            )
    publish_incident(db, incident, "incident_updated")
