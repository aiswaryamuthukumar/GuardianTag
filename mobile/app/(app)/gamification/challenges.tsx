import { View, Text } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/hooks/useApi";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/StateViews";
import type { Challenge } from "@/types/api";

export default function Challenges() {
  const api = useApi();
  const challengesQuery = useQuery({
    queryKey: ["challenges"],
    queryFn: () => api.get<Challenge[]>("/gamification/challenges"),
  });

  return (
    <ScreenContainer onRefresh={() => challengesQuery.refetch()} refreshing={challengesQuery.isRefetching}>
      <ScreenHeader title="Challenges" showBack subtitle="Build positive security habits" />

      {challengesQuery.isLoading ? <LoadingState /> : null}
      {challengesQuery.error ? (
        <ErrorState message={(challengesQuery.error as Error).message} onRetry={() => challengesQuery.refetch()} />
      ) : null}

      {challengesQuery.data && challengesQuery.data.length === 0 ? (
        <EmptyState title="No active challenges" message="New challenges are added periodically." />
      ) : null}

      {challengesQuery.data?.map((challenge) => (
        <Card key={challenge.id} className="mb-2">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-white font-medium flex-1 mr-2">{challenge.title}</Text>
            <Badge label={`+${challenge.xp_reward} XP`} tone="primary" />
          </View>
          <Text className="text-muted">{challenge.description}</Text>
          {challenge.end_at ? (
            <Text className="text-muted text-xs mt-1">
              Ends {new Date(challenge.end_at).toLocaleDateString()}
            </Text>
          ) : null}
        </Card>
      ))}
    </ScreenContainer>
  );
}
