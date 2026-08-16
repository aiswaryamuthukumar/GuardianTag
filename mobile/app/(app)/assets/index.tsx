import { useState } from "react";
import { View, Text, TextInput, Modal } from "react-native";
import { router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/hooks/useApi";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { PressableCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/StateViews";
import type { Asset, AssetCategory } from "@/types/api";

const categories: AssetCategory[] = ["bag", "laptop", "document", "other"];

export default function Assets() {
  const api = useApi();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<AssetCategory>("bag");

  const assetsQuery = useQuery({
    queryKey: ["assets"],
    queryFn: () => api.get<Asset[]>("/assets"),
  });

  const createMutation = useMutation({
    mutationFn: () => api.post<Asset>("/assets", { name, category }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      setModalOpen(false);
      setName("");
      setCategory("bag");
    },
  });

  return (
    <ScreenContainer onRefresh={() => assetsQuery.refetch()} refreshing={assetsQuery.isRefetching}>
      <ScreenHeader
        title="Assets"
        subtitle="Things you're guarding"
        right={<Button label="+ Add" onPress={() => setModalOpen(true)} variant="secondary" />}
      />

      {assetsQuery.isLoading ? <LoadingState /> : null}
      {assetsQuery.error ? (
        <ErrorState message={(assetsQuery.error as Error).message} onRetry={() => assetsQuery.refetch()} />
      ) : null}

      {assetsQuery.data && assetsQuery.data.length === 0 ? (
        <EmptyState
          title="No assets yet"
          message="Add a bag, laptop, or document to start tracking it."
          actionLabel="Add an asset"
          onAction={() => setModalOpen(true)}
        />
      ) : null}

      {assetsQuery.data?.map((asset) => (
        <PressableCard
          key={asset.id}
          onPress={() => router.push(`/(app)/assets/${asset.id}`)}
          className="mb-2"
        >
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-white font-medium">{asset.name}</Text>
              <Text className="text-muted text-xs mt-0.5 capitalize">{asset.category}</Text>
            </View>
            <Badge label={asset.is_armed ? "Armed" : "Disarmed"} tone={asset.is_armed ? "safe" : "muted"} />
          </View>
        </PressableCard>
      ))}

      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-surface rounded-t-3xl p-5 border-t border-border">
            <Text className="text-white text-lg font-bold mb-4">New Asset</Text>
            <TextInput
              className="bg-surface-alt text-white rounded-xl px-4 py-3 border border-border mb-3"
              placeholder="Asset name"
              placeholderTextColor="#8B8B9E"
              value={name}
              onChangeText={setName}
            />
            <View className="flex-row flex-wrap gap-2 mb-4">
              {categories.map((c) => (
                <View key={c} className="flex-1 min-w-[70px]">
                  <Button
                    label={c}
                    variant={c === category ? "primary" : "secondary"}
                    onPress={() => setCategory(c)}
                  />
                </View>
              ))}
            </View>
            {createMutation.isError ? (
              <Text className="text-emergency mb-3">{(createMutation.error as Error).message}</Text>
            ) : null}
            <Button
              label="Create"
              onPress={() => createMutation.mutate()}
              loading={createMutation.isPending}
              disabled={name.trim().length === 0}
            />
            <View className="mt-2">
              <Button label="Cancel" variant="ghost" onPress={() => setModalOpen(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
