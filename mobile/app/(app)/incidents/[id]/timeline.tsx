import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/hooks/useApi";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/StateViews";
import type { IncidentDetail } from "@/types/api";

export default function Timeline() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const api = useApi();

  const incidentQuery = useQuery({
    queryKey: ["incidents", id],
    queryFn: () => api.get<IncidentDetail>(`/incidents/${id}`),
  });

  return (
    <ScreenContainer>
      <ScreenHeader title="Timeline" showBack />

      {incidentQuery.isLoading ? <LoadingState /> : null}
      {incidentQuery.error ? <ErrorState onRetry={() => incidentQuery.refetch()} /> : null}

      {incidentQuery.data && incidentQuery.data.timeline_events.length === 0 ? (
        <EmptyState title="No timeline events" message="Nothing logged yet." />
      ) : null}

      <View className="pl-2">
        {incidentQuery.data?.timeline_events.map((event, index) => (
          <View key={event.id} className="flex-row mb-4">
            <View className="items-center mr-3">
              <View className="w-3 h-3 rounded-full bg-primary mt-1" />
              {index < (incidentQuery.data?.timeline_events.length ?? 0) - 1 ? (
                <View className="w-px flex-1 bg-border mt-1" />
              ) : null}
            </View>
            <View className="flex-1 pb-1">
              <Text className="text-foreground dark:text-white font-medium">{event.description}</Text>
              <Text className="text-muted dark:text-[#8A8D98] text-xs mt-0.5 capitalize">
                {event.actor} · {new Date(event.occurred_at).toLocaleString()}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScreenContainer>
  );
}
