import { View, Text } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/hooks/useApi";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/StateViews";
import type { Achievement, UserAchievement } from "@/types/api";

export default function Achievements() {
  const api = useApi();

  const catalogQuery = useQuery({
    queryKey: ["achievements"],
    queryFn: () => api.get<Achievement[]>("/gamification/achievements"),
  });
  const unlockedQuery = useQuery({
    queryKey: ["achievements", "unlocked"],
    queryFn: () => api.get<UserAchievement[]>("/gamification/achievements/unlocked"),
  });

  const loading = catalogQuery.isLoading || unlockedQuery.isLoading;
  const error = catalogQuery.error || unlockedQuery.error;
  const unlockedIds = new Set((unlockedQuery.data ?? []).map((ua) => ua.achievement.id));

  return (
    <ScreenContainer onRefresh={() => catalogQuery.refetch()} refreshing={catalogQuery.isRefetching}>
      <ScreenHeader title="Achievements" showBack />

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={(error as Error).message} onRetry={() => catalogQuery.refetch()} /> : null}

      {catalogQuery.data && catalogQuery.data.length === 0 ? (
        <EmptyState title="No achievements yet" message="Check back soon — new ones are on the way." />
      ) : null}

      {catalogQuery.data?.map((achievement) => {
        const unlocked = unlockedIds.has(achievement.id);
        return (
          <Card key={achievement.id} className={`mb-2 ${unlocked ? "" : "opacity-60"}`}>
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-white font-medium flex-1 mr-2">{achievement.name}</Text>
              <Badge label={unlocked ? "Unlocked" : "Locked"} tone={unlocked ? "safe" : "muted"} />
            </View>
            <Text className="text-muted">{achievement.description}</Text>
            <Text className="text-primary-light text-xs mt-1">+{achievement.xp_reward} XP</Text>
          </Card>
        );
      })}
    </ScreenContainer>
  );
}
