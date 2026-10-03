import { useQuery } from "@tanstack/react-query";
import { qk } from "@/src/lib/api/keys";
import { useApi } from "@/src/lib/api/useApi";
import type { LevelInfo, ProgressItem, XPTransaction } from "@/src/types/api";

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
