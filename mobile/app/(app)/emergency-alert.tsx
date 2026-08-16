import { View, Text } from "react-native";
import { router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/hooks/useApi";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/StateViews";
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
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
    },
  });

  const incident = openIncidentsQuery.data?.[0];

  if (openIncidentsQuery.isLoading) {
    return (
      <ScreenContainer>
        <LoadingState />
      </ScreenContainer>
    );
  }

  if (openIncidentsQuery.error) {
    return (
      <ScreenContainer>
        <ErrorState onRetry={() => openIncidentsQuery.refetch()} />
      </ScreenContainer>
    );
  }

  if (!incident) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center py-20">
          <View className="w-24 h-24 rounded-full bg-safe/20 items-center justify-center mb-4">
            <Text className="text-4xl">✓</Text>
          </View>
          <EmptyState title="All clear" message="No active emergencies right now." />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View className="items-center py-6">
        <View className="w-24 h-24 rounded-full bg-emergency/20 items-center justify-center mb-4">
          <Text className="text-4xl">!</Text>
        </View>
        <Text className="text-emergency text-2xl font-extrabold">Active Alert</Text>
        <Text className="text-muted mt-1">{new Date(incident.triggered_at).toLocaleString()}</Text>
      </View>

      <Card className="mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-white font-semibold text-lg">{incident.title}</Text>
          <Badge label={incident.severity} tone="emergency" />
        </View>
        {incident.description ? <Text className="text-muted">{incident.description}</Text> : null}
      </Card>

      <Button
        label="View Full Incident"
        onPress={() => router.push(`/(app)/incidents/${incident.id}`)}
      />
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
