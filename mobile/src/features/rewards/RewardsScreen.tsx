import { useEffect, useRef, useState } from "react";
import { Animated, Text, View } from "react-native";
import { SecurityHeatmap } from "@/src/components/charts/SecurityHeatmap";
import { Card } from "@/src/components/ui/Card";
import { ProgressBar, SectionTitle } from "@/src/components/ui/Display";
import { Segmented } from "@/src/components/ui/Form";
import { IconAvatar } from "@/src/components/ui/IconAvatar";
import { PulseOnChange } from "@/src/components/ui/PulseOnChange";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { ScreenHeader } from "@/src/components/ui/ScreenHeader";
import { StatRow } from "@/src/components/ui/StatRow";
import { StatTile } from "@/src/components/ui/StatTile";
import { LoadingState } from "@/src/components/ui/StateViews";
import { useSecurityHeatmap } from "@/src/features/analytics/api";
import { useLevel, useProgress, useXpHistory } from "@/src/features/rewards/api";
import { LEVEL_ORDER, levelLabels, timeAgo } from "@/src/lib/format";
import { colors } from "@/src/theme";
import type { ProgressItem } from "@/src/types/api";

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

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center mr-4">
      <View className="w-2.5 h-2.5 rounded-sm mr-1.5" style={{ backgroundColor: color }} />
      <Text className="text-muted text-[11px]">{label}</Text>
    </View>
  );
}

function ProgressCard({ item }: { item: ProgressItem }) {
  return (
    <Card className={`mb-2 ${item.completed ? "border-safe/40" : ""}`}>
      <View className="flex-row items-start">
        <IconAvatar icon={item.completed ? "check-circle" : item.kind === "challenge" ? "target" : "award"} tone={item.completed ? "safe" : "primary"} size={40} />
        <View className="flex-1 ml-3">
          <View className="flex-row justify-between">
            <Text className="text-foreground font-semibold flex-1 pr-2">{item.title}</Text>
            <Text className="text-primary-light text-[12px] font-bold">+{item.xp_reward} XP</Text>
          </View>
          <Text className="text-muted text-[13px] mt-0.5 mb-2">{item.description}</Text>
          <ProgressBar value={item.progress} max={item.target} tone={item.completed ? "bg-safe" : "bg-primary"} />
          <Text className="text-muted text-[12px] mt-1">
            {item.completed && item.completed_at ? `Completed ${timeAgo(item.completed_at)}` : `${item.progress} / ${item.target}`}
          </Text>
        </View>
      </View>
    </Card>
  );
}

/** Security score & rewards: XP is earned only for good security habits, never for triggering alarms. */
export default function RewardsScreen() {
  const level = useLevel();
  const progress = useProgress();
  const xp = useXpHistory();
  const heatmap = useSecurityHeatmap(28);
  const [tab, setTab] = useState<"challenge" | "achievement" | "history">("challenge");

  const l = level.data;
  const levelIndex = l ? LEVEL_ORDER.indexOf(l.level) : -1;
  const items = (progress.data ?? []).filter((p) => p.kind === tab);
  const achievements = (progress.data ?? []).filter((p) => p.kind === "achievement");
  const unlocked = achievements.filter((p) => p.completed).length;

  return (
    <ScreenContainer onRefresh={() => [level, progress, xp, heatmap].forEach((q) => q.refetch())} refreshing={level.isRefetching}>
      <ScreenHeader title="Rewards" subtitle="Your XP, streak and badges" />

      {level.isLoading ? <LoadingState /> : null}
      {l ? (
        <Card className="mb-4">
          <View className="flex-row items-end justify-between mb-3">
            <View>
              <Text className="text-foreground font-semibold text-[18px]">{levelLabels[l.level]}</Text>
              <PulseOnChange value={`${l.score}-${l.streak_days}`}>
                <Text className="text-muted text-[13px] mt-0.5">
                  {l.score} XP · {l.streak_days} day streak
                </Text>
              </PulseOnChange>
            </View>
            <Text className="text-primary-light text-[13px]">
              {levelIndex + 1}/{LEVEL_ORDER.length}
            </Text>
          </View>
          <View className="flex-row w-full gap-1">
            {LEVEL_ORDER.map((lvl, index) => (
              <ProgressSegment key={lvl} index={index} filled={index <= levelIndex} />
            ))}
          </View>
          <Text className="text-muted text-[12px] mt-3">
            {l.next_level && l.next_level_at
              ? `${l.next_level_at - l.score} XP to ${levelLabels[l.next_level]}`
              : "Top level reached. Hostel Protector!"}
          </Text>
        </Card>
      ) : null}

      <StatRow className="mb-4">
        <StatTile label="Day streak" value={l ? l.streak_days : "—"} accent="text-warning-light" />
        <StatTile label="Achievements" value={`${unlocked}/${achievements.length}`} accent="text-safe-light" />
      </StatRow>

      {heatmap.data?.length ? (
        <Card className="mb-4">
          <Text className="text-foreground font-semibold mb-3">Security activity, last 28 days</Text>
          <SecurityHeatmap days={heatmap.data} />
          <View className="flex-row mt-3 flex-wrap">
            <Legend color={colors.primary} label="Checked in" />
            <Legend color={colors.warning} label="Case closed" />
            <Legend color={colors.emergency} label="Alert" />
          </View>
        </Card>
      ) : null}

      <View className="mb-3">
        <Segmented
          options={[
            { value: "challenge", label: "Challenges" },
            { value: "achievement", label: "Achievements" },
            { value: "history", label: "XP history" },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>

      {tab === "history" ? (
        <Card className="py-1">
          {xp.data?.length ? (
            xp.data.map((t, i) => (
              <View key={t.id} className={`flex-row justify-between py-3 ${i === xp.data.length - 1 ? "" : "border-b border-hairline"}`}>
                <View className="flex-1 pr-3">
                  <Text className="text-foreground">{t.reason}</Text>
                  <Text className="text-muted text-[12px]">{timeAgo(t.created_at)}</Text>
                </View>
                <Text className="text-safe-light font-bold">+{t.amount}</Text>
              </View>
            ))
          ) : (
            <Text className="text-muted py-3">Arm a belonging or do today&apos;s check-in to earn your first XP.</Text>
          )}
        </Card>
      ) : progress.isLoading ? (
        <LoadingState />
      ) : (
        items.map((item) => <ProgressCard key={item.key} item={item} />)
      )}

      <SectionTitle title="How to earn XP" />
      <Card>
        {[
          ["Daily Guardian check-in", "+10"],
          ["Arm a belonging", "+5"],
          ["Disarm on the device in time", "+5"],
          ["Resolve a case", "+15"],
          ["Close a false alarm", "+5"],
        ].map(([label, amount], i, rows) => (
          <View key={label} className={`flex-row justify-between py-2 ${i === rows.length - 1 ? "" : "border-b border-hairline"}`}>
            <Text className="text-muted text-[14px]">{label}</Text>
            <Text className="text-primary-light font-semibold">{amount} XP</Text>
          </View>
        ))}
      </Card>
    </ScreenContainer>
  );
}
