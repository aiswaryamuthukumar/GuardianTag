import { WS_URL } from "@/src/lib/api/client";
import type { RealtimeMessage } from "@/src/types/api";

const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 15_000;
const PING_MS = 25_000;

export type SocketState = "connecting" | "live" | "offline";

/**
 * Opens the user's single live socket (/ws/me) and keeps it open.
 * Reconnects with backoff, fetching the current token each time (it may
 * have changed or been cleared by a sign-out). Stops retrying on an auth rejection (4401)
 * until the caller reopens it. Returns a close function.
 */
export function openUserSocket(
  getToken: () => Promise<string | null>,
  onMessage: (message: RealtimeMessage) => void,
  onState: (state: SocketState) => void,
): () => void {
  let socket: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let pingTimer: ReturnType<typeof setInterval> | null = null;
  let attempt = 0;
  let closedByCaller = false;

  const scheduleReconnect = () => {
    if (closedByCaller) return;
    const delay = Math.min(RECONNECT_MAX_MS, RECONNECT_BASE_MS * 2 ** attempt++);
    reconnectTimer = setTimeout(connect, delay);
  };

  const connect = async () => {
    onState("connecting");
    const token = await getToken().catch(() => null);
    if (closedByCaller) return;
    if (!token) {
      onState("offline");
      scheduleReconnect();
      return;
    }

    socket = new WebSocket(`${WS_URL}/me?token=${encodeURIComponent(token)}`);

    socket.onopen = () => {
      attempt = 0;
      onState("live");
      // Keeps NATs and proxies from dropping an idle connection.
      pingTimer = setInterval(() => socket?.readyState === WebSocket.OPEN && socket.send("ping"), PING_MS);
    };

    socket.onmessage = (event) => {
      try {
        onMessage(JSON.parse(event.data as string));
      } catch {
        // Ignore malformed frames rather than crashing the app.
      }
    };

    socket.onclose = (event) => {
      if (pingTimer) clearInterval(pingTimer);
      onState("offline");
      if (event.code === 4401 && attempt > 3) return; // persistent auth failure
      scheduleReconnect();
    };

    socket.onerror = () => socket?.close();
  };

  connect();

  return () => {
    closedByCaller = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (pingTimer) clearInterval(pingTimer);
    socket?.close();
  };
}
