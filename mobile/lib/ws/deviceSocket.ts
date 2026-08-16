const WS_URL = process.env.EXPO_PUBLIC_WS_URL ?? "ws://localhost:8000/ws";

export type DeviceSocketMessage =
  | { type: "sensor_event"; event: Record<string, unknown> }
  | { type: "incident_created" | "incident_updated"; incident: Record<string, unknown> }
  | { type: "device_health"; health: Record<string, unknown> };

const RECONNECT_DELAY_MS = 3000;

export function openDeviceSocket(
  deviceId: string,
  getToken: () => Promise<string | null>,
  onMessage: (message: DeviceSocketMessage) => void,
): () => void {
  let socket: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let closedByCaller = false;

  // Fetches a fresh token on every (re)connect attempt, since Clerk session
  // tokens are short-lived and a dropped connection may reconnect long after
  // the token used to establish the original one has expired.
  const connect = async () => {
    const token = await getToken();
    if (closedByCaller || !token) return;

    socket = new WebSocket(`${WS_URL}/devices/${deviceId}?token=${encodeURIComponent(token)}`);

    socket.onmessage = (event) => {
      try {
        onMessage(JSON.parse(event.data as string));
      } catch {
        // Ignore malformed frames rather than crashing the app.
      }
    };

    socket.onclose = () => {
      if (closedByCaller) return;
      reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
    };

    socket.onerror = () => {
      socket?.close();
    };
  };

  connect();

  return () => {
    closedByCaller = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    socket?.close();
  };
}
