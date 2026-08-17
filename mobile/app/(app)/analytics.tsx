import { View, Text } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/hooks/useApi";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Card } from "@/components/ui/Card";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/StateViews";
import { SecurityGauge } from "@/components/charts/SecurityGauge";
import { CaseDonut } from "@/components/charts/CaseDonut";
import { ActivityTimeline } from "@/components/charts/ActivityTimeline";
import { DeviceHealthBars } from "@/components/charts/DeviceHealthBars";
import { ResponseTimeBars } from "@/components/charts/ResponseTimeBars";
import { colors } from "@/constants/theme";
import type {
  AnalyticsSummary,
  AssetCoverage,
  DailyIncidentCountApi,
  Device,
  ResponseTimes,
  SecurityScore,
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
  const scoreQuery = useQuery({
    queryKey: ["security-score"],
    queryFn: () => api.get<SecurityScore>("/gamification/security-score"),
  });
  const devicesQuery = useQuery({ queryKey: ["devices"], queryFn: () => api.get<Device[]>("/devices") });

  const loading = summaryQuery.isLoading || trendQuery.isLoading;
  const error = summaryQuery.error || trendQuery.error;

  return (
    <ScreenContainer onRefresh={() => summaryQuery.refetch()} refreshing={summaryQuery.isRefetching}>
      <ScreenHeader title="Analytics" showBack subtitle="How your guardians are doing" />

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={(error as Error).message} onRetry={() => summaryQuery.refetch()} /> : null}

      {scoreQuery.data ? (
        <Card className="mb-4 items-center py-6">
          <SecurityGauge score={scoreQuery.data.score} label="Security score" />
          <View className="flex-row items-center mt-4 gap-4">
            <Text className="text-muted text-[12px]">
              <Text className="text-safe-light font-medium">{coverageQuery.data?.coverage_percent ?? 0}%</Text> asset coverage
            </Text>
            <Text className="text-muted text-[12px]">
              <Text className="text-primary-light font-medium">{scoreQuery.data.streak_days}d</Text> streak
            </Text>
          </View>
        </Card>
      ) : null}

      {summaryQuery.data ? (
        <Card className="mb-4">
          <Text className="text-foreground font-semibold mb-4">Case breakdown</Text>
          <CaseDonut
            segments={[
              { label: "Resolved", value: summaryQuery.data.resolved_incidents, color: colors.safe },
              { label: "Open", value: summaryQuery.data.open_incidents, color: colors.emergency },
              { label: "False alarm", value: summaryQuery.data.false_alarms, color: colors.muted },
            ]}
          />
        </Card>
      ) : null}

      {trendQuery.data && trendQuery.data.length > 0 ? (
        <Card className="mb-4">
          <Text className="text-foreground font-semibold mb-3">Incident activity, last 14 days</Text>
          <ActivityTimeline data={trendQuery.data} />
        </Card>
      ) : null}

      <Card className="mb-4">
        <Text className="text-foreground font-semibold mb-3">Device health</Text>
        {devicesQuery.isLoading ? <LoadingState label="Loading devices…" /> : null}
        {devicesQuery.data && devicesQuery.data.length === 0 ? (
          <EmptyState title="No devices paired" message="Pair a sensor node to see live health here." />
        ) : null}
        {devicesQuery.data && devicesQuery.data.length > 0 ? <DeviceHealthBars devices={devicesQuery.data} /> : null}
      </Card>

      {responseTimesQuery.data ? (
        <Card className="mb-4">
          <Text className="text-foreground font-semibold mb-3">Response times</Text>
          <ResponseTimeBars
            avgDisarmSeconds={responseTimesQuery.data.avg_disarm_seconds}
            disarmSampleSize={responseTimesQuery.data.disarm_sample_size}
            avgResolutionSeconds={responseTimesQuery.data.avg_resolution_seconds}
            resolvedSampleSize={responseTimesQuery.data.resolved_sample_size}
          />
        </Card>
      ) : null}
    </ScreenContainer>
  );
}
