import { View, Text } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { useApi } from "@/hooks/useApi";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { StatTile } from "@/components/ui/StatTile";
import { PressableCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/StateViews";
import type { AnalyticsSummary, Device, SecurityScore } from "@/types/api";

export default function Home() {
  const api = useApi();
  const { user } = useUser();

  const devicesQuery = useQuery({
    queryKey: ["devices"],
    queryFn: () => api.get<Device[]>("/devices"),
  });
  const summaryQuery = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: () => api.get<AnalyticsSummary>("/analytics/summary"),
  });
  const scoreQuery = useQuery({
    queryKey: ["security-score"],
    queryFn: () => api.get<SecurityScore>("/gamification/security-score"),
  });

  const loading = devicesQuery.isLoading || summaryQuery.isLoading || scoreQuery.isLoading;
  const error = devicesQuery.error || summaryQuery.error || scoreQuery.error;

  return (
    <ScreenContainer onRefresh={() => devicesQuery.refetch()} refreshing={devicesQuery.isRefetching}>
      <Text className="text-muted mt-2">Welcome back</Text>
      <Text className="text-2xl font-bold text-white mb-4">
        {user?.firstName ?? "Guardian"}
      </Text>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={(error as Error).message} onRetry={() => devicesQuery.refetch()} /> : null}

      {!loading && !error ? (
        <>
          <View className="flex-row gap-3 mb-4">
            <StatTile
              label="Security score"
              value={scoreQuery.data?.score ?? 0}
              accent="text-primary-light"
            />
            <StatTile
              label="Open incidents"
              value={summaryQuery.data?.open_incidents ?? 0}
              accent={
                (summaryQuery.data?.open_incidents ?? 0) > 0 ? "text-emergency" : "text-safe"
              }
            />
          </View>

          <PressableCard onPress={() => router.push("/(app)/guardian-mode")} className="mb-3">
            <Text className="text-white font-semibold text-lg mb-1">Guardian Mode</Text>
            <Text className="text-muted">Arm or disarm your assets</Text>
          </PressableCard>

          <Text className="text-white font-semibold text-lg mt-2 mb-2">Your devices</Text>
          {devicesQuery.data && devicesQuery.data.length === 0 ? (
            <EmptyState
              title="No devices paired yet"
              message="Pair an ESP32 sensor node to start guarding your assets."
              actionLabel="Pair a device"
              onAction={() => router.push("/(app)/device-pairing")}
            />
          ) : null}
          {devicesQuery.data?.map((device) => (
            <PressableCard
              key={device.id}
              onPress={() => router.push("/(app)/device-health")}
              className="mb-2"
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-white font-medium">{device.name}</Text>
                <Badge
                  label={device.status}
                  tone={
                    device.status === "online"
                      ? "safe"
                      : device.status === "degraded"
                        ? "warning"
                        : "muted"
                  }
                />
              </View>
            </PressableCard>
          ))}
        </>
      ) : null}
    </ScreenContainer>
  );
}
