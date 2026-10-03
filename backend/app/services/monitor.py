"""Periodic backend-side safety net for what the ESP32 firmware can't do itself.

Every monitor_interval_seconds:
- escalate incidents nobody disarmed or acknowledged in time (firmware never
  reports its own Alarming state),
- mark devices OFFLINE when their 60s heartbeat stops,
- arm/disarm assets on their Guardian Mode schedules.
"""

import asyncio
import logging
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from anyio import to_thread
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import SessionLocal
from app.models.device import Device
from app.models.enums import DeviceStatus, IncidentSeverity, IncidentStatus, NotificationType
from app.models.incident import Incident
from app.models.user import User
from app.services.incidents import escalate_incident
from app.services.notify import notify_user
from app.services.realtime import publish_device
from app.services.schedules import apply_schedules

logger = logging.getLogger(__name__)


def escalate_unanswered(db: Session, now: datetime) -> int:
    cutoff = now - timedelta(seconds=get_settings().escalation_seconds)
    stale = (
        db.query(Incident)
        .filter(
            Incident.status == IncidentStatus.OPEN,
            Incident.severity.in_((IncidentSeverity.LOW, IncidentSeverity.MEDIUM)),
            Incident.triggered_at <= cutoff,
        )
        .all()
    )
    for incident in stale:
        seconds = get_settings().escalation_seconds
        escalate_incident(db, incident, f"Not disarmed or acknowledged within {seconds}s; escalated to wardens.")
    return len(stale)


def mark_offline(db: Session, now: datetime) -> int:
    cutoff = now - timedelta(seconds=get_settings().offline_after_seconds)
    silent = (
        db.query(Device)
        .filter(
            Device.status.in_((DeviceStatus.ONLINE, DeviceStatus.DEGRADED)),
            or_(Device.last_seen_at <= cutoff, Device.last_seen_at.is_(None) & (Device.created_at <= cutoff)),
        )
        .all()
    )
    for device in silent:
        device.status = DeviceStatus.OFFLINE
        db.commit()
        publish_device(device, {"type": "device_status", "device_id": str(device.id), "status": "offline"})
        owner = db.get(User, device.owner_id)
        if owner is not None:
            notify_user(
                db,
                owner,
                NotificationType.DEVICE_HEALTH,
                title=f"{device.name} went offline",
                body="No heartbeat for a few minutes. Check its battery and Wi-Fi.",
                data={"device_id": str(device.id)},
            )
    return len(silent)


def run_cycle(now: datetime | None = None) -> dict[str, int]:
    """One monitor pass. Sync: runs in a worker thread so realtime publishes can reach the loop."""
    now = now or datetime.now(timezone.utc)
    local_now = now.astimezone(ZoneInfo(get_settings().app_timezone))
    with SessionLocal() as db:
        return {
            "escalated": escalate_unanswered(db, now),
            "offline": mark_offline(db, now),
            "scheduled": apply_schedules(db, local_now),
        }


async def monitor_loop() -> None:
    interval = get_settings().monitor_interval_seconds
    logger.info("Monitor started (every %ss)", interval)
    while True:
        try:
            result = await to_thread.run_sync(run_cycle)
            if any(result.values()):
                logger.info("Monitor pass: %s", result)
        except Exception:
            logger.exception("Monitor pass failed")
        await asyncio.sleep(interval)
