import { View, Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/hooks/useApi";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Card } from "@/components/ui/Card";
import { ListRow } from "@/components/ui/ListRow";
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

      <View className="flex-row items-center gap-2 mb-3">
        <Badge label={incident.status.replace("_", " ")} tone={statusTone[incident.status]} />
        <Badge label={incident.severity} tone="warning" />
      </View>

      {incident.description ? <Text className="text-foreground dark:text-white text-[15px] mb-3 leading-6">{incident.description}</Text> : null}

      <Text className="text-muted dark:text-[#8A8D98] text-[13px] mb-6">
        Triggered {new Date(incident.triggered_at).toLocaleString()}
        {incident.resolved_at ? ` · Resolved ${new Date(incident.resolved_at).toLocaleString()}` : ""}
      </Text>

      <Card>
        <ListRow
          icon="clock"
          title="Timeline"
          subtitle={`${incident.timeline_events.length} event${incident.timeline_events.length === 1 ? "" : "s"}`}
          onPress={() => router.push(`/(app)/incidents/${id}/timeline`)}
          showChevron
        />
        <ListRow
          icon="camera"
          title="Evidence board"
          subtitle={`${incident.evidence_items.length} item${incident.evidence_items.length === 1 ? "" : "s"}`}
          onPress={() => router.push(`/(app)/incidents/${id}/evidence`)}
          showChevron
          isLast={!isOpen}
        />
        {isOpen ? (
          <ListRow
            icon="check-circle"
            title="Resolve case"
            subtitle="Close this incident out"
            onPress={() => router.push(`/(app)/incidents/${id}/resolution`)}
            showChevron
            isLast
          />
        ) : null}
      </Card>
    </ScreenContainer>
  );
}
