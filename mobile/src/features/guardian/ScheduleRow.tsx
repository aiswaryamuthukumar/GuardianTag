import { useState } from "react";
import { Pressable, Switch, Text, View } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { ConfirmSheet } from "@/src/components/ui/ConfirmSheet";
import { useDeleteSchedule, useToggleSchedule } from "@/src/features/guardian/api";
import { daysFromMask, hhmm } from "@/src/lib/format";
import { colors } from "@/src/theme";
import type { ArmSchedule } from "@/src/types/api";

export function ScheduleRow({ schedule, assetName }: { schedule: ArmSchedule; assetName?: string }) {
  const toggle = useToggleSchedule();
  const remove = useDeleteSchedule();
  const [confirm, setConfirm] = useState(false);
  const overnight = schedule.end_time < schedule.start_time;

  return (
    <>
      <Pressable
        onPress={() => router.push({ pathname: "/schedules/new", params: { id: schedule.id, assetId: schedule.asset_id } })}
        onLongPress={() => setConfirm(true)}
        accessibilityRole="button"
        accessibilityHint="Long-press to delete"
        className="bg-surface border border-border rounded-2xl p-4 mb-2 flex-row items-center"
      >
        <View className="w-9 h-9 rounded-full bg-surface-alt items-center justify-center mr-3">
          <Feather name="clock" size={17} color={schedule.enabled ? colors.primary : colors.muted} />
        </View>
        <View className="flex-1">
          <Text className="text-foreground font-semibold text-[16px]">
            {hhmm(schedule.start_time)} – {hhmm(schedule.end_time)}
            {overnight ? <Text className="text-muted text-[12px] font-normal"> overnight</Text> : null}
          </Text>
          <Text className="text-muted text-[13px] mt-0.5">
            {assetName ? `${assetName} · ` : ""}
            {daysFromMask(schedule.days_mask)}
          </Text>
        </View>
        <Switch
          value={schedule.enabled}
          onValueChange={(enabled) => toggle.mutate({ id: schedule.id, enabled })}
          trackColor={{ false: colors.surfaceAlt, true: colors.primary }}
          thumbColor="#FFFFFF"
          accessibilityLabel="Schedule enabled"
        />
      </Pressable>
      <ConfirmSheet
        visible={confirm}
        title="Delete this schedule?"
        message="The belonging keeps its current armed state."
        confirmLabel="Delete"
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          remove.mutate(schedule.id);
        }}
      />
    </>
  );
}
