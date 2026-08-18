import { useEffect, useRef } from "react";
import { Animated, View, Text } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/hooks/useApi";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Card } from "@/components/ui/Card";
import { ListRow } from "@/components/ui/ListRow";
import { PulseOnChange } from "@/components/ui/PulseOnChange";
import { LoadingState } from "@/components/ui/StateViews";
import { SecurityHeatmap } from "@/components/charts/SecurityHeatmap";
import { guardianLevels, type GuardianLevelLabel } from "@/constants/theme";
import type { GuardianLevel, HeatmapDay, SecurityScore } from "@/types/api";

const levelLabels: Record<GuardianLevel, GuardianLevelLabel> = {
  rookie_guardian: "Rookie Guardian",
  alert_guardian: "Alert Guardian",
  protector: "Protector",
  guardian_pro: "Guardian Pro",
};

function ProgressSegment({ index, filled }: { index: number; filled: boolean }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: filled ? 1 : 0, duration: 400, delay: index * 60, useNativeDriver: false }).start();
  }, [filled, index, anim]);
  return (
    <View className="flex-1 h-1.5 rounded-full bg-surface-alt overflow-hidden">
      <Animated.View
        className="h-full bg-primary rounded-full"
        style={{ width: anim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }}
      />
    </View>
  );
}

const rows = [
  { key: "xp", title: "Guardian XP", subtitle: "Points earned & streak", icon: "zap" as const, href: "/(app)/gamification/xp" as const },
  { key: "achievements", title: "Achievements", subtitle: "Unlocked badges", icon: "award" as const, href: "/(app)/gamification/achievements" as const },
  { key: "challenges", title: "Challenges", subtitle: "Active security habits", icon: "target" as const, href: "/(app)/gamification/challenges" as const },
  { key: "academy", title: "Guardian Academy", subtitle: "Learn to stay safer", icon: "book-open" as const, href: "/(app)/gamification/academy" as const },
];

export default function RewardsHub() {
  const api = useApi();
  const scoreQuery = useQuery({
    queryKey: ["security-score"],
    queryFn: () => api.get<SecurityScore>("/gamification/security-score"),
  });
  const heatmapQuery = useQuery({
    queryKey: ["security-heatmap"],
    queryFn: () => api.get<HeatmapDay[]>("/analytics/security-heatmap?days=28"),
  });

  const levelIndex = scoreQuery.data ? guardianLevels.indexOf(levelLabels[scoreQuery.data.level]) : -1;

  return (
    <ScreenContainer>
      <ScreenHeader title="Rewards" subtitle="Your XP and badges" />

      {scoreQuery.isLoading ? <LoadingState /> : null}

      {scoreQuery.data ? (
        <Card className="mb-6">
          <View className="flex-row items-end justify-between mb-3">
            <View>
              <Text className="text-foreground dark:text-white font-semibold text-[18px]">{levelLabels[scoreQuery.data.level]}</Text>
              <PulseOnChange value={`${scoreQuery.data.score}-${scoreQuery.data.streak_days}`}>
                <Text className="text-muted dark:text-[#8A8D98] text-[13px] mt-0.5">{scoreQuery.data.score} XP · {scoreQuery.data.streak_days} day streak</Text>
              </PulseOnChange>
            </View>
            <Text className="text-primary-light text-[13px]">
              {levelIndex + 1}/{guardianLevels.length}
            </Text>
          </View>
          <View className="flex-row w-full gap-1">
            {guardianLevels.map((level, index) => (
              <ProgressSegment key={level} index={index} filled={index <= levelIndex} />
            ))}
          </View>
        </Card>
      ) : null}

      {heatmapQuery.data && heatmapQuery.data.length > 0 ? (
        <Card className="mb-6">
          <Text className="text-foreground font-semibold mb-3">Security activity, last 28 days</Text>
          <SecurityHeatmap days={heatmapQuery.data} />
        </Card>
      ) : null}

      <Card>
        {rows.map((row, i) => (
          <ListRow
            key={row.key}
            icon={row.icon}
            title={row.title}
            subtitle={row.subtitle}
            onPress={() => router.push(row.href)}
            showChevron
            isLast={i === rows.length - 1}
          />
        ))}
      </Card>
    </ScreenContainer>
  );
}
