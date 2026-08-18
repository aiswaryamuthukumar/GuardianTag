import { useEffect, useRef } from "react";
import { Animated, View, Text } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { useApi } from "@/hooks/useApi";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Card } from "@/components/ui/Card";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/StateViews";
import { colors, guardianLevels, type GuardianLevelLabel } from "@/constants/theme";
import type { GuardianLevel, SecurityScore, XPTransaction } from "@/types/api";

const levelLabels: Record<GuardianLevel, GuardianLevelLabel> = {
  rookie: "Rookie",
  watchman: "Watchman",
  guardian: "Guardian",
  sentinel: "Sentinel",
  hostel_protector: "Hostel Protector",
};

function LevelBar({ index, filled }: { index: number; filled: boolean }) {
  const width = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(width, {
      toValue: filled ? 1 : 0,
      duration: 400,
      delay: index * 60,
      useNativeDriver: false,
    }).start();
  }, [filled, index, width]);

  return (
    <View className="flex-1 h-1.5 rounded-full bg-surface-alt dark:bg-[#1B1D24] overflow-hidden">
      <Animated.View
        className="h-full bg-primary rounded-full"
        style={{ width: width.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }}
      />
    </View>
  );
}

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
        <Card className="mb-6 items-center py-6">
          <Text className="text-[36px] font-bold text-primary-light">{scoreQuery.data.score}</Text>
          <Text className="text-muted dark:text-[#8A8D98] text-[12px] mt-0.5 tracking-wide">XP EARNED</Text>
          <Text className="text-foreground dark:text-white font-semibold mt-3 text-[16px]">{levelLabels[scoreQuery.data.level]}</Text>
          <View className="flex-row items-center mt-1">
            <Feather name="trending-up" size={13} color={colors.mutedLight} style={{ marginRight: 4 }} />
            <Text className="text-muted dark:text-[#8A8D98] text-[13px]">{scoreQuery.data.streak_days} day streak</Text>
          </View>

          <View className="flex-row mt-5 w-full gap-1">
            {guardianLevels.map((level, index) => (
              <LevelBar key={level} index={index} filled={index <= levelIndex} />
            ))}
          </View>
        </Card>
      ) : null}

      <Text className="text-foreground dark:text-white font-semibold text-[17px] mb-2">Recent XP</Text>
      {xpQuery.data && xpQuery.data.length === 0 ? (
        <EmptyState title="No XP yet" message="Arm your assets to start earning." />
      ) : null}
      {xpQuery.data && xpQuery.data.length > 0 ? (
        <Card>
          {xpQuery.data.map((tx, i) => (
            <View
              key={tx.id}
              className={`flex-row items-center justify-between py-3 ${i === xpQuery.data.length - 1 ? "" : "border-b border-hairline"}`}
            >
              <View className="flex-1 mr-2">
                <Text className="text-foreground dark:text-white text-[15px]">{tx.reason}</Text>
                <Text className="text-muted dark:text-[#8A8D98] text-[13px] mt-0.5">{new Date(tx.created_at).toLocaleDateString()}</Text>
              </View>
              <Text className={tx.amount >= 0 ? "text-safe-light font-semibold" : "text-emergency-light font-semibold"}>
                {tx.amount >= 0 ? "+" : ""}
                {tx.amount}
              </Text>
            </View>
          ))}
        </Card>
      ) : null}
    </ScreenContainer>
  );
}
