import { Text } from "react-native";
import { router } from "expo-router";
import type { Feather } from "@expo/vector-icons";
import { Card } from "@/src/components/ui/Card";
import { LiveIndicator } from "@/src/components/ui/Display";
import { ListRow } from "@/src/components/ui/ListRow";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { ScreenHeader } from "@/src/components/ui/ScreenHeader";
import { EmptyState } from "@/src/components/ui/StateViews";
import { useDemoAction } from "@/src/features/demo/api";
import { useDevices } from "@/src/features/devices/api";
import { toastBus } from "@/src/lib/toast";

type Action = {
  key: string;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  run: () => void;
  tone?: "emergency";
};

/** Act out what the ESP32 sends. Everything flows through the real backend and live socket. */
export default function DemoControlsScreen() {
  const devices = useDevices();
  const demo = useDemoAction();
  const fail = (e: Error) => toastBus.show({ icon: "alert-circle", title: e.message, tone: "warning" });
  const busy = Object.values(demo).some((m) => m.isPending);

  const actions: Action[] = [
    {
      key: "alert",
      icon: "zap",
      title: "Trigger alert",
      subtitle: "Movement + opening → dual-verified event → incident",
      tone: "emergency",
      run: () =>
        demo.simulate.mutate(undefined, {
          onSuccess: (r) =>
            r.ignored && toastBus.show({ icon: "shield-off", title: "Trigger ignored", subtitle: "Nothing on the device is armed", tone: "warning" }),
          onError: fail,
        }),
    },
    {
      key: "disarm",
      icon: "shield-off",
      title: "Press the device button",
      subtitle: "Disarm within the alert window → auto false alarm, +5 XP",
      run: () =>
        demo.disarm.mutate(undefined, {
          onSuccess: (incident) =>
            toastBus.show(
              incident
                ? { icon: "check-circle", title: "Disarmed on device", subtitle: "Closed as false alarm · +5 XP", tone: "safe" }
                : { icon: "info", title: "Nothing to cancel", subtitle: "No open alert in the last 5 minutes", tone: "warning" },
            ),
          onError: fail,
        }),
    },
    {
      key: "resolve",
      icon: "check-circle",
      title: "Resolve latest case",
      subtitle: "Close the newest open case as resolved, +15 XP",
      run: () =>
        demo.resolveLatest.mutate(undefined, {
          onSuccess: (incident) =>
            toastBus.show(
              incident
                ? { icon: "check-circle", title: "Resolved", subtitle: "+15 XP", tone: "safe" }
                : { icon: "info", title: "No open cases to resolve", tone: "warning" },
            ),
          onError: fail,
        }),
    },
    {
      key: "heartbeat",
      icon: "activity",
      title: "Send heartbeat",
      subtitle: "A 60-second health report with Wi-Fi signal",
      run: () =>
        demo.heartbeat.mutate(undefined, {
          onSuccess: (d) => toastBus.show({ icon: "wifi", title: `${d.name} heartbeat`, subtitle: `Wi-Fi ${d.signal_strength ?? "?"}%`, tone: "primary" }),
          onError: fail,
        }),
    },
    {
      key: "device",
      icon: "cpu",
      title: "Change device status",
      subtitle: "Cycle online → degraded → offline",
      run: () =>
        demo.cycleDevice.mutate(undefined, {
          onSuccess: (d) =>
            toastBus.show(
              d.status === "offline"
                ? { icon: "wifi-off", title: "Connection lost", subtitle: d.name, tone: "emergency" }
                : { icon: "cpu", title: `${d.name} is now ${d.status}`, tone: "safe" },
            ),
          onError: fail,
        }),
    },
  ];

  return (
    <ScreenContainer>
      <ScreenHeader title="Demo Controls" showBack subtitle="Trigger device events and watch the app react" right={<LiveIndicator />} />
      {devices.data && devices.data.length === 0 ? (
        <EmptyState
          title="Pair a device first"
          message="Demo Controls act as your paired unit. Pair one with any ID to try them."
          actionLabel="Pair a device"
          onAction={() => router.push("/devices/pair")}
        />
      ) : (
        <>
          <Card className="py-1">
            {actions.map((a, i) => (
              <ListRow
                key={a.key}
                icon={a.icon}
                title={a.title}
                subtitle={a.subtitle}
                tone={a.tone}
                onPress={busy ? undefined : a.run}
                isLast={i === actions.length - 1}
              />
            ))}
          </Card>
          <Text className="text-muted text-[12px] mt-3 px-1">
            Acts on {devices.data?.[0]?.name ?? "your first device"}. These use the same backend path as the real
            ESP32, so the emergency screen, dashboards and warden board all update live.
          </Text>
        </>
      )}
    </ScreenContainer>
  );
}
