import { View, Text } from "react-native";
import { router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/hooks/useApi";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ShieldScanner } from "@/components/ui/ShieldScanner";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/StateViews";
import { toastBus } from "@/lib/demo/toast";
import type { Incident } from "@/types/api";

export default function EmergencyAlert() {
  const api = useApi();
  const queryClient = useQueryClient();

  const openIncidentsQuery = useQuery({
    queryKey: ["incidents", "open"],
    queryFn: () => api.get<Incident[]>("/incidents?status=open"),
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) =>
      api.patch<Incident>(`/incidents/${id}/resolve`, {
        status: "false_alarm",
        resolution_notes: "Marked as false alarm from the app",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries();
      toastBus.show({ icon: "shield", title: "Marked False Alarm", tone: "warning" });
    },
  });

  const incident = openIncidentsQuery.data?.[0];

  if (openIncidentsQuery.isLoading) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Alert" showBack />
        <LoadingState />
      </ScreenContainer>
    );
  }

  if (openIncidentsQuery.error) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Alert" showBack />
        <ErrorState onRetry={() => openIncidentsQuery.refetch()} />
      </ScreenContainer>
    );
  }

  if (!incident) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Alert" showBack />
        <View className="flex-1 items-center justify-center py-20">
          <ShieldScanner active tone="primary" size={110} icon="check" />
          <View className="mt-6">
            <EmptyState title="All clear" message="No active emergencies right now." />
          </View>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScreenHeader title="Alert" showBack />
      <View className="items-center py-6">
        <ShieldScanner active tone="emergency" size={120} icon="alert-triangle" fast />
        <Text className="text-emergency-light text-[22px] font-bold mt-5">Active alert</Text>
        <Text className="text-muted mt-1">{new Date(incident.triggered_at).toLocaleString()}</Text>
      </View>

      <Card className="mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-foreground font-semibold text-lg flex-1 mr-2">{incident.title}</Text>
          <Badge label={incident.severity} tone="emergency" />
        </View>
        {incident.description ? <Text className="text-muted">{incident.description}</Text> : null}
      </Card>

      <Button label="View Full Incident" onPress={() => router.push(`/(app)/incidents/${incident.id}`)} />
      <View className="mt-3">
        <Button
          label="Mark as False Alarm"
          variant="secondary"
          loading={resolveMutation.isPending}
          onPress={() => resolveMutation.mutate(incident.id)}
        />
      </View>
    </ScreenContainer>
  );
}
