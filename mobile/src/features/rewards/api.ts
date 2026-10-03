import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/src/lib/api/keys";
import { useApi } from "@/src/lib/api/useApi";
import type { DailyCheck, LevelInfo, ProgressItem, WeeklySummary, XPTransaction } from "@/src/types/api";

export function useLevel() {
  const api = useApi();
  return useQuery({ queryKey: qk.level, queryFn: () => api.get<LevelInfo>("/gamification/level") });
}

export function useProgress() {
  const api = useApi();
  return useQuery({ queryKey: qk.progress, queryFn: () => api.get<ProgressItem[]>("/gamification/progress") });
}

export function useXpHistory() {
  const api = useApi();
  return useQuery({ queryKey: qk.xp, queryFn: () => api.get<XPTransaction[]>("/gamification/xp") });
}

export function useDailyCheck() {
  const api = useApi();
  return useQuery({ queryKey: qk.dailyCheck, queryFn: () => api.get<DailyCheck>("/gamification/daily-check") });
}

export function useCompleteDailyCheck() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<DailyCheck>("/gamification/daily-check"),
    onSuccess: (state) => {
      qc.setQueryData(qk.dailyCheck, state);
      qc.invalidateQueries({ queryKey: ["gamification"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export function useWeeklySummary() {
  const api = useApi();
  return useQuery({ queryKey: qk.weekly, queryFn: () => api.get<WeeklySummary>("/gamification/weekly-summary") });
}
