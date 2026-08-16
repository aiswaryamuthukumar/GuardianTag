import { useState } from "react";
import { View, Text, TextInput } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/hooks/useApi";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Button } from "@/components/ui/Button";
import type { Incident, IncidentStatus } from "@/types/api";

export default function CaseResolution() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const api = useApi();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<IncidentStatus>("resolved");

  const resolveMutation = useMutation({
    mutationFn: () =>
      api.patch<Incident>(`/incidents/${id}/resolve`, { status, resolution_notes: notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      queryClient.invalidateQueries({ queryKey: ["incidents", id] });
      router.replace(`/(app)/incidents/${id}`);
    },
  });

  return (
    <ScreenContainer>
      <ScreenHeader title="Resolve Case" showBack subtitle="Close out this incident" />

      <View className="flex-row gap-2 mb-4">
        <View className="flex-1">
          <Button
            label="Resolved"
            variant={status === "resolved" ? "primary" : "secondary"}
            onPress={() => setStatus("resolved")}
          />
        </View>
        <View className="flex-1">
          <Button
            label="False Alarm"
            variant={status === "false_alarm" ? "primary" : "secondary"}
            onPress={() => setStatus("false_alarm")}
          />
        </View>
      </View>

      <Text className="text-white font-semibold mb-2">Resolution notes</Text>
      <TextInput
        className="bg-surface text-white rounded-xl px-4 py-3 border border-border mb-4"
        placeholder="What happened, and how was it resolved?"
        placeholderTextColor="#8B8B9E"
        multiline
        numberOfLines={4}
        value={notes}
        onChangeText={setNotes}
      />

      {resolveMutation.isError ? (
        <Text className="text-emergency mb-3">{(resolveMutation.error as Error).message}</Text>
      ) : null}

      <Button label="Submit Resolution" onPress={() => resolveMutation.mutate()} loading={resolveMutation.isPending} />
    </ScreenContainer>
  );
}
