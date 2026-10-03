import { useQuery } from "@tanstack/react-query";
import { qk } from "@/src/lib/api/keys";
import { useApi } from "@/src/lib/api/useApi";
import type { SensorEvent, SensorEventType } from "@/src/types/api";

export type EventFilter = { device_id?: string; asset_id?: string; event_type?: SensorEventType; limit?: number };

function toQuery(filter: EventFilter): string {
  const params = Object.entries(filter)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`);
  return params.length ? `?${params.join("&")}` : "";
}

/**
 * Sensor events from the server. The RealtimeProvider prepends new
 * `sensor_event` messages into every cached events query, so this list
 * updates live without polling.
 */
export function useEvents(filter: EventFilter = {}) {
  const api = useApi();
  return useQuery({
    queryKey: qk.events(filter),
    queryFn: () => api.get<SensorEvent[]>(`/events${toQuery({ limit: 50, ...filter })}`),
  });
}

/** Whether a live event belongs in a query cached under this filter. */
export function matchesFilter(event: SensorEvent, filter: EventFilter): boolean {
  return (
    (!filter.device_id || filter.device_id === event.device_id) &&
    (!filter.asset_id || filter.asset_id === event.asset_id) &&
    (!filter.event_type || filter.event_type === event.event_type)
  );
}
