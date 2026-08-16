import { View, Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/hooks/useApi";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Card, PressableCard } from "@/components/ui/Card";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { LoadingState, ErrorState } from "@/components/ui/StateViews";
import type { IncidentDetail, IncidentStatus } from "@/types/api";

const statusTone: Record<IncidentStatus, BadgeTone> = {
  open: "emergency",
  investigating: "warning",
  resolved: "safe",
  false_alarm: "muted",
};

export default function IncidentDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const api = useApi();

  const incidentQuery = useQuery({
    queryKey: ["incidents", id],
    queryFn: () => api.get<IncidentDetail>(`/incidents/${id}`),
  });

  if (incidentQuery.isLoading) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Incident" showBack />
        <LoadingState />
      </ScreenContainer>
    );
  }

  if (incidentQuery.error || !incidentQuery.data) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Incident" showBack />
        <ErrorState onRetry={() => incidentQuery.refetch()} />
      </ScreenContainer>
    );
  }

  const incident = incidentQuery.data;
  const isOpen = incident.status === "open" || incident.status === "investigating";

  return (
    <ScreenContainer>
      <ScreenHeader title={incident.title} showBack />

      <Card className="mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <Badge label={incident.status.replace("_", " ")} tone={statusTone[incident.status]} />
          <Badge label={incident.severity} tone="warning" />
        </View>
        {incident.description ? <Text className="text-muted mb-2">{incident.description}</Text> : null}
        <Text className="text-muted text-xs">
          Triggered {new Date(incident.triggered_at).toLocaleString()}
        </Text>
        {incident.resolved_at ? (
          <Text className="text-muted text-xs mt-1">
            Resolved {new Date(incident.resolved_at).toLocaleString()}
          </Text>
        ) : null}
      </Card>

      <PressableCard onPress={() => router.push(`/(app)/incidents/${id}/timeline`)} className="mb-2">
        <Text className="text-white font-medium">Timeline</Text>
        <Text className="text-muted text-xs mt-0.5">
          {incident.timeline_events.length} event{incident.timeline_events.length === 1 ? "" : "s"}
        </Text>
      </PressableCard>

      <PressableCard onPress={() => router.push(`/(app)/incidents/${id}/evidence`)} className="mb-2">
        <Text className="text-white font-medium">Evidence Board</Text>
        <Text className="text-muted text-xs mt-0.5">
          {incident.evidence_items.length} item{incident.evidence_items.length === 1 ? "" : "s"}
        </Text>
      </PressableCard>

      {isOpen ? (
        <PressableCard onPress={() => router.push(`/(app)/incidents/${id}/resolution`)} className="mb-2">
          <Text className="text-white font-medium">Resolve Case</Text>
          <Text className="text-muted text-xs mt-0.5">Close this incident out</Text>
        </PressableCard>
      ) : null}
    </ScreenContainer>
  );
}
