from uuid import UUID

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import TokenError, decode_clerk_token
from app.models.device import Device
from app.models.user import User
from app.ws.manager import manager

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/devices/{device_id}")
async def device_stream(
    websocket: WebSocket,
    device_id: UUID,
    token: str = Query(...),
    db: Session = Depends(get_db),
) -> None:
    try:
        claims = decode_clerk_token(token)
    except TokenError:
        await websocket.close(code=4401, reason="Invalid or expired token")
        return

    clerk_user_id = claims.get("sub")
    user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first() if clerk_user_id else None
    if user is None:
        await websocket.close(code=4401, reason="User profile not found")
        return

    device = db.get(Device, device_id)
    if device is None or device.owner_id != user.id:
        await websocket.close(code=4404, reason="Device not found")
        return

    await manager.connect(device_id, websocket)
    try:
        while True:
            # Clients don't need to send anything; this just detects disconnects
            # and lets a client send pings if it wants to.
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(device_id, websocket)
