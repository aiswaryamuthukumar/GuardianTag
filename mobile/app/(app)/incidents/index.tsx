import { View, Text } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/hooks/useApi";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { PressableCard } from "@/components/ui/Card";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/StateViews";
import type { Incident, IncidentStatus } from "@/types/api";

const statusTone: Record<IncidentStatus, BadgeTone> = {
  open: "emergency",
  investigating: "warning",
  resolved: "safe",
  false_alarm: "muted",
};

export default function Incidents() {
  const api = useApi();
  const incidentsQuery = useQuery({
    queryKey: ["incidents"],
    queryFn: () => api.get<Incident[]>("/incidents"),
  });

  return (
    <ScreenContainer onRefresh={() => incidentsQuery.refetch()} refreshing={incidentsQuery.isRefetching}>
      <ScreenHeader title="Incidents" subtitle="Everything your guardians have flagged" />

      {incidentsQuery.isLoading ? <LoadingState /> : null}
      {incidentsQuery.error ? (
        <ErrorState message={(incidentsQuery.error as Error).message} onRetry={() => incidentsQuery.refetch()} />
      ) : null}

      {incidentsQuery.data && incidentsQuery.data.length === 0 ? (
        <EmptyState title="No incidents" message="Nothing has been flagged yet — that's a good thing." />
      ) : null}

      {incidentsQuery.data?.map((incident) => (
        <PressableCard
          key={incident.id}
          onPress={() => router.push(`/(app)/incidents/${incident.id}`)}
          className="mb-2"
        >
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-white font-medium flex-1 mr-2">{incident.title}</Text>
            <Badge label={incident.status.replace("_", " ")} tone={statusTone[incident.status]} />
          </View>
          <Text className="text-muted text-xs">
            {new Date(incident.triggered_at).toLocaleString()}
          </Text>
        </PressableCard>
      ))}
    </ScreenContainer>
  );
}
