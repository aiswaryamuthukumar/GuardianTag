import { useState } from "react";
import { Alert, Text, View } from "react-native";
import { router } from "expo-router";
import { LineChart } from "@/src/components/charts/LineChart";
import { Button } from "@/src/components/ui/Button";
import { Card, PressableCard } from "@/src/components/ui/Card";
import { KeyValue, LiveIndicator, SectionTitle, StatusDot, useNow } from "@/src/components/ui/Display";
import { TextField } from "@/src/components/ui/Form";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { ScreenHeader } from "@/src/components/ui/ScreenHeader";
import { StatTile } from "@/src/components/ui/StatTile";
import { ErrorState, LoadingState } from "@/src/components/ui/StateViews";
import { EventRow } from "@/src/features/activity/EventRow";
import { useEvents } from "@/src/features/activity/api";
import { useAssets } from "@/src/features/assets/api";
import { deviceStatusLabel, deviceTone } from "@/src/features/devices/components/DeviceCard";
import { useDevice, useDeviceHealth, useRenameDevice, useUnpairDevice } from "@/src/features/devices/api";
import { categoryIcons, formatUptime, signalLabel, timeAgo } from "@/src/lib/format";

export default function DeviceDetailScreen({ id }: { id: string }) {
  const device = useDevice(id);
  const health = useDeviceHealth(id);
  const events = useEvents({ device_id: id, limit: 20 });
  const assets = useAssets();
  const rename = useRenameDevice(id);
  const unpair = useUnpairDevice(id);
  const now = useNow();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");

  if (device.isLoading) return <ScreenContainer><LoadingState /></ScreenContainer>;
  if (!device.data) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Device" showBack />
        <ErrorState message={device.error?.message ?? "Device not found"} onRetry={device.refetch} />
      </ScreenContainer>
    );
  }

  const d = device.data;
  const latest = health.data?.[0];
  const rssiSeries = (health.data ?? [])
    .filter((h) => h.wifi_rssi !== null)
    .map((h) => h.wifi_rssi as number)
    .reverse();
  const linked = (assets.data ?? []).filter((a) => a.device_id === id);

  const confirmUnpair = () =>
    Alert.alert("Unpair device?", `${d.name} will stop reporting to your account. Linked belongings are kept.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Unpair", style: "destructive", onPress: () => unpair.mutate(undefined, { onSuccess: () => router.back() }) },
    ]);

  return (
    <ScreenContainer onRefresh={() => { device.refetch(); health.refetch(); events.refetch(); }} refreshing={device.isRefetching}>
      <ScreenHeader title={d.name} subtitle={d.device_uid} showBack right={<LiveIndicator />} />

      <Card className="flex-row items-center mb-3">
        <StatusDot tone={deviceTone[d.status]} />
        <Text className="text-white font-semibold ml-2 flex-1">{deviceStatusLabel[d.status]}</Text>
        <Text className="text-muted text-sm">Last heartbeat {timeAgo(d.last_seen_at, now)}</Text>
      </Card>

      <View className="flex-row gap-3">
        <StatTile label="Wi-Fi signal" value={latest?.wifi_rssi != null ? `${latest.wifi_rssi} dBm` : "—"} accent="text-primary-light" />
        <StatTile label="Uptime" value={formatUptime(latest?.uptime_seconds ?? null)} />
        <StatTile label="Battery" value={latest?.battery_level != null ? `${latest.battery_level}%` : "USB"} accent="text-safe" />
      </View>

      <SectionTitle title="Signal history" />
      <Card>
        <LineChart
          values={rssiSeries}
          min={-95}
          max={-30}
          caption={`${signalLabel(latest?.wifi_rssi ?? null)} · last ${rssiSeries.length} heartbeats (every 60s)`}
        />
      </Card>

      <SectionTitle title="Guarding" action="Add belonging" onAction={() => router.push({ pathname: "/assets/new", params: { deviceId: id } })} />
      {linked.length ? (
        linked.map((asset) => (
          <PressableCard key={asset.id} onPress={() => router.push(`/assets/${asset.id}`)} className="mb-2 flex-row items-center">
            <Text className="text-xl mr-3">{categoryIcons[asset.category]}</Text>
            <Text className="text-white flex-1">{asset.name}</Text>
            <Text className={asset.is_armed ? "text-safe" : "text-muted"}>{asset.is_armed ? "Armed" : "Disarmed"}</Text>
          </PressableCard>
        ))
      ) : (
        <Card>
          <Text className="text-muted">
            No belongings linked. Triggers from this device are treated as armed by its physical button.
          </Text>
        </Card>
      )}

      <SectionTitle title="Recent sensor events" />
      <Card>
        {events.data?.length ? (
          events.data.map((event) => <EventRow key={event.id} event={event} deviceName={d.name} />)
        ) : (
          <Text className="text-muted text-center py-3">No events from this device yet.</Text>
        )}
      </Card>

      <SectionTitle title="Details" />
      <Card>
        <KeyValue label="Firmware" value={d.firmware_version ?? "Unknown"} />
        <KeyValue label="Paired" value={new Date(d.created_at).toLocaleDateString()} />
        <KeyValue label="Heartbeats stored" value={String(health.data?.length ?? 0)} />
      </Card>

      <SectionTitle title="Manage" />
      {editing ? (
        <View>
          <TextField label="New name" value={name} onChangeText={setName} autoFocus />
          <View className="flex-row gap-3">
            <Button label="Cancel" variant="secondary" onPress={() => setEditing(false)} className="flex-1" />
            <Button
              label="Save"
              className="flex-1"
              loading={rename.isPending}
              disabled={name.trim().length < 2}
              onPress={() => rename.mutate(name.trim(), { onSuccess: () => setEditing(false) })}
            />
          </View>
        </View>
      ) : (
        <View className="gap-3">
          <Button label="Rename" variant="secondary" onPress={() => { setName(d.name); setEditing(true); }} />
          <Button label="Unpair device" variant="danger" loading={unpair.isPending} onPress={confirmUnpair} />
        </View>
      )}
    </ScreenContainer>
  );
}
