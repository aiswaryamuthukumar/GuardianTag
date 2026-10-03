import { useState } from "react";
import { Text, View } from "react-native";
import { Card } from "@/src/components/ui/Card";
import { ProgressBar, SectionTitle } from "@/src/components/ui/Display";
import { Segmented } from "@/src/components/ui/Form";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { ScreenHeader } from "@/src/components/ui/ScreenHeader";
import { StatTile } from "@/src/components/ui/StatTile";
import { LoadingState } from "@/src/components/ui/StateViews";
import { useLevel, useProgress, useXpHistory } from "@/src/features/rewards/api";
import { levelLabels, timeAgo } from "@/src/lib/format";
import type { ProgressItem } from "@/src/types/api";

function ProgressCard({ item }: { item: ProgressItem }) {
  return (
    <Card className={`mb-2 ${item.completed ? "border-safe/40" : ""}`}>
      <View className="flex-row items-start">
        <Text className="text-2xl mr-3">{item.completed ? "✅" : item.kind === "challenge" ? "🎯" : "🏅"}</Text>
        <View className="flex-1">
          <View className="flex-row justify-between">
            <Text className="text-white font-semibold flex-1 pr-2">{item.title}</Text>
            <Text className="text-primary-light text-xs font-bold">+{item.xp_reward} XP</Text>
          </View>
          <Text className="text-muted text-sm mt-0.5 mb-2">{item.description}</Text>
          <ProgressBar value={item.progress} max={item.target} tone={item.completed ? "bg-safe" : "bg-primary"} />
          <Text className="text-muted text-xs mt-1">
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
  const [tab, setTab] = useState<"challenge" | "achievement" | "history">("challenge");

  const l = level.data;
  const items = (progress.data ?? []).filter((p) => p.kind === tab);
  const unlocked = (progress.data ?? []).filter((p) => p.kind === "achievement" && p.completed).length;
  const achievements = (progress.data ?? []).filter((p) => p.kind === "achievement").length;

  return (
    <ScreenContainer onRefresh={() => { level.refetch(); progress.refetch(); xp.refetch(); }} refreshing={level.isRefetching}>
      <ScreenHeader title="Security score" subtitle="Rewards for consistent protection" showBack />

      <Card className="bg-primary/10 border-primary/40">
        {l ? (
          <>
            <Text className="text-primary-light font-semibold">{levelLabels[l.level]}</Text>
            <Text className="text-white text-4xl font-extrabold my-1">{l.score} XP</Text>
            <ProgressBar value={l.score - l.level_floor} max={(l.next_level_at ?? l.score) - l.level_floor || 1} />
            <Text className="text-muted text-xs mt-2">
              {l.next_level && l.next_level_at
                ? `${l.next_level_at - l.score} XP to ${levelLabels[l.next_level]}`
                : "Top level reached. Hostel Protector!"}
            </Text>
          </>
        ) : (
          <LoadingState />
        )}
      </Card>

      <View className="flex-row gap-3 mt-3">
        <StatTile label="Day streak" value={l ? `🔥 ${l.streak_days}` : "—"} accent="text-warning" />
        <StatTile label="Achievements" value={`${unlocked}/${achievements}`} accent="text-safe" />
      </View>

      <View className="mt-5 mb-3">
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
        <Card>
          {xp.data?.length ? (
            xp.data.map((t) => (
              <View key={t.id} className="flex-row justify-between py-2 border-b border-border/60">
                <View className="flex-1 pr-3">
                  <Text className="text-white">{t.reason}</Text>
                  <Text className="text-muted text-xs">{timeAgo(t.created_at)}</Text>
                </View>
                <Text className="text-safe font-bold">+{t.amount}</Text>
              </View>
            ))
          ) : (
            <Text className="text-muted">Arm a belonging or resolve an incident to earn your first XP.</Text>
          )}
        </Card>
      ) : progress.isLoading ? (
        <LoadingState />
      ) : (
        items.map((item) => <ProgressCard key={item.key} item={item} />)
      )}

      <SectionTitle title="How to earn XP" />
      <Card>
        <Text className="text-muted">• Arm a belonging: +5 XP{"\n"}• Disarm on the device in time: +5 XP{"\n"}• Resolve an incident: +15 XP{"\n"}• Keep a daily streak for bonus achievements</Text>
      </Card>
    </ScreenContainer>
  );
}
