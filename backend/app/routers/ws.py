from uuid import UUID

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from app.core.database import SessionLocal
from app.core.security import user_from_ws_token
from app.models.device import Device
from app.services.realtime import device_channel, subscriptions_for
from app.ws.manager import manager

router = APIRouter(tags=["websocket"])


async def _hold_open(websocket: WebSocket, channels: list[str]) -> None:
    await manager.connect(channels, websocket)
    try:
        while True:
            # Clients don't need to send anything; this just detects disconnects
            # and lets a client send pings if it wants to.
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(channels, websocket)


@router.websocket("/ws/me")
async def user_stream(websocket: WebSocket, token: str = Query(...)) -> None:
    """The app's single live socket: all of the user's devices, incidents and
    notifications, plus the hostel-wide feed for wardens."""
    # Short-lived session: a socket can stay open for hours and must not pin a pool connection.
    with SessionLocal() as db:
        user = user_from_ws_token(db, token)
        channels = subscriptions_for(user) if user else []
    if not channels:
        await websocket.close(code=4401, reason="Invalid or expired token")
        return
    await _hold_open(websocket, channels)


@router.websocket("/ws/devices/{device_id}")
async def device_stream(websocket: WebSocket, device_id: UUID, token: str = Query(...)) -> None:
    with SessionLocal() as db:
        user = user_from_ws_token(db, token)
        device = db.get(Device, device_id) if user else None
        owned = device is not None and device.owner_id == user.id
    if user is None:
        await websocket.close(code=4401, reason="Invalid or expired token")
        return
    if not owned:
        await websocket.close(code=4404, reason="Device not found")
        return
    await _hold_open(websocket, [device_channel(device_id)])
