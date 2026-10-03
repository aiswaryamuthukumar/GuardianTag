import { Text, View } from "react-native";
import { eventLabels, formatClock } from "@/src/lib/format";
import type { SensorEvent, SensorEventType } from "@/src/types/api";

const eventIcons: Record<SensorEventType, string> = {
  movement: "〰️",
  hall_trigger: "🧲",
  dual_verified: "🚨",
  disarmed: "✅",
  heartbeat: "💓",
};

/** One line of the live sensor feed. */
export function EventRow({ event, deviceName }: { event: SensorEvent; deviceName?: string }) {
  const ignored = event.payload?.ignored === "disarmed";
  const alarm = event.event_type === "dual_verified" && !ignored;
  return (
    <View className="flex-row items-center py-2.5 border-b border-border/60">
      <View
        className={`w-9 h-9 rounded-full items-center justify-center mr-3 ${alarm ? "bg-emergency/20" : "bg-surface-alt"}`}
      >
        <Text>{eventIcons[event.event_type]}</Text>
      </View>
      <View className="flex-1">
        <Text className={`font-medium ${alarm ? "text-emergency" : "text-white"}`}>
          {eventLabels[event.event_type]}
        </Text>
        <Text className="text-muted text-xs">
          {deviceName ?? "Device"}
          {ignored ? " · ignored, Guardian Mode off" : ""}
          {event.payload?.clock_skew_seconds ? " · device clock corrected" : ""}
        </Text>
      </View>
      <Text className="text-muted text-xs">{formatClock(event.received_at)}</Text>
    </View>
  );
}
