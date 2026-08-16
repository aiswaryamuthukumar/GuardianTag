import { useState } from "react";
import { View, Text, TextInput } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/hooks/useApi";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/StateViews";
import type { Evidence, IncidentDetail } from "@/types/api";

export default function EvidenceBoard() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const api = useApi();
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");

  const incidentQuery = useQuery({
    queryKey: ["incidents", id],
    queryFn: () => api.get<IncidentDetail>(`/incidents/${id}`),
  });

  const addNoteMutation = useMutation({
    mutationFn: () => api.post<Evidence>(`/incidents/${id}/evidence`, { type: "note", content: note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents", id] });
      setNote("");
    },
  });

  return (
    <ScreenContainer>
      <ScreenHeader title="Evidence Board" showBack />

      {incidentQuery.isLoading ? <LoadingState /> : null}
      {incidentQuery.error ? <ErrorState onRetry={() => incidentQuery.refetch()} /> : null}

      {incidentQuery.data && incidentQuery.data.evidence_items.length === 0 ? (
        <EmptyState title="No evidence yet" message="Sensor snapshots and notes will appear here." />
      ) : null}

      {incidentQuery.data?.evidence_items.map((item) => (
        <Card key={item.id} className="mb-2">
          <View className="flex-row items-center justify-between mb-1">
            <Badge label={item.type.replace("_", " ")} tone="primary" />
            <Text className="text-muted text-xs">{new Date(item.captured_at).toLocaleString()}</Text>
          </View>
          {item.content ? <Text className="text-white mt-1">{item.content}</Text> : null}
          {item.url ? <Text className="text-primary-light mt-1">{item.url}</Text> : null}
        </Card>
      ))}

      <View className="mt-4">
        <Text className="text-white font-semibold mb-2">Add a note</Text>
        <TextInput
          className="bg-surface text-white rounded-xl px-4 py-3 border border-border mb-3"
          placeholder="What did you observe?"
          placeholderTextColor="#8B8B9E"
          multiline
          value={note}
          onChangeText={setNote}
        />
        <Button
          label="Add Note"
          onPress={() => addNoteMutation.mutate()}
          loading={addNoteMutation.isPending}
          disabled={note.trim().length === 0}
        />
      </View>
    </ScreenContainer>
  );
}
