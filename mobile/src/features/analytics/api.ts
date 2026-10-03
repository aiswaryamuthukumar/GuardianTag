import { useQuery } from "@tanstack/react-query";
import { qk } from "@/src/lib/api/keys";
import { useApi } from "@/src/lib/api/useApi";
import type {
  AnalyticsSummary,
  AlertTimelineEntry,
  AssetCoverage,
  DailyIncidentCount,
  EventMixItem,
  Heatmap,
  HeatmapDay,
  ResponseTimes,
} from "@/src/types/api";

function useAnalytics<T>(name: string, path: string) {
  const api = useApi();
  return useQuery({ queryKey: qk.analytics(name, { path }), queryFn: () => api.get<T>(path) });
}

export const useSummary = () => useAnalytics<AnalyticsSummary>("summary", "/analytics/summary");
export const useTrend = (days = 14) =>
  useAnalytics<DailyIncidentCount[]>("trend", `/analytics/incidents-trend?days=${days}`);
export const useResponseTimes = () => useAnalytics<ResponseTimes>("response", "/analytics/response-times");
export const useCoverage = () => useAnalytics<AssetCoverage>("coverage", "/analytics/asset-coverage");
export const useHeatmap = (days = 30) => useAnalytics<Heatmap>("heatmap", `/analytics/heatmap?days=${days}`);
export const useEventMix = (days = 7) => useAnalytics<EventMixItem[]>("event-mix", `/analytics/event-mix?days=${days}`);
export const useSecurityHeatmap = (days = 28) =>
  useAnalytics<HeatmapDay[]>("security-heatmap", `/analytics/security-heatmap?days=${days}`);
export const useAlertTimeline = (limit = 8) =>
  useAnalytics<AlertTimelineEntry[]>("alert-timeline", `/analytics/alert-timeline?limit=${limit}`);
