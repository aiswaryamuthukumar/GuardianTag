import { router } from "expo-router";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { LiveIndicator } from "@/src/components/ui/Display";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { ScreenHeader } from "@/src/components/ui/ScreenHeader";
import { EmptyState, ErrorState, LoadingState } from "@/src/components/ui/StateViews";
import { useAssets } from "@/src/features/assets/api";
import { DeviceRow } from "@/src/features/devices/components/DeviceCard";
import { useDevices } from "@/src/features/devices/api";

export default function DevicesScreen() {
  const devices = useDevices();
  const assets = useAssets();
  const list = devices.data ?? [];

  return (
    <ScreenContainer onRefresh={devices.refetch} refreshing={devices.isRefetching}>
      <ScreenHeader title="Devices" subtitle="Your GuardianTag sensor units" showBack right={<LiveIndicator />} />
      {devices.isLoading ? <LoadingState /> : null}
      {devices.error ? <ErrorState message={devices.error.message} onRetry={devices.refetch} /> : null}
      {devices.data && list.length === 0 ? (
        <EmptyState title="No devices yet" message="Pair the ESP32 unit using the ID printed on its serial console." />
      ) : null}
      {list.length ? (
        <Card className="py-1 mb-4">
          {list.map((device, i) => (
            <DeviceRow
              key={device.id}
              device={device}
              armedCount={(assets.data ?? []).filter((a) => a.device_id === device.id && a.is_armed).length}
              isLast={i === list.length - 1}
            />
          ))}
        </Card>
      ) : null}
      <Button label="Pair a new device" onPress={() => router.push("/devices/pair")} />
    </ScreenContainer>
  );
}
