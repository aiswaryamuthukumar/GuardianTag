import logging
from collections import defaultdict
from uuid import UUID

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """In-memory registry of live WebSocket connections, keyed by device_id.

    Single-process only: fine for one backend instance. Scaling to multiple
    instances would need a shared pub/sub (Redis) fanning out to each
    instance's local connections instead.
    """

    def __init__(self) -> None:
        self._connections: dict[UUID, set[WebSocket]] = defaultdict(set)

    async def connect(self, device_id: UUID, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections[device_id].add(websocket)
        logger.info(f"WebSocket connected for device {device_id}")

    def disconnect(self, device_id: UUID, websocket: WebSocket) -> None:
        self._connections[device_id].discard(websocket)
        if not self._connections[device_id]:
            del self._connections[device_id]
        logger.info(f"WebSocket disconnected for device {device_id}")

    async def broadcast(self, device_id: UUID, message: dict) -> None:
        """Broadcast a message to all clients listening to a device.
        
        Silently drops dead connections. Logs unexpected errors but doesn't fail.
        """
        dead: list[WebSocket] = []
        
        for websocket in self._connections.get(device_id, set()):
            try:
                await websocket.send_json(message)
            except RuntimeError as e:
                # Connection closed or already closing - mark as dead
                logger.debug(f"WebSocket already closed: {e}")
                dead.append(websocket)
            except Exception as e:
                # Unexpected error - log it but don't mark as dead
                logger.error(f"WebSocket send error (will retry): {type(e).__name__}: {e}")
        
        # Remove dead connections
        for websocket in dead:
            self.disconnect(device_id, websocket)


manager = ConnectionManager()