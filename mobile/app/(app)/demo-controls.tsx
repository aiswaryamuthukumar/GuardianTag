import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/hooks/useApi";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Card } from "@/components/ui/Card";
import { ListRow } from "@/components/ui/ListRow";
import { ConfirmSheet } from "@/components/ui/ConfirmSheet";
import { toastBus } from "@/lib/demo/toast";
import { takeLastUnlock } from "@/lib/demo/mockStore";
import type { Device, Incident, SecurityScore } from "@/types/api";

const actions = [
  { key: "alert", icon: "zap" as const, title: "Trigger Alert", subtitle: "Simulate a new case", path: "/demo/simulate-incident" },
  { key: "resolve", icon: "check-circle" as const, title: "Resolve Case", subtitle: "Resolve the latest open case, +50 XP", path: "/demo/resolve-latest" },
  { key: "device", icon: "cpu" as const, title: "Change Device Status", subtitle: "Cycle online → degraded → offline", path: "/demo/cycle-device" },
  { key: "xp", icon: "trending-up" as const, title: "Add XP", subtitle: "+25 XP boost", path: "/demo/add-xp" },
  { key: "reset", icon: "refresh-cw" as const, title: "Reset Demo", subtitle: "Restore this account's starting data", path: "/demo/reset", tone: "emergency" as const },
];

function showUnlockToast() {
  const unlock = takeLastUnlock();
  if (unlock) {
    toastBus.show({
      icon: "award",
      title: unlock.type === "level" ? `Level Up: ${unlock.label}` : "Achievement Unlocked!",
      subtitle: unlock.type === "achievement" ? unlock.label : undefined,
      tone: "primary",
    });
  }
}

export default function DemoControls() {
  const api = useApi();
  const queryClient = useQueryClient();
  const [confirmReset, setConfirmReset] = useState(false);

  const mutation = useMutation({
    mutationFn: (path: string) => api.post(path),
    onSuccess: (data, path) => {
      queryClient.invalidateQueries();
      if (path === "/demo/simulate-incident") {
        toastBus.show({ icon: "alert-triangle", title: "Alert Detected", subtitle: (data as Incident)?.title, tone: "emergency" });
      } else if (path === "/demo/resolve-latest") {
        toastBus.show(
          data
            ? { icon: "check-circle", title: "Resolved ✓", subtitle: "+50 XP", tone: "safe" }
            : { icon: "info", title: "No open cases to resolve", tone: "warning" },
        );
        if (data) setTimeout(showUnlockToast, 1900);
      } else if (path === "/demo/cycle-device") {
        const device = data as Device;
        toastBus.show(
          device.status === "offline"
            ? { icon: "wifi-off", title: "Connection Lost", subtitle: device.name, tone: "emergency" }
            : { icon: "cpu", title: `${device.name} is now ${device.status}`, tone: "safe" },
        );
      } else if (path === "/demo/add-xp") {
        toastBus.show({ icon: "trending-up", title: `+25 XP · ${(data as SecurityScore).score} total`, tone: "primary" });
        setTimeout(showUnlockToast, 1900);
      } else if (path === "/demo/reset") {
        toastBus.show({ icon: "refresh-cw", title: "Demo Reset", tone: "primary" });
      }
    },
  });

  return (
    <ScreenContainer>
      <ScreenHeader title="Demo Controls" showBack subtitle="Trigger actions to see the app update live" />
      <Card>
        {actions.map((a, i) => (
          <ListRow
            key={a.key}
            icon={a.icon}
            title={a.title}
            subtitle={a.subtitle}
            tone={a.tone}
            onPress={() => (a.key === "reset" ? setConfirmReset(true) : mutation.mutate(a.path))}
            isLast={i === actions.length - 1}
          />
        ))}
      </Card>

      <ConfirmSheet
        visible={confirmReset}
        title="Reset demo data"
        message="This restores this account's starting XP, devices and cases."
        confirmLabel="Reset"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          setConfirmReset(false);
          mutation.mutate("/demo/reset");
        }}
      />
    </ScreenContainer>
  );
}
