import { View, Text } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/hooks/useApi";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Card } from "@/components/ui/Card";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/StateViews";
import { guardianLevels, type GuardianLevelLabel } from "@/constants/theme";
import type { GuardianLevel, SecurityScore, XPTransaction } from "@/types/api";

const levelLabels: Record<GuardianLevel, GuardianLevelLabel> = {
  rookie: "Rookie",
  watchman: "Watchman",
  guardian: "Guardian",
  sentinel: "Sentinel",
  hostel_protector: "Hostel Protector",
};

export default function GuardianXP() {
  const api = useApi();

  const scoreQuery = useQuery({
    queryKey: ["security-score"],
    queryFn: () => api.get<SecurityScore>("/gamification/security-score"),
  });
  const xpQuery = useQuery({
    queryKey: ["xp-transactions"],
    queryFn: () => api.get<XPTransaction[]>("/gamification/xp"),
  });

  const levelIndex = scoreQuery.data
    ? guardianLevels.indexOf(levelLabels[scoreQuery.data.level])
    : -1;

  return (
    <ScreenContainer onRefresh={() => xpQuery.refetch()} refreshing={xpQuery.isRefetching}>
      <ScreenHeader title="Guardian XP" showBack />

      {scoreQuery.isLoading ? <LoadingState /> : null}
      {scoreQuery.error ? <ErrorState onRetry={() => scoreQuery.refetch()} /> : null}

      {scoreQuery.data ? (
        <Card className="mb-4 items-center py-6">
          <Text className="text-3xl font-extrabold text-primary-light">{scoreQuery.data.score} XP</Text>
          <Text className="text-white font-semibold mt-1">{levelLabels[scoreQuery.data.level]}</Text>
          <Text className="text-muted mt-1">{scoreQuery.data.streak_days} day streak</Text>

          <View className="flex-row mt-4 w-full gap-1">
            {guardianLevels.map((level, index) => (
              <View
                key={level}
                className={`flex-1 h-1.5 rounded-full ${index <= levelIndex ? "bg-primary" : "bg-surface-alt"}`}
              />
            ))}
          </View>
        </Card>
      ) : null}

      <Text className="text-white font-semibold text-lg mb-2">Recent XP</Text>
      {xpQuery.data && xpQuery.data.length === 0 ? (
        <EmptyState title="No XP yet" message="Complete challenges and keep your assets guarded to earn XP." />
      ) : null}
      {xpQuery.data?.map((tx) => (
        <Card key={tx.id} className="mb-2 flex-row items-center justify-between">
          <View className="flex-1 mr-2">
            <Text className="text-white">{tx.reason}</Text>
            <Text className="text-muted text-xs mt-0.5">{new Date(tx.created_at).toLocaleString()}</Text>
          </View>
          <Text className={tx.amount >= 0 ? "text-safe font-semibold" : "text-emergency font-semibold"}>
            {tx.amount >= 0 ? "+" : ""}
            {tx.amount}
          </Text>
        </Card>
      ))}
    </ScreenContainer>
  );
}
