import logging
from collections import defaultdict

from anyio import from_thread
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """In-memory registry of live WebSocket connections, keyed by channel name.

    Channels (see app.services.realtime for who publishes to which):
      device:{device_id}   - legacy per-device stream
      user:{user_id}       - everything relevant to one user (the app's main socket)
      wardens:{block}      - hostel-wide feed for wardens of one block
      wardens:*            - hostel-wide feed for wardens with no block (see everything)

    Single-process only: fine for one backend instance. Scaling to multiple
    instances would need a shared pub/sub (Redis) fanning out to each
    instance's local connections instead.
    """

    def __init__(self) -> None:
        self._connections: dict[str, set[WebSocket]] = defaultdict(set)

    async def connect(self, channels: list[str], websocket: WebSocket) -> None:
        await websocket.accept()
        for channel in channels:
            self._connections[channel].add(websocket)
        logger.info("WebSocket connected on %s", channels)

    def disconnect(self, channels: list[str], websocket: WebSocket) -> None:
        for channel in channels:
            self._connections[channel].discard(websocket)
            if not self._connections[channel]:
                del self._connections[channel]
        logger.info("WebSocket disconnected from %s", channels)

    async def broadcast(self, channels: list[str], message: dict) -> None:
        """Sends a message once to every socket subscribed to any of the channels.

        Silently drops dead connections. Logs unexpected errors but doesn't fail.
        """
        targets: set[WebSocket] = set()
        for channel in channels:
            targets |= self._connections.get(channel, set())

        dead: list[WebSocket] = []
        for websocket in targets:
            try:
                await websocket.send_json(message)
            except RuntimeError as exc:
                logger.debug("WebSocket already closed: %s", exc)
                dead.append(websocket)
            except Exception as exc:
                logger.error("WebSocket send error: %s: %s", type(exc).__name__, exc)

        for websocket in dead:
            self.disconnect([c for c, sockets in list(self._connections.items()) if websocket in sockets], websocket)

    def broadcast_from_sync(self, channels: list[str], message: dict) -> None:
        """Broadcasts from sync code running in a FastAPI worker thread.

        Sync endpoints and the monitor's DB work run in anyio worker threads, so
        we can hop back onto the event loop. Outside such a thread (scripts,
        direct service calls in tests) there is no one listening; just skip.
        """
        try:
            from_thread.run(self.broadcast, channels, message)
        except RuntimeError:
            logger.debug("No event loop to broadcast %s on", message.get("type"))


manager = ConnectionManager()
