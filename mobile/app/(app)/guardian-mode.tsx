import { View, Text, Switch, Pressable } from "react-native";
import { router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { useApi } from "@/hooks/useApi";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Card } from "@/components/ui/Card";
import { ListRow } from "@/components/ui/ListRow";
import { ShieldScanner } from "@/components/ui/ShieldScanner";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/StateViews";
import { colors } from "@/constants/theme";
import type { Asset, Incident } from "@/types/api";

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

  const simulateMutation = useMutation({
    mutationFn: () => api.post<Incident>("/demo/simulate-incident"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      router.push("/(app)/emergency-alert");
    },
  });

  const assets = assetsQuery.data ?? [];
  const armedCount = assets.filter((a) => a.is_armed).length;
  const isActive = armedCount > 0;

  return (
    <ScreenContainer onRefresh={() => assetsQuery.refetch()} refreshing={assetsQuery.isRefetching}>
      <ScreenHeader
        title="Guardian"
        right={
          <Pressable onPress={() => router.push("/(app)/assets")}>
            <Text className="text-primary-light text-[14px] font-medium">Manage</Text>
          </Pressable>
        }
      />

      {assetsQuery.isLoading ? <LoadingState /> : null}
      {assetsQuery.error ? (
        <ErrorState message={(assetsQuery.error as Error).message} onRetry={() => assetsQuery.refetch()} />
      ) : null}

      {!assetsQuery.isLoading && !assetsQuery.error ? (
        <>
          <View className="items-center py-8 mb-2">
            <ShieldScanner active={isActive} tone={isActive ? "primary" : "muted"} size={128} />
            <Text className="text-foreground dark:text-white font-semibold text-[18px] mt-5">
              {isActive ? "Guardian Mode is active" : "Nothing is armed"}
            </Text>
            <Text className="text-muted dark:text-[#8A8D98] text-center mt-1 text-[14px]">
              {armedCount} of {assets.length} assets are being monitored
            </Text>
          </View>

          {assets.length === 0 ? (
            <EmptyState title="No assets to guard" message="Add an asset first." />
          ) : (
            <Card className="mb-5">
              {assets.map((asset, i) => (
                <ListRow
                  key={asset.id}
                  icon={asset.category === "laptop" ? "monitor" : asset.category === "bag" ? "briefcase" : "file-text"}
                  title={asset.name}
                  subtitle={asset.is_armed ? "Armed · monitoring for movement" : "Not monitored"}
                  isLast={i === assets.length - 1}
                  right={
                    <Switch
                      value={asset.is_armed}
                      disabled={armMutation.isPending && armMutation.variables?.id === asset.id}
                      onValueChange={(value) => armMutation.mutate({ id: asset.id, is_armed: value })}
                      trackColor={{ false: colors.surfaceAlt, true: colors.primary }}
                      thumbColor="#FFFFFF"
                    />
                  }
                />
              ))}
            </Card>
          )}

          <Pressable
            onPress={() => simulateMutation.mutate()}
            disabled={assets.length === 0 || simulateMutation.isPending}
            className="flex-row items-center justify-center py-3 border border-border dark:border-[#26282F] rounded-xl"
          >
            <Feather name="zap" size={16} color={colors.mutedLight} style={{ marginRight: 8 }} />
            <Text className="text-muted-light text-[14px] font-medium">
              {simulateMutation.isPending ? "Simulating…" : "Simulate a test alert"}
            </Text>
          </Pressable>
        </>
      ) : null}
    </ScreenContainer>
  );
}
