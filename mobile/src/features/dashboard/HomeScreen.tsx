import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Button } from "@/src/components/ui/Button";
import { Card, PressableCard } from "@/src/components/ui/Card";
import { LiveIndicator, SectionTitle } from "@/src/components/ui/Display";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { StatTile } from "@/src/components/ui/StatTile";
import { EmptyState } from "@/src/components/ui/StateViews";
import { EventRow } from "@/src/features/activity/EventRow";
import { useEvents } from "@/src/features/activity/api";
import { useSummary } from "@/src/features/analytics/api";
import { useArmAll, useAssets } from "@/src/features/assets/api";
import { DeviceCard } from "@/src/features/devices/components/DeviceCard";
import { useDevices } from "@/src/features/devices/api";
import { IncidentCard } from "@/src/features/incidents/components/IncidentCard";
import { useIncidents } from "@/src/features/incidents/api";
import { useMe } from "@/src/features/profile/api";
import { useLevel } from "@/src/features/rewards/api";
import { levelLabels } from "@/src/lib/format";

function greeting(): string {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

/** Live Dashboard: overall protection state, what's happening now, and shortcuts into every module. */
export default function HomeScreen() {
  const me = useMe();
  const devices = useDevices();
  const assets = useAssets();
  const summary = useSummary();
  const level = useLevel();
  const active = useIncidents({ active: true });
  const events = useEvents({ limit: 5 });
  const armAll = useArmAll();

  const assetList = assets.data ?? [];
  const armed = assetList.filter((a) => a.is_armed).length;
  const allArmed = assetList.length > 0 && armed === assetList.length;
  const openIncidents = active.data ?? [];
  const deviceNames = Object.fromEntries((devices.data ?? []).map((d) => [d.id, d.name]));
  const online = (devices.data ?? []).filter((d) => d.status === "online").length;

  const refreshing = devices.isRefetching || assets.isRefetching || summary.isRefetching;
  const onRefresh = () => {
    devices.refetch();
    assets.refetch();
    summary.refetch();
    level.refetch();
    active.refetch();
    events.refetch();
  };

  const state = openIncidents.length ? "alert" : armed ? "armed" : "idle";
  const hero = {
    alert: { bg: "bg-emergency/15 border-emergency/50", icon: "🚨", title: "Alert active", body: `${openIncidents.length} incident${openIncidents.length > 1 ? "s" : ""} need your attention` },
    armed: { bg: "bg-safe/10 border-safe/40", icon: "🛡️", title: "Protected", body: `${armed} of ${assetList.length} belongings armed` },
    idle: { bg: "bg-surface border-border", icon: "💤", title: "Guardian Mode off", body: assetList.length ? "Nothing is armed right now" : "Add a belonging to start guarding it" },
  }[state];

  return (
    <ScreenContainer onRefresh={onRefresh} refreshing={refreshing}>
      <View className="flex-row items-center justify-between pt-4 pb-2">
        <View className="flex-1">
          <Text className="text-muted">{greeting()},</Text>
          <Text className="text-2xl font-bold text-white">{me.data?.full_name?.split(" ")[0] ?? "Guardian"}</Text>
        </View>
        <LiveIndicator />
      </View>

      <Card className={`mt-3 ${hero.bg}`}>
        <View className="flex-row items-center">
          <Text className="text-4xl mr-3">{hero.icon}</Text>
          <View className="flex-1">
            <Text className="text-white text-lg font-bold">{hero.title}</Text>
            <Text className="text-muted">{hero.body}</Text>
          </View>
        </View>
        {assetList.length ? (
          <View className="mt-4">
            <Button
              label={allArmed ? "Disarm everything" : "Arm everything"}
              variant={allArmed ? "secondary" : "safe"}
              loading={armAll.isPending}
              onPress={() => armAll.mutate(!allArmed)}
            />
          </View>
        ) : (
          <View className="mt-4">
            <Button label="Add a belonging" onPress={() => router.push("/assets/new")} />
          </View>
        )}
      </Card>

      <View className="flex-row gap-3 mt-3">
        <StatTile label="Open incidents" value={summary.data?.open_incidents ?? "—"} accent={summary.data?.open_incidents ? "text-emergency" : "text-white"} />
        <StatTile label="Devices online" value={devices.data ? `${online}/${devices.data.length}` : "—"} accent="text-safe" />
        <Pressable className="flex-1" onPress={() => router.push("/rewards")} accessibilityRole="button">
          <StatTile label={level.data ? levelLabels[level.data.level] : "Level"} value={level.data?.score ?? "—"} accent="text-primary-light" />
        </Pressable>
      </View>

      {openIncidents.length ? (
        <>
          <SectionTitle title="Needs attention" action="All incidents" onAction={() => router.push("/incidents")} />
          {openIncidents.slice(0, 3).map((incident) => (
            <IncidentCard key={incident.id} incident={incident} subtitle={deviceNames[incident.device_id]} />
          ))}
        </>
      ) : null}

      <SectionTitle title="Live activity" action="Open feed" onAction={() => router.push("/activity")} />
      <Card>
        {events.data?.length ? (
          events.data.slice(0, 5).map((event) => <EventRow key={event.id} event={event} deviceName={deviceNames[event.device_id]} />)
        ) : (
          <Text className="text-muted text-center py-4">No sensor activity yet. Events appear here the instant they happen.</Text>
        )}
      </Card>

      <SectionTitle title="My devices" action="Manage" onAction={() => router.push("/devices")} />
      {devices.data?.length ? (
        devices.data.map((device) => (
          <DeviceCard
            key={device.id}
            device={device}
            armedCount={assetList.filter((a) => a.device_id === device.id && a.is_armed).length}
          />
        ))
      ) : (
        <EmptyState title="No GuardianTag paired" message="Pair your ESP32 unit to start receiving alerts." actionLabel="Pair device" onAction={() => router.push("/devices/pair")} />
      )}

      <SectionTitle title="Explore" />
      <View className="flex-row flex-wrap gap-3">
        {[
          { icon: "📈", label: "Analytics", href: "/analytics" },
          { icon: "🏆", label: "Rewards", href: "/rewards" },
          { icon: "⏰", label: "Schedules", href: "/guardian" },
          { icon: "📡", label: "Activity", href: "/activity" },
        ].map((item) => (
          <PressableCard key={item.label} onPress={() => router.push(item.href as never)} className="w-[47%] items-center py-5">
            <Text className="text-2xl mb-1">{item.icon}</Text>
            <Text className="text-white font-medium">{item.label}</Text>
          </PressableCard>
        ))}
      </View>
    </ScreenContainer>
  );
}
