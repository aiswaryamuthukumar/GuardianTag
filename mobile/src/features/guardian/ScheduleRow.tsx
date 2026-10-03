import { Alert, Pressable, Switch, Text, View } from "react-native";
import { router } from "expo-router";
import { colors } from "@/src/theme";
import { daysFromMask, hhmm } from "@/src/lib/format";
import { useDeleteSchedule, useToggleSchedule } from "@/src/features/guardian/api";
import type { ArmSchedule } from "@/src/types/api";

export function ScheduleRow({ schedule, assetName }: { schedule: ArmSchedule; assetName?: string }) {
  const toggle = useToggleSchedule();
  const remove = useDeleteSchedule();
  const overnight = schedule.end_time < schedule.start_time;

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/schedules/new", params: { id: schedule.id, assetId: schedule.asset_id } })}
      onLongPress={() =>
        Alert.alert("Delete schedule?", undefined, [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: () => remove.mutate(schedule.id) },
        ])
      }
      className="bg-surface border border-border rounded-2xl p-4 mb-2 flex-row items-center"
    >
      <View className="flex-1">
        <Text className="text-white font-semibold text-lg">
          {hhmm(schedule.start_time)} – {hhmm(schedule.end_time)}
          {overnight ? <Text className="text-muted text-xs"> (overnight)</Text> : null}
        </Text>
        <Text className="text-muted text-xs mt-0.5">
          {assetName ? `${assetName} · ` : ""}
          {daysFromMask(schedule.days_mask)}
        </Text>
      </View>
      <Switch
        value={schedule.enabled}
        onValueChange={(enabled) => toggle.mutate({ id: schedule.id, enabled })}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#fff"
        accessibilityLabel="Schedule enabled"
      />
    </Pressable>
  );
}
