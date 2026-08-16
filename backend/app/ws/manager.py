from collections import defaultdict
from uuid import UUID

from fastapi import WebSocket


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

    def disconnect(self, device_id: UUID, websocket: WebSocket) -> None:
        self._connections[device_id].discard(websocket)
        if not self._connections[device_id]:
            del self._connections[device_id]

    async def broadcast(self, device_id: UUID, message: dict) -> None:
        dead: list[WebSocket] = []
        for websocket in self._connections.get(device_id, set()):
            try:
                await websocket.send_json(message)
            except Exception:
                dead.append(websocket)
        for websocket in dead:
            self.disconnect(device_id, websocket)


manager = ConnectionManager()
