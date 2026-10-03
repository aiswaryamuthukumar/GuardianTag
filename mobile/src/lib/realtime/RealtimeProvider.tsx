import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Vibration } from "react-native";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { matchesFilter, type EventFilter } from "@/src/features/activity/api";
import { cacheAsset } from "@/src/features/assets/api";
import { refreshIncidentViews } from "@/src/features/incidents/api";
import { qk } from "@/src/lib/api/keys";
import { useAuth } from "@/src/lib/auth/AuthProvider";
import { openUserSocket, type SocketState } from "@/src/lib/realtime/socket";
import type { Device, DeviceHealth, Notification, RealtimeMessage, SensorEvent, User } from "@/src/types/api";

const RealtimeContext = createContext<SocketState>("connecting");

/** "live" | "connecting" | "offline" - for the LIVE indicator in headers. */
export const useRealtimeState = () => useContext(RealtimeContext);

const ALARM_PATTERN = [0, 600, 250, 600, 250, 600];

function patchDevice(qc: QueryClient, id: string, patch: Partial<Device>) {
  qc.setQueryData<Device[]>(qk.devices, (list) => list?.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  qc.setQueryData<Device>(qk.device(id), (d) => (d ? { ...d, ...patch } : d));
}

function handle(qc: QueryClient, message: RealtimeMessage, me: User | undefined) {
  switch (message.type) {
    case "sensor_event": {
      const event = message.event;
      // Prepend into every cached events list whose filter it matches.
      for (const query of qc.getQueryCache().findAll({ queryKey: ["events"] })) {
        const filter = (query.queryKey[1] ?? {}) as EventFilter;
        if (typeof filter !== "object" || !matchesFilter(event, filter)) continue;
        qc.setQueryData<SensorEvent[]>(query.queryKey, (list) =>
          list && !list.some((e) => e.id === event.id) ? [event, ...list].slice(0, 100) : list,
        );
      }
      patchDevice(qc, event.device_id, { last_seen_at: event.received_at, status: "online" });
      qc.invalidateQueries({ queryKey: qk.analytics("event-mix") });
      break;
    }
    case "device_health": {
      const health = message.health;
      qc.setQueryData<DeviceHealth[]>(qk.deviceHealth(health.device_id), (list) =>
        list ? [health, ...list].slice(0, 200) : list,
      );
      patchDevice(qc, health.device_id, {
        last_seen_at: health.recorded_at,
        status: health.status,
        ...(health.firmware_version ? { firmware_version: health.firmware_version } : {}),
      });
      break;
    }
    case "device_status":
      patchDevice(qc, message.device_id, { status: message.status });
      qc.invalidateQueries({ queryKey: qk.warden("rooms") });
      break;
    case "incident_created":
    case "incident_updated": {
      const incident = message.incident;
      refreshIncidentViews(qc, incident.id);
      const mine = incident.user_id === me?.id;
      if (message.type === "incident_created" && mine) {
        Vibration.vibrate(ALARM_PATTERN);
        router.push({ pathname: "/emergency", params: { id: incident.id } });
      } else if (!mine && me?.role === "warden" && incident.severity === "high" && incident.status === "open") {
        Vibration.vibrate(ALARM_PATTERN); // escalated to the warden
      }
      break;
    }
    case "notification":
      qc.setQueryData<Notification[]>(qk.notifications, (list) =>
        list && !list.some((n) => n.id === message.notification.id) ? [message.notification, ...list] : list,
      );
      qc.setQueryData<number>(qk.unread, (count) => (count ?? 0) + 1);
      if (message.notification.type === "achievement" || message.notification.type === "challenge") {
        qc.invalidateQueries({ queryKey: ["gamification"] });
      }
      break;
    case "asset_updated":
      cacheAsset(qc, message.asset);
      qc.invalidateQueries({ queryKey: ["analytics"] });
      break;
    case "notice":
      qc.invalidateQueries({ queryKey: qk.notices });
      break;
  }
}

export function RealtimeProvider({ children, me }: { children: React.ReactNode; me: User | undefined }) {
  const { getToken, isSignedIn } = useAuth();
  const qc = useQueryClient();
  const [state, setState] = useState<SocketState>("connecting");
  // The handler reads the latest profile without reconnecting when it changes.
  const meRef = useRef(me);
  meRef.current = me;

  useEffect(() => {
    if (!isSignedIn) return;
    const close = openUserSocket(
      () => getToken(),
      (message) => handle(qc, message, meRef.current),
      (next) => {
        setState(next);
        // Catch up on anything missed while disconnected.
        if (next === "live") qc.invalidateQueries();
      },
    );
    return close;
  }, [isSignedIn, getToken, qc]);

  return <RealtimeContext.Provider value={state}>{children}</RealtimeContext.Provider>;
}
