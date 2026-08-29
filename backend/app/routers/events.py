from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status  # pyright: ignore[reportMissingImports]
try:
    from slowapi import Limiter
    from slowapi.util import get_remote_address
except ImportError:  # pragma: no cover - fallback for environments without slowapi
    class Limiter:
        def __init__(self, *args, **kwargs):
            pass

        def limit(self, *args, **kwargs):
            def decorator(func):
                return func

            return decorator

    def get_remote_address(*args, **kwargs):
        return "127.0.0.1"
from sqlalchemy.orm import Session  # pyright: ignore[reportMissingImports]

from app.core.database import get_db
from app.models.device import Device
from app.models.user import User
from app.core.security import get_current_user
from app.models.enums import DeviceStatus, SensorEventType
from app.models.sensor_event import SensorEvent
from app.schemas.sensor_event import SensorEventIn, SensorEventOut
from app.services.incidents import apply_event_to_incident_lifecycle
from app.ws.manager import manager
import logging

logger = logging.getLogger(__name__)
limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/events", tags=["events"])


@router.post("", response_model=SensorEventOut, status_code=status.HTTP_201_CREATED)
@limiter.limit("100/minute")
async def ingest_event(request: Request, payload: SensorEventIn, db: Session = Depends(get_db)) -> SensorEvent:
    """Ingest a sensor event from an ESP32 device.
    
    Validates:
    - Device exists
    - Device is paired (not in UNPAIRED status)
    - Event type is valid
    - Timestamp is recent (not older than 1 hour)
    """
    
    # 1. Validate device exists
    device = db.query(Device).filter(Device.device_uid == payload.device_uid).first()
    if device is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Unknown device_uid")
    
    # 2. Validate device is paired
    if device.status == DeviceStatus.UNPAIRED:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Device is unpaired - cannot ingest events",
        )
    
    # 3. Validate event type is known
    try:
        event_type = SensorEventType(payload.event_type)
    except ValueError:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Invalid event_type: {payload.event_type}",
        )
    
    # 4. Validate timestamp is recent (not from 2020)
    now = datetime.now(timezone.utc)
    time_diff = (now - payload.device_timestamp).total_seconds()
    
    if time_diff < -60:  # Future timestamp (>1 min in future)
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Device timestamp is in the future",
        )
    
    if time_diff > 3600:  # Older than 1 hour
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Device timestamp is too old (>1 hour ago)",
        )
    
    # 5. Create and store event
    event = SensorEvent(
        device_id=device.id,
        asset_id=payload.asset_id,
        event_type=event_type,
        payload=payload.payload,
        device_timestamp=payload.device_timestamp,
        received_at=now,
    )
    device.last_seen_at = event.received_at
    device.status = DeviceStatus.ONLINE
    
    try:
        db.add(event)
        db.commit()
        db.refresh(event)
    except Exception as e:
        db.rollback()
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Failed to store event")
    
    # 6. Broadcast to WebSocket listeners
    try:
        await manager.broadcast(
            device.id,
            {
                "type": "sensor_event",
                "event": SensorEventOut.model_validate(event).model_dump(mode="json"),
            },
        )
    except Exception as e:
        # Log but don't fail - WebSocket errors shouldn't break event ingestion
        print(f"WebSocket broadcast failed: {e}")
    
    # 7. Process incident lifecycle
    incident = apply_event_to_incident_lifecycle(db, device, event)
    if incident is not None:
        message_type = "incident_created" if incident.status.value == "open" else "incident_updated"
        try:
            await manager.broadcast(
                device.id,
                {
                    "type": message_type,
                    "incident": IncidentOut.model_validate(incident).model_dump(mode="json"),
                },
            )
        except Exception as e:
            print(f"Incident broadcast failed: {e}")
    
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
