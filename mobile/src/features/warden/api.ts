import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/src/lib/api/keys";
import { useApi } from "@/src/lib/api/useApi";
import type { Notice, NoticePriority, Room, WardenAnalytics, WardenIncident } from "@/src/types/api";

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
    mutationFn: (body: { title: string; body: string; hostel_block?: string; priority: NoticePriority }) =>
      api.post<Notice>("/warden/notices", body),
    onSuccess: (notice) =>
      qc.setQueryData<Notice[]>(qk.notices, (list) => (list && !list.some((n) => n.id === notice.id) ? [notice, ...list] : list)),
  });
}

export function useDeleteNotice() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/warden/notices/${id}`),
    onSuccess: (_r, id) => qc.setQueryData<Notice[]>(qk.notices, (list) => list?.filter((n) => n.id !== id)),
  });
}
