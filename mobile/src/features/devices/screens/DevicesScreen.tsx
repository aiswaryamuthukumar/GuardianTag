import { router } from "expo-router";
import { Button } from "@/src/components/ui/Button";
import { LiveIndicator } from "@/src/components/ui/Display";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { ScreenHeader } from "@/src/components/ui/ScreenHeader";
import { EmptyState, ErrorState, LoadingState } from "@/src/components/ui/StateViews";
import { useAssets } from "@/src/features/assets/api";
import { DeviceCard } from "@/src/features/devices/components/DeviceCard";
import { useDevices } from "@/src/features/devices/api";

export default function DevicesScreen() {
  const devices = useDevices();
  const assets = useAssets();

  return (
    <ScreenContainer onRefresh={devices.refetch} refreshing={devices.isRefetching}>
      <ScreenHeader title="Devices" subtitle="Your GuardianTag sensor units" showBack right={<LiveIndicator />} />
      {devices.isLoading ? (
        <LoadingState />
      ) : devices.error ? (
        <ErrorState message={devices.error.message} onRetry={devices.refetch} />
      ) : devices.data?.length ? (
        devices.data.map((device) => (
          <DeviceCard
            key={device.id}
            device={device}
            armedCount={(assets.data ?? []).filter((a) => a.device_id === device.id && a.is_armed).length}
          />
        ))
      ) : (
        <EmptyState title="No devices yet" message="Pair the ESP32 unit using the UID printed on its serial console." />
      )}
      <Button label="Pair a new device" onPress={() => router.push("/devices/pair")} className="mt-3" />
    </ScreenContainer>
  );
}
