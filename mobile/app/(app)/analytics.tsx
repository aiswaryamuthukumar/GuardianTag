import { View, Text } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/hooks/useApi";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { StatTile } from "@/components/ui/StatTile";
import { Card } from "@/components/ui/Card";
import { LoadingState, ErrorState } from "@/components/ui/StateViews";
import { IncidentTrendChart } from "@/components/charts/IncidentTrendChart";
import { formatDuration } from "@/lib/format";
import type {
  AnalyticsSummary,
  AssetCoverage,
  DailyIncidentCountApi,
  ResponseTimes,
} from "@/types/api";

export default function Analytics() {
  const api = useApi();

  const summaryQuery = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: () => api.get<AnalyticsSummary>("/analytics/summary"),
  });
  const trendQuery = useQuery({
    queryKey: ["analytics-trend"],
    queryFn: () => api.get<DailyIncidentCountApi[]>("/analytics/incidents-trend?days=14"),
  });
  const responseTimesQuery = useQuery({
    queryKey: ["analytics-response-times"],
    queryFn: () => api.get<ResponseTimes>("/analytics/response-times"),
  });
  const coverageQuery = useQuery({
    queryKey: ["analytics-coverage"],
    queryFn: () => api.get<AssetCoverage>("/analytics/asset-coverage"),
  });

  const loading = summaryQuery.isLoading || trendQuery.isLoading;
  const error = summaryQuery.error || trendQuery.error;

  return (
    <ScreenContainer onRefresh={() => summaryQuery.refetch()} refreshing={summaryQuery.isRefetching}>
      <ScreenHeader title="Analytics" showBack subtitle="How your guardians are doing" />

      {loading ? <LoadingState /> : null}
      {error ? (
        <ErrorState message={(error as Error).message} onRetry={() => summaryQuery.refetch()} />
      ) : null}

      {summaryQuery.data ? (
        <>
          <View className="flex-row gap-3 mb-3">
            <StatTile label="Devices" value={summaryQuery.data.total_devices} accent="text-primary-light" />
            <StatTile label="Assets" value={summaryQuery.data.total_assets} accent="text-primary-light" />
          </View>
          <View className="flex-row gap-3 mb-3">
            <StatTile
              label="Open incidents"
              value={summaryQuery.data.open_incidents}
              accent={summaryQuery.data.open_incidents > 0 ? "text-emergency" : "text-safe"}
            />
            <StatTile label="Resolved" value={summaryQuery.data.resolved_incidents} accent="text-safe" />
          </View>
          <View className="flex-row gap-3 mb-4">
            <StatTile label="False alarms" value={summaryQuery.data.false_alarms} accent="text-warning" />
            {coverageQuery.data ? (
              <StatTile
                label="Asset coverage"
                value={`${coverageQuery.data.coverage_percent}%`}
                accent="text-primary-light"
              />
            ) : null}
          </View>
        </>
      ) : null}

      {trendQuery.data && trendQuery.data.length > 0 ? (
        <Card className="mb-4">
          <Text className="text-white font-semibold mb-3">Incidents, last 14 days</Text>
          <IncidentTrendChart data={trendQuery.data} />
        </Card>
      ) : null}

      {responseTimesQuery.data ? (
        <Card className="mb-4">
          <Text className="text-white font-semibold mb-3">Response times</Text>
          <View className="flex-row justify-between mb-2">
            <Text className="text-muted">Avg. quick disarm</Text>
            <Text className="text-white font-medium">
              {formatDuration(responseTimesQuery.data.avg_disarm_seconds)}
              {responseTimesQuery.data.disarm_sample_size > 0
                ? ` (${responseTimesQuery.data.disarm_sample_size})`
                : ""}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-muted">Avg. manual resolution</Text>
            <Text className="text-white font-medium">
              {formatDuration(responseTimesQuery.data.avg_resolution_seconds)}
              {responseTimesQuery.data.resolved_sample_size > 0
                ? ` (${responseTimesQuery.data.resolved_sample_size})`
                : ""}
            </Text>
          </View>
        </Card>
      ) : null}
    </ScreenContainer>
  );
}
