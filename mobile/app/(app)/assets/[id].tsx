import { View, Text, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/hooks/useApi";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingState, ErrorState } from "@/components/ui/StateViews";
import type { Asset } from "@/types/api";

export default function AssetDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const api = useApi();
  const queryClient = useQueryClient();

  const assetQuery = useQuery({
    queryKey: ["assets", id],
    queryFn: () => api.get<Asset>(`/assets/${id}`),
  });

  const armMutation = useMutation({
    mutationFn: (is_armed: boolean) => api.patch<Asset>(`/assets/${id}`, { is_armed }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["assets", id], updated);
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/assets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      router.back();
    },
  });

  const confirmDelete = () => {
    Alert.alert("Remove asset", "This asset will no longer be tracked. Continue?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => deleteMutation.mutate() },
    ]);
  };

  if (assetQuery.isLoading) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Asset" showBack />
        <LoadingState />
      </ScreenContainer>
    );
  }

  if (assetQuery.error || !assetQuery.data) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Asset" showBack />
        <ErrorState onRetry={() => assetQuery.refetch()} />
      </ScreenContainer>
    );
  }

  const asset = assetQuery.data;

  return (
    <ScreenContainer>
      <ScreenHeader title={asset.name} showBack subtitle={asset.category} />

      <Card className="mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-foreground dark:text-white font-semibold">Guardian status</Text>
          <Badge label={asset.is_armed ? "Armed" : "Disarmed"} tone={asset.is_armed ? "safe" : "muted"} />
        </View>
        <Text className="text-muted dark:text-[#8A8D98] mb-4">
          {asset.is_armed
            ? "This asset is actively monitored. Unexpected movement will trigger an alert."
            : "This asset is not currently monitored."}
        </Text>
        <Button
          label={asset.is_armed ? "Disarm" : "Arm"}
          variant={asset.is_armed ? "secondary" : "primary"}
          loading={armMutation.isPending}
          onPress={() => armMutation.mutate(!asset.is_armed)}
        />
      </Card>

      {asset.description ? (
        <Card className="mb-4">
          <Text className="text-foreground dark:text-white font-semibold mb-1">Description</Text>
          <Text className="text-muted dark:text-[#8A8D98]">{asset.description}</Text>
        </Card>
      ) : null}

      <View className="mt-2">
        <Button label="Remove asset" variant="danger" onPress={confirmDelete} loading={deleteMutation.isPending} />
      </View>
    </ScreenContainer>
  );
}
