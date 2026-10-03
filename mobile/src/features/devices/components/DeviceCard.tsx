import { Text, View } from "react-native";
import { router } from "expo-router";
import { PressableCard } from "@/src/components/ui/Card";
import { StatusDot, useNow } from "@/src/components/ui/Display";
import { timeAgo } from "@/src/lib/format";
import type { Device, DeviceStatus } from "@/src/types/api";

export const deviceTone: Record<DeviceStatus, "safe" | "warning" | "emergency" | "muted"> = {
  online: "safe",
  degraded: "warning",
  offline: "emergency",
  unpaired: "muted",
};

export const deviceStatusLabel: Record<DeviceStatus, string> = {
  online: "Online",
  degraded: "Degraded",
  offline: "Offline",
  unpaired: "Unpaired",
};

export function DeviceCard({ device, armedCount }: { device: Device; armedCount?: number }) {
  const now = useNow(5000);
  return (
    <PressableCard onPress={() => router.push(`/devices/${device.id}`)} className="mb-3">
      <View className="flex-row items-center">
        <View className="w-11 h-11 rounded-xl bg-surface-alt items-center justify-center mr-3">
          <Text className="text-xl">📡</Text>
        </View>
        <View className="flex-1">
          <Text className="text-white font-semibold">{device.name}</Text>
          <Text className="text-muted text-xs mt-0.5">
            Seen {timeAgo(device.last_seen_at, now)}
            {armedCount !== undefined ? ` · ${armedCount} armed` : ""}
          </Text>
        </View>
        <View className="flex-row items-center">
          <StatusDot tone={deviceTone[device.status]} />
          <Text className="text-muted text-xs ml-1.5">{deviceStatusLabel[device.status]}</Text>
        </View>
      </View>
    </PressableCard>
  );
}
