import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.limiter import limiter
from app.core.security import get_current_user
from app.models.device import Device
from app.models.enums import DeviceStatus, SensorEventType
from app.models.sensor_event import SensorEvent
from app.models.user import User
from app.schemas.sensor_event import SensorEventIn, SensorEventOut
from app.services.ingest import record_event

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/events", tags=["events"])


@router.post("", response_model=SensorEventOut, status_code=status.HTTP_201_CREATED)
@limiter.limit("100/minute")
def ingest_event(request: Request, payload: SensorEventIn, db: Session = Depends(get_db)) -> SensorEvent:
    """Ingest a sensor event from an ESP32 device (unauthenticated, rate-limited)."""
    device = db.query(Device).filter(Device.device_uid == payload.device_uid).first()
    if device is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Unknown device_uid")
    if device.status == DeviceStatus.UNPAIRED:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Device is unpaired - cannot ingest events")

    event, _ = record_event(db, device, payload.event_type, payload.device_timestamp, payload.asset_id, payload.payload)
    return event


@router.get("", response_model=list[SensorEventOut])
def list_events(
    device_id: UUID | None = Query(default=None),
    asset_id: UUID | None = Query(default=None),
    event_type: SensorEventType | None = Query(default=None),
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
    if event_type is not None:
        query = query.filter(SensorEvent.event_type == event_type)
    return query.order_by(SensorEvent.received_at.desc()).limit(limit).all()
