import { Text, View } from "react-native";
import type { Feather } from "@expo/vector-icons";
import { IconAvatar } from "@/src/components/ui/IconAvatar";
import { eventLabels, formatClock } from "@/src/lib/format";
import type { SensorEvent, SensorEventType } from "@/src/types/api";

const eventIcons: Record<SensorEventType, keyof typeof Feather.glyphMap> = {
  movement: "move",
  hall_trigger: "unlock",
  dual_verified: "alert-triangle",
  disarmed: "shield-off",
  heartbeat: "activity",
};

/** One line of the live sensor feed. */
export function EventRow({ event, deviceName, isLast = false }: { event: SensorEvent; deviceName?: string; isLast?: boolean }) {
  const ignored = event.payload?.ignored === "disarmed";
  const alarm = event.event_type === "dual_verified" && !ignored;
  const tone = alarm ? "emergency" : event.event_type === "disarmed" ? "safe" : "muted";
  return (
    <View className={`flex-row items-center py-3 ${isLast ? "" : "border-b border-hairline"}`}>
      <IconAvatar icon={eventIcons[event.event_type]} tone={tone} size={36} />
      <View className="flex-1 ml-3">
        <Text className={`text-[14px] font-medium ${alarm ? "text-emergency-light" : "text-foreground"}`}>
          {eventLabels[event.event_type]}
        </Text>
        <Text className="text-muted text-[12px] mt-0.5">
          {deviceName ?? "Device"}
          {ignored ? " · ignored, Guardian Mode off" : ""}
          {event.payload?.clock_skew_seconds ? " · device clock corrected" : ""}
        </Text>
      </View>
      <Text className="text-muted text-[12px]">{formatClock(event.received_at)}</Text>
    </View>
  );
}
