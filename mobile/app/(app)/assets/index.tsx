import { useMemo, useState } from "react";
import { View, Text, TextInput, Modal, Pressable } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { colors } from "@/constants/theme";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/hooks/useApi";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Card } from "@/components/ui/Card";
import { ListRow } from "@/components/ui/ListRow";
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
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<AssetCategory | "all">("all");

  const assetsQuery = useQuery({
    queryKey: ["assets"],
    queryFn: () => api.get<Asset[]>("/assets"),
  });

  const filtered = useMemo(() => {
    return (assetsQuery.data ?? [])
      .filter((a) => categoryFilter === "all" || a.category === categoryFilter)
      .filter((a) => a.name.toLowerCase().includes(search.trim().toLowerCase()));
  }, [assetsQuery.data, categoryFilter, search]);

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
        showBack
        subtitle="Things you're guarding"
        right={
          <Pressable onPress={() => setModalOpen(true)} className="p-2">
            <Feather name="plus" size={22} color={colors.primaryLight} />
          </Pressable>
        }
      />

      <View className="flex-row items-center bg-surface dark:bg-[#15161C] border border-border dark:border-[#26282F] rounded-xl px-3 mb-3">
        <Feather name="search" size={16} color={colors.muted} />
        <TextInput
          className="flex-1 py-2.5 px-2 text-foreground dark:text-white text-[14px]"
          placeholder="Search assets"
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View className="flex-row flex-wrap gap-2 mb-4">
        {(["all", ...categories] as const).map((c) => {
          const active = categoryFilter === c;
          return (
            <Pressable
              key={c}
              onPress={() => setCategoryFilter(c)}
              className="px-3 py-1.5 rounded-full border capitalize"
              style={{
                backgroundColor: active ? colors.primary : "transparent",
                borderColor: active ? colors.primary : colors.border,
              }}
            >
              <Text className={`text-[12px] font-medium capitalize ${active ? "text-white" : "text-muted dark:text-[#8A8D98]"}`}>
                {c}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {assetsQuery.isLoading ? <LoadingState /> : null}
      {assetsQuery.error ? (
        <ErrorState message={(assetsQuery.error as Error).message} onRetry={() => assetsQuery.refetch()} />
      ) : null}

      {assetsQuery.data && filtered.length === 0 ? (
        <EmptyState
          title={assetsQuery.data.length === 0 ? "No assets yet" : "No matching assets"}
          message={assetsQuery.data.length === 0 ? "Add a bag, laptop, or document to start tracking it." : "Try a different search or filter."}
          actionLabel={assetsQuery.data.length === 0 ? "Add an asset" : undefined}
          onAction={assetsQuery.data.length === 0 ? () => setModalOpen(true) : undefined}
        />
      ) : null}

      {filtered.length > 0 ? (
        <Card>
          {filtered.map((asset, i) => (
            <ListRow
              key={asset.id}
              icon={asset.category === "laptop" ? "monitor" : asset.category === "bag" ? "briefcase" : "file-text"}
              title={asset.name}
              subtitle={asset.category}
              onPress={() => router.push(`/(app)/assets/${asset.id}`)}
              isLast={i === filtered.length - 1}
              right={<Badge label={asset.is_armed ? "Armed" : "Off"} tone={asset.is_armed ? "safe" : "muted"} />}
            />
          ))}
        </Card>
      ) : null}

      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-surface dark:bg-[#15161C] rounded-t-3xl p-5 border-t border-border">
            <Text className="text-foreground dark:text-white text-lg font-bold mb-4">New Asset</Text>
            <TextInput
              className="bg-surface-alt dark:bg-[#1B1D24] text-foreground dark:text-white rounded-xl px-4 py-3 border border-border dark:border-[#26282F] mb-3"
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
