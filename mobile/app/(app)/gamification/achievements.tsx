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

function AchievementRow({
  achievement,
  unlocked,
  isLast,
  index,
}: {
  achievement: Achievement;
  unlocked: boolean;
  isLast: boolean;
  index: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      delay: index * 70,
      friction: 7,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, [anim, index]);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }],
      }}
      className={`flex-row items-center py-3.5 ${isLast ? "" : "border-b border-hairline dark:border-[#2C2E36]"}`}
    >
      <View
        className="w-10 h-10 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: unlocked ? "rgba(124,111,224,0.14)" : colors.surfaceAlt }}
      >
        <Feather name={unlocked ? "award" : "lock"} size={17} color={unlocked ? colors.primaryLight : colors.muted} />
      </View>
      <View className="flex-1 mr-2">
        <Text className={`text-[15px] font-medium ${unlocked ? "text-foreground dark:text-white" : "text-muted dark:text-[#8A8D98]"}`}>
          {achievement.name}
        </Text>
        <Text className="text-muted dark:text-[#8A8D98] text-[13px] mt-0.5">{achievement.description}</Text>
      </View>
      <Text className={`text-[13px] font-medium ${unlocked ? "text-primary-light" : "text-muted dark:text-[#8A8D98]"}`}>
        +{achievement.xp_reward}
      </Text>
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

  return (
    <ScreenContainer onRefresh={() => catalogQuery.refetch()} refreshing={catalogQuery.isRefetching}>
      <ScreenHeader
        title="Achievements"
        showBack
        subtitle={`${unlockedIds.size} of ${catalogQuery.data?.length ?? 0} unlocked`}
      />

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={(error as Error).message} onRetry={() => catalogQuery.refetch()} /> : null}

      {catalogQuery.data && catalogQuery.data.length === 0 ? (
        <EmptyState title="No achievements yet" message="Check back soon — new ones are on the way." />
      ) : null}

      {catalogQuery.data && catalogQuery.data.length > 0 ? (
        <Card>
          {catalogQuery.data.map((achievement, i) => (
            <AchievementRow
              key={achievement.id}
              achievement={achievement}
              unlocked={unlockedIds.has(achievement.id)}
              isLast={i === catalogQuery.data.length - 1}
              index={i}
            />
          ))}
        </Card>
      ) : null}
    </ScreenContainer>
  );
}
