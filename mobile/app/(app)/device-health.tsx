import { View, Text } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/hooks/useApi";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Card, PressableCard } from "@/components/ui/Card";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/StateViews";
import { PulseDot } from "@/components/charts/DeviceHealthBars";
import { colors } from "@/constants/theme";
import type { Device, DeviceStatus } from "@/types/api";

const statusTone: Record<DeviceStatus, BadgeTone> = {
  online: "safe",
  offline: "muted",
  degraded: "warning",
  unpaired: "muted",
};

const statusColor: Record<DeviceStatus, string> = {
  online: colors.safe,
  degraded: colors.warning,
  offline: colors.muted,
  unpaired: colors.muted,
};

export default function DeviceHealth() {
  const api = useApi();
  const devicesQuery = useQuery({
    queryKey: ["devices"],
    queryFn: () => api.get<Device[]>("/devices"),
  });

  return (
    <ScreenContainer onRefresh={() => devicesQuery.refetch()} refreshing={devicesQuery.isRefetching}>
      <ScreenHeader title="Device Health" showBack subtitle="Your device status" />

      {devicesQuery.isLoading ? <LoadingState /> : null}
      {devicesQuery.error ? (
        <ErrorState message={(devicesQuery.error as Error).message} onRetry={() => devicesQuery.refetch()} />
      ) : null}

      {devicesQuery.data && devicesQuery.data.length === 0 ? (
        <EmptyState
          title="No devices paired"
          actionLabel="Pair a device"
          onAction={() => router.push("/(app)/device-pairing")}
        />
      ) : null}

      {devicesQuery.data?.map((device) => (
        <Card key={device.id} className={`mb-2 ${device.status === "offline" ? "opacity-50" : ""}`}>
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <PulseDot color={statusColor[device.status]} live={device.status === "online"} />
              <Text className="text-foreground dark:text-white font-medium ml-2">{device.name}</Text>
            </View>
            <Badge label={device.status === "offline" ? "Connection Lost" : device.status} tone={statusTone[device.status]} />
          </View>
          <Text className="text-muted dark:text-[#8A8D98] text-xs">Device ID: {device.device_uid}</Text>
          <Text className="text-muted dark:text-[#8A8D98] text-xs mt-1">
            Firmware: {device.firmware_version ?? "unknown"}
          </Text>
          <Text className="text-muted dark:text-[#8A8D98] text-xs mt-1">
            Battery: {device.battery_percent ?? "—"}% · Signal: {device.signal_strength ?? "—"}%
          </Text>
          <Text className="text-muted dark:text-[#8A8D98] text-xs mt-1">
            Last seen:{" "}
            {device.last_seen_at ? new Date(device.last_seen_at).toLocaleString() : "never"}
          </Text>
        </Card>
      ))}

      <View className="mt-2">
        <PressableCard onPress={() => router.push("/(app)/device-pairing")}>
          <Text className="text-primary-light font-medium">+ Pair another device</Text>
        </PressableCard>
      </View>
    </ScreenContainer>
  );
}
