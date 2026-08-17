import { View, Text } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/hooks/useApi";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Card } from "@/components/ui/Card";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/StateViews";
import type { Device, DeviceStatus, User } from "@/types/api";

const statusTone: Record<DeviceStatus, BadgeTone> = {
  online: "safe",
  offline: "muted",
  degraded: "warning",
  unpaired: "muted",
};

export default function HostelMap() {
  const api = useApi();

  const meQuery = useQuery({ queryKey: ["me"], queryFn: () => api.get<User>("/auth/me") });
  const devicesQuery = useQuery({ queryKey: ["devices"], queryFn: () => api.get<Device[]>("/devices") });

  return (
    <ScreenContainer onRefresh={() => devicesQuery.refetch()} refreshing={devicesQuery.isRefetching}>
      <ScreenHeader title="Hostel Map" showBack subtitle="Where your guardians are stationed" />

      {(meQuery.isLoading || devicesQuery.isLoading) ? <LoadingState /> : null}
      {(meQuery.error || devicesQuery.error) ? (
        <ErrorState onRetry={() => devicesQuery.refetch()} />
      ) : null}

      {meQuery.data ? (
        <Card className="mb-4">
          <Text className="text-foreground dark:text-white font-semibold">Your room</Text>
          <Text className="text-muted dark:text-[#8A8D98] mt-1">{meQuery.data.room_number ?? "Not set — add it in Profile"}</Text>
        </Card>
      ) : null}

      <Text className="text-foreground dark:text-white font-semibold text-lg mb-2">Devices by location</Text>
      {devicesQuery.data && devicesQuery.data.length === 0 ? (
        <EmptyState title="No devices placed yet" message="Pair a device to see it here." />
      ) : null}
      {devicesQuery.data?.map((device) => (
        <Card key={device.id} className="mb-2 flex-row items-center justify-between">
          <View>
            <Text className="text-foreground dark:text-white font-medium">{device.name}</Text>
            <Text className="text-muted dark:text-[#8A8D98] text-xs mt-0.5">{meQuery.data?.room_number ?? "Unknown room"}</Text>
          </View>
          <Badge label={device.status} tone={statusTone[device.status]} />
        </Card>
      ))}

      <Text className="text-muted dark:text-[#8A8D98] text-center mt-6">
        A full interactive floor plan is on the roadmap — for now, devices are grouped by the room
        on your profile.
      </Text>
    </ScreenContainer>
  );
}
