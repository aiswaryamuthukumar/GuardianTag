import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/src/lib/api/useApi";
import type { Device, Incident, SimulateResult } from "@/src/types/api";

/**
 * Demo Controls call the backend's /demo endpoints, which push events through
 * the same ingest path as the ESP32. The resulting incidents, heartbeats and
 * status changes arrive over the live socket like real ones do.
 */
export function useDemoAction() {
  const api = useApi();
  const qc = useQueryClient();
  return {
    simulate: useMutation({ mutationFn: () => api.post<SimulateResult>("/demo/simulate-incident") }),
    disarm: useMutation({ mutationFn: () => api.post<Incident | null>("/demo/disarm") }),
    resolveLatest: useMutation({
      mutationFn: () => api.post<Incident | null>("/demo/resolve-latest"),
      onSuccess: () => qc.invalidateQueries({ queryKey: ["gamification"] }),
    }),
    heartbeat: useMutation({ mutationFn: () => api.post<Device>("/demo/heartbeat") }),
    cycleDevice: useMutation({ mutationFn: () => api.post<Device>("/demo/cycle-device") }),
  };
}
