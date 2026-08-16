import { View, Text } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/hooks/useApi";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/StateViews";
import type { Asset } from "@/types/api";

export default function GuardianMode() {
  const api = useApi();
  const queryClient = useQueryClient();

  const assetsQuery = useQuery({
    queryKey: ["assets"],
    queryFn: () => api.get<Asset[]>("/assets"),
  });

  const armMutation = useMutation({
    mutationFn: ({ id, is_armed }: { id: string; is_armed: boolean }) =>
      api.patch<Asset>(`/assets/${id}`, { is_armed }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["assets"] }),
  });

  const assets = assetsQuery.data ?? [];
  const armedCount = assets.filter((a) => a.is_armed).length;

  return (
    <ScreenContainer onRefresh={() => assetsQuery.refetch()} refreshing={assetsQuery.isRefetching}>
      <ScreenHeader title="Guardian Mode" showBack subtitle="Arm assets to start monitoring" />

      {assetsQuery.isLoading ? <LoadingState /> : null}
      {assetsQuery.error ? (
        <ErrorState message={(assetsQuery.error as Error).message} onRetry={() => assetsQuery.refetch()} />
      ) : null}

      {!assetsQuery.isLoading && !assetsQuery.error ? (
        <>
          <Card className="mb-4 items-center py-6">
            <View
              className={`w-20 h-20 rounded-full items-center justify-center mb-3 ${
                armedCount > 0 ? "bg-safe/20" : "bg-surface-alt"
              }`}
            >
              <Text className={`text-3xl font-bold ${armedCount > 0 ? "text-safe" : "text-muted"}`}>
                {armedCount}
              </Text>
            </View>
            <Text className="text-white font-semibold">
              {armedCount > 0 ? "Guardian Mode is active" : "Nothing is armed"}
            </Text>
            <Text className="text-muted text-center mt-1">
              {armedCount} of {assets.length} assets are being monitored
            </Text>
          </Card>

          {assets.length === 0 ? (
            <EmptyState title="No assets to guard" message="Add an asset first from the Assets tab." />
          ) : null}

          {assets.map((asset) => (
            <Card key={asset.id} className="mb-2 flex-row items-center justify-between">
              <View>
                <Text className="text-white font-medium">{asset.name}</Text>
                <Text className="text-muted text-xs capitalize">{asset.category}</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Badge label={asset.is_armed ? "Armed" : "Off"} tone={asset.is_armed ? "safe" : "muted"} />
                <View className="w-24">
                  <Button
                    label={asset.is_armed ? "Disarm" : "Arm"}
                    variant={asset.is_armed ? "secondary" : "primary"}
                    loading={armMutation.isPending && armMutation.variables?.id === asset.id}
                    onPress={() => armMutation.mutate({ id: asset.id, is_armed: !asset.is_armed })}
                  />
                </View>
              </View>
            </Card>
          ))}
        </>
      ) : null}
    </ScreenContainer>
  );
}
