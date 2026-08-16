from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.device import Device
from app.models.enums import DeviceStatus
from app.models.sensor_event import SensorEvent
from app.models.user import User
from app.schemas.incident import IncidentOut
from app.schemas.sensor_event import SensorEventIn, SensorEventOut
from app.services.incidents import apply_event_to_incident_lifecycle
from app.ws.manager import manager

router = APIRouter(prefix="/events", tags=["events"])


@router.post("", response_model=SensorEventOut, status_code=status.HTTP_201_CREATED)
async def ingest_event(payload: SensorEventIn, db: Session = Depends(get_db)) -> SensorEvent:
    device = db.query(Device).filter(Device.device_uid == payload.device_uid).first()
    if device is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Unknown device_uid")

    event = SensorEvent(
        device_id=device.id,
        asset_id=payload.asset_id,
        event_type=payload.event_type,
        payload=payload.payload,
        device_timestamp=payload.device_timestamp,
        received_at=datetime.now(timezone.utc),
    )
    device.last_seen_at = event.received_at
    device.status = DeviceStatus.ONLINE
    db.add(event)
    db.commit()
    db.refresh(event)

    await manager.broadcast(
        device.id,
        {"type": "sensor_event", "event": SensorEventOut.model_validate(event).model_dump(mode="json")},
    )

    incident = apply_event_to_incident_lifecycle(db, device, event)
    if incident is not None:
        message_type = "incident_created" if incident.status.value == "open" else "incident_updated"
        await manager.broadcast(
            device.id,
            {"type": message_type, "incident": IncidentOut.model_validate(incident).model_dump(mode="json")},
        )

    return event


@router.get("", response_model=list[SensorEventOut])
def list_events(
    device_id: UUID | None = Query(default=None),
    asset_id: UUID | None = Query(default=None),
    limit: int = Query(default=50, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[SensorEvent]:
    query = (
        db.query(SensorEvent)
        .join(Device, SensorEvent.device_id == Device.id)
        .filter(Device.owner_id == current_user.id)
    )
    if device_id is not None:
        query = query.filter(SensorEvent.device_id == device_id)
    if asset_id is not None:
        query = query.filter(SensorEvent.asset_id == asset_id)
    return query.order_by(SensorEvent.received_at.desc()).limit(limit).all()
