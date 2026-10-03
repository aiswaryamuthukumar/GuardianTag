import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/src/lib/api/keys";
import { useApi } from "@/src/lib/api/useApi";
import type { Notice, Room, WardenAnalytics, WardenIncident } from "@/src/types/api";

export function useBoard(scope: "active" | "all" = "active") {
  const api = useApi();
  return useQuery({
    queryKey: [...qk.warden("incidents"), scope],
    queryFn: () => api.get<WardenIncident[]>(`/warden/incidents?scope=${scope}`),
  });
}

export function useRooms() {
  const api = useApi();
  return useQuery({ queryKey: qk.warden("rooms"), queryFn: () => api.get<Room[]>("/warden/rooms") });
}

export function useWardenStats() {
  const api = useApi();
  return useQuery({ queryKey: qk.warden("analytics"), queryFn: () => api.get<WardenAnalytics>("/warden/analytics") });
}

export function useSendNotice() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { title: string; body: string; hostel_block?: string }) =>
      api.post<Notice>("/warden/notices", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.notices }),
  });
}
