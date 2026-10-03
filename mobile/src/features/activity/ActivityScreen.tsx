import { useState } from "react";
import { Text, View } from "react-native";
import { Card } from "@/src/components/ui/Card";
import { LiveIndicator } from "@/src/components/ui/Display";
import { Segmented } from "@/src/components/ui/Form";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { ScreenHeader } from "@/src/components/ui/ScreenHeader";
import { EmptyState, ErrorState, LoadingState } from "@/src/components/ui/StateViews";
import { EventRow } from "@/src/features/activity/EventRow";
import { useEvents } from "@/src/features/activity/api";
import { useDevices } from "@/src/features/devices/api";
import type { SensorEventType } from "@/src/types/api";

const TYPES: { value: SensorEventType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "dual_verified", label: "Triggers" },
  { value: "movement", label: "Movement" },
  { value: "hall_trigger", label: "Opened" },
  { value: "disarmed", label: "Disarmed" },
];

/** Live sensor feed: every raw event from the ESP32, streaming in over the socket. */
export default function ActivityScreen() {
  const devices = useDevices();
  const [type, setType] = useState<SensorEventType | "all">("all");
  const [device, setDevice] = useState<string>("all");
  const events = useEvents({
    limit: 100,
    event_type: type === "all" ? undefined : type,
    device_id: device === "all" ? undefined : device,
  });
  const names = Object.fromEntries((devices.data ?? []).map((d) => [d.id, d.name]));
  const ignored = (events.data ?? []).filter((e) => e.payload?.ignored).length;

  return (
    <ScreenContainer onRefresh={events.refetch} refreshing={events.isRefetching}>
      <ScreenHeader title="Live activity" subtitle="Raw sensor events as they happen" showBack right={<LiveIndicator />} />
      <Segmented options={TYPES} value={type} onChange={setType} />
      {(devices.data?.length ?? 0) > 1 ? (
        <View className="mt-2">
          <Segmented
            options={[{ value: "all", label: "All devices" }, ...(devices.data ?? []).map((d) => ({ value: d.id, label: d.name }))]}
            value={device}
            onChange={setDevice}
          />
        </View>
      ) : null}

      {ignored ? (
        <Text className="text-muted text-xs mt-3">
          {ignored} trigger{ignored > 1 ? "s" : ""} ignored because Guardian Mode was off.
        </Text>
      ) : null}

      <Card className="mt-3">
        {events.isLoading ? (
          <LoadingState />
        ) : events.error ? (
          <ErrorState message={events.error.message} onRetry={events.refetch} />
        ) : events.data?.length ? (
          events.data.map((event) => <EventRow key={event.id} event={event} deviceName={names[event.device_id]} />)
        ) : (
          <EmptyState title="Quiet for now" message="Move or open a guarded belonging and watch it appear here instantly." />
        )}
      </Card>
    </ScreenContainer>
  );
}
