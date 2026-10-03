import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/src/lib/api/keys";
import { useApi } from "@/src/lib/api/useApi";
import type { ArmSchedule } from "@/src/types/api";

export type ScheduleInput = {
  asset_id: string;
  days_mask: number;
  start_time: string; // HH:MM
  end_time: string;
  enabled?: boolean;
};

export function useSchedules() {
  const api = useApi();
  return useQuery({ queryKey: qk.schedules, queryFn: () => api.get<ArmSchedule[]>("/schedules") });
}

export function useSaveSchedule(id?: string) {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ScheduleInput) =>
      id
        ? api.patch<ArmSchedule>(`/schedules/${id}`, {
            days_mask: body.days_mask,
            start_time: body.start_time,
            end_time: body.end_time,
            enabled: body.enabled,
          })
        : api.post<ArmSchedule>("/schedules", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.schedules }),
  });
}

export function useToggleSchedule() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      api.patch<ArmSchedule>(`/schedules/${id}`, { enabled }),
    onSuccess: (schedule) =>
      qc.setQueryData<ArmSchedule[]>(qk.schedules, (list) => list?.map((s) => (s.id === schedule.id ? schedule : s))),
  });
}

export function useDeleteSchedule() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/schedules/${id}`),
    onSuccess: (_r, id) => qc.setQueryData<ArmSchedule[]>(qk.schedules, (list) => list?.filter((s) => s.id !== id)),
  });
}
