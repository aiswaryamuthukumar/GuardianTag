import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { LiveIndicator, SectionTitle, StatusDot } from "@/src/components/ui/Display";
import { ListRow } from "@/src/components/ui/ListRow";
import { Logo } from "@/src/components/ui/Logo";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { ShieldScanner } from "@/src/components/ui/ShieldScanner";
import { StatRow } from "@/src/components/ui/StatRow";
import { StatTile } from "@/src/components/ui/StatTile";
import { EmptyState, ErrorState, LoadingState } from "@/src/components/ui/StateViews";
import { EventRow } from "@/src/features/activity/EventRow";
import { useEvents } from "@/src/features/activity/api";
import { useSummary } from "@/src/features/analytics/api";
import { useArmAll, useAssets } from "@/src/features/assets/api";
import { deviceStatusLabel, deviceTone } from "@/src/features/devices/components/DeviceCard";
import { useDevices } from "@/src/features/devices/api";
import { IncidentCard } from "@/src/features/incidents/components/IncidentCard";
import { useIncidents } from "@/src/features/incidents/api";
import { AnnouncementsCard } from "@/src/features/notices/AnnouncementsCard";
import { useNotices, useUnreadCount } from "@/src/features/notifications/api";
import { useMe } from "@/src/features/profile/api";
import { useCompleteDailyCheck, useDailyCheck, useLevel } from "@/src/features/rewards/api";
import { timeAgo } from "@/src/lib/format";
import { toastBus } from "@/src/lib/toast";
import { colors, tint } from "@/src/theme";

const quickActions = [
  { key: "pair", label: "Pair device", icon: "cpu" as const, href: "/devices/pair" },
  { key: "assets", label: "Add item", icon: "briefcase" as const, href: "/belongings/new" },
  { key: "activity", label: "Live feed", icon: "activity" as const, href: "/activity" },
  { key: "analytics", label: "Analytics", icon: "bar-chart-2" as const, href: "/analytics" },
];

function HeaderButton({ icon, onPress, dot, label }: { icon: "bell"; onPress: () => void; dot?: boolean; label: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="w-10 h-10 rounded-full bg-surface border border-border items-center justify-center"
    >
      <Feather name={icon} size={18} color={colors.text} />
      {dot ? <View className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ backgroundColor: colors.emergency }} /> : null}
    </Pressable>
  );
}

