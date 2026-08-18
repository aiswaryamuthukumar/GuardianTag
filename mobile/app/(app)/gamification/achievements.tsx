import { useEffect, useRef } from "react";
import { Animated, View, Text } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { useApi } from "@/hooks/useApi";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Card } from "@/components/ui/Card";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/StateViews";
import { colors } from "@/constants/theme";
import type { Achievement, UserAchievement } from "@/types/api";

function ProgressBar({ progress }: { progress: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: progress, duration: 700, useNativeDriver: false }).start();
  }, [anim, progress]);

  return (
    <View className="h-2 rounded-full bg-surface-alt overflow-hidden">
      <Animated.View
        className="h-full bg-primary rounded-full"
        style={{ width: anim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }}
      />
    </View>
  );
}

function AchievementCard({
  achievement,
  unlocked,
  index,
}: {
  achievement: Achievement;
  unlocked: boolean;
  index: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, { toValue: 1, delay: index * 60, friction: 7, tension: 60, useNativeDriver: true }).start();
  }, [anim, index]);

  return (
    <Animated.View
      style={{
        width: "48%",
        opacity: anim,
        transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
      }}
    >
      <Card
        className={`items-center py-5 px-3 ${unlocked ? "" : "opacity-60"}`}
        style={
          unlocked
            ? { borderColor: "rgba(124,111,224,0.4)", shadowColor: colors.primary, shadowOpacity: 0.25, shadowRadius: 10, elevation: 3 }
            : undefined
        }
      >
        <View
          className="w-14 h-14 rounded-full items-center justify-center mb-3"
          style={{ backgroundColor: unlocked ? "rgba(124,111,224,0.16)" : colors.surfaceAlt }}
        >
          <Feather name={unlocked ? "award" : "lock"} size={24} color={unlocked ? colors.primaryLight : colors.muted} />
        </View>
        <Text
          className={`text-[14px] font-semibold text-center mb-1 ${unlocked ? "text-foreground" : "text-muted"}`}
          numberOfLines={2}
        >
          {achievement.name}
        </Text>
        <Text className="text-muted text-[12px] text-center leading-4 mb-3" numberOfLines={3}>
          {achievement.description}
        </Text>
        <View
          className="px-2.5 py-1 rounded-full"
          style={{ backgroundColor: unlocked ? "rgba(124,111,224,0.16)" : colors.surfaceAlt }}
        >
          <Text className={`text-[12px] font-semibold ${unlocked ? "text-primary-light" : "text-muted"}`}>
            +{achievement.xp_reward} XP
          </Text>
        </View>
      </Card>
    </Animated.View>
  );
}

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
  const total = catalogQuery.data?.length ?? 0;

  return (
    <ScreenContainer onRefresh={() => catalogQuery.refetch()} refreshing={catalogQuery.isRefetching}>
      <ScreenHeader title="Achievements" showBack subtitle={`${unlockedIds.size} of ${total} unlocked`} />

      {total > 0 ? (
        <View className="mb-5">
          <ProgressBar progress={total > 0 ? unlockedIds.size / total : 0} />
        </View>
      ) : null}

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={(error as Error).message} onRetry={() => catalogQuery.refetch()} /> : null}

      {catalogQuery.data && catalogQuery.data.length === 0 ? (
        <EmptyState title="No achievements yet" message="Check back soon." />
      ) : null}

      {catalogQuery.data && catalogQuery.data.length > 0 ? (
        <View className="flex-row flex-wrap justify-between gap-y-3">
          {catalogQuery.data.map((achievement, i) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              unlocked={unlockedIds.has(achievement.id)}
              index={i}
            />
          ))}
        </View>
      ) : null}
    </ScreenContainer>
  );
}