/** Live Dashboard: protection state, what's happening now, and shortcuts into every module. */
export default function HomeScreen() {
  const me = useMe();
  const devices = useDevices();
  const assets = useAssets();
  const summary = useSummary();
  const level = useLevel();
  const active = useIncidents({ active: true });
  const events = useEvents({ limit: 5 });
  const unread = useUnreadCount();
  const notices = useNotices();
  const dailyCheck = useDailyCheck();
  const checkIn = useCompleteDailyCheck();
  const armAll = useArmAll();

  const assetList = assets.data ?? [];
  const armed = assetList.filter((a) => a.is_armed).length;
  const allArmed = assetList.length > 0 && armed === assetList.length;
  const openIncidents = active.data ?? [];
  const deviceNames = Object.fromEntries((devices.data ?? []).map((d) => [d.id, d.name]));
  const firstName = me.data?.full_name?.split(" ")[0] ?? "Guardian";

  const loading = devices.isLoading || summary.isLoading;
  const error = devices.error || summary.error;
  const onRefresh = () => [devices, assets, summary, level, active, events, dailyCheck, notices].forEach((q) => q.refetch());

  const state = openIncidents.length ? "alert" : armed ? "armed" : "idle";
  const statusLine = {
    alert: { color: colors.emergency, cls: "text-emergency-light", text: `${openIncidents.length} incident${openIncidents.length > 1 ? "s" : ""} need attention` },
    armed: { color: colors.safe, cls: "text-safe-light", text: `${armed} of ${assetList.length} belongings protected` },
    idle: { color: colors.warning, cls: "text-warning-light", text: assetList.length ? "Guardian Mode is off" : "Add a belonging to start guarding it" },
  }[state];

  const onCheckIn = () =>
    checkIn.mutate(undefined, {
      onSuccess: (d) => toastBus.show({ icon: "check-circle", title: `Check complete +${d.xp_reward} XP`, subtitle: `${d.streak_days}-day streak`, tone: "safe" }),
    });

  return (
    <ScreenContainer onRefresh={onRefresh} refreshing={devices.isRefetching}>
      <View className="flex-row items-center justify-between mt-2 mb-6">
        <Logo size={34} />
        <View className="flex-row items-center gap-2">
          <LiveIndicator />
          <HeaderButton icon="bell" label="Alerts" dot={!!unread.data} onPress={() => router.push("/notifications")} />
        </View>
      </View>

      <View className="mb-5">
        <Text className="text-muted text-[15px]">Welcome back</Text>
        <Text className="text-[28px] font-bold text-foreground -mt-0.5">{firstName}</Text>
        <View className="flex-row items-center mt-2">
          <View className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: statusLine.color }} />
          <Text className={`text-[13px] font-medium ${statusLine.cls}`}>{statusLine.text}</Text>
        </View>
      </View>

      {me.data?.role !== "warden" ? <AnnouncementsCard /> : null}

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error.message} onRetry={onRefresh} /> : null}

      {!loading && !error ? (
        <>
          <StatRow className="mb-5">
            <StatTile label="Security score" value={level.data?.score ?? 0} accent="text-primary-light" />
            <StatTile
              label="Open incidents"
              value={summary.data?.open_incidents ?? 0}
              accent={summary.data?.open_incidents ? "text-emergency-light" : "text-safe-light"}
            />
            <StatTile label="Armed" value={`${armed}/${assetList.length}`} accent="text-foreground" />
          </StatRow>

          <Card className={`mb-5 items-center py-5 ${state === "alert" ? "border-emergency/50" : ""}`}>
            <ShieldScanner
              active={state !== "idle"}
              tone={state === "alert" ? "emergency" : state === "armed" ? "primary" : "muted"}
              icon={state === "alert" ? "alert-triangle" : state === "armed" ? "shield" : "shield-off"}
              size={84}
              fast={state === "alert"}
            />
            <Text className="text-foreground font-semibold text-[16px] mt-1">
              {state === "alert" ? "Alert active" : state === "armed" ? "Guardian Mode is active" : "Nothing is armed"}
            </Text>
            <View className="w-full mt-4">
              {assetList.length ? (
                <Button
                  label={allArmed ? "Disarm everything" : "Arm everything"}
                  variant={allArmed ? "secondary" : "primary"}
                  loading={armAll.isPending}
                  onPress={() =>
                    armAll.mutate(!allArmed, {
                      onSuccess: () =>
                        toastBus.show(
                          allArmed
                            ? { icon: "shield-off", title: "Guardian disarmed", tone: "warning" }
                            : { icon: "shield", title: "All belongings protected", tone: "primary" },
                        ),
                    })
                  }
                />
              ) : (
                <Button label="Add a belonging" onPress={() => router.push("/belongings/new")} />
              )}
            </View>
          </Card>

          {dailyCheck.data ? (
            <Card className="mb-5">
              <View className="flex-row items-center">
                <View
                  className="w-11 h-11 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: dailyCheck.data.done_today ? tint(colors.primary, 0.16) : colors.surfaceAlt }}
                >
                  <Feather
                    name={dailyCheck.data.done_today ? "check-circle" : "shield"}
                    size={20}
                    color={dailyCheck.data.done_today ? colors.primary : colors.muted}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-foreground font-semibold text-[15px]">Today&apos;s Guardian check</Text>
                  <Text className="text-muted text-[12px] mt-0.5">
                    {dailyCheck.data.done_today
                      ? `Done · ${dailyCheck.data.streak_days}-day streak`
                      : `Confirm your things are safe · +${dailyCheck.data.xp_reward} XP`}
                  </Text>
                </View>
                {!dailyCheck.data.done_today ? (
                  <Button label="Check in" size="sm" onPress={onCheckIn} loading={checkIn.isPending} />
                ) : null}
              </View>
            </Card>
          ) : null}

          <View className="flex-row justify-between mb-2">
            {quickActions.map((action) => (
              <Pressable
                key={action.key}
                onPress={() => router.push(action.href as never)}
                accessibilityRole="button"
                className="items-center"
                style={{ width: 76 }}
              >
                <View className="w-14 h-14 rounded-full bg-surface border border-border items-center justify-center mb-1.5">
                  <Feather name={action.icon} size={20} color={colors.text} />
                </View>
                <Text className="text-muted text-[12px] text-center">{action.label}</Text>
              </Pressable>
            ))}
          </View>

          {openIncidents.length ? (
            <>
              <SectionTitle title="Needs attention" action="All cases" onAction={() => router.push("/incidents")} />
              {openIncidents.slice(0, 3).map((incident) => (
                <IncidentCard key={incident.id} incident={incident} subtitle={deviceNames[incident.device_id]} />
              ))}
            </>
          ) : null}

          <SectionTitle title="Live activity" action="Open feed" onAction={() => router.push("/activity")} />
          <Card className="py-1">
            {events.data?.length ? (
              events.data
                .slice(0, 5)
                .map((event, i, list) => (
                  <EventRow key={event.id} event={event} deviceName={deviceNames[event.device_id]} isLast={i === list.length - 1} />
                ))
            ) : (
              <Text className="text-muted text-center py-4">No sensor activity yet. Events appear here the instant they happen.</Text>
            )}
          </Card>

          <SectionTitle title="Your devices" action="Manage" onAction={() => router.push("/devices")} />
          {devices.data?.length ? (
            <Card className="py-1">
              {devices.data.map((device, i) => (
                <ListRow
                  key={device.id}
                  icon="cpu"
                  title={device.name}
                  subtitle={`${deviceStatusLabel[device.status]} · seen ${timeAgo(device.last_seen_at)}`}
                  onPress={() => router.push(`/devices/${device.id}`)}
                  showChevron
                  isLast={i === devices.data.length - 1}
                  right={<StatusDot tone={deviceTone[device.status]} />}
                />
              ))}
            </Card>
          ) : (
            <EmptyState
              title="No devices paired yet"
              message="Pair your GuardianTag unit to get started."
              actionLabel="Pair a device"
              onAction={() => router.push("/devices/pair")}
            />
          )}
        </>
      ) : null}
    </ScreenContainer>
  );
}
