import { router } from "expo-router";
import { StatusDot, useNow } from "@/src/components/ui/Display";
import { ListRow } from "@/src/components/ui/ListRow";
import { timeAgo } from "@/src/lib/format";
import type { Device, DeviceStatus } from "@/src/types/api";

export const deviceTone: Record<DeviceStatus, "safe" | "warning" | "emergency" | "muted"> = {
  online: "safe",
  degraded: "warning",
  offline: "emergency",
  unpaired: "muted",
};

export const deviceStatusLabel: Record<DeviceStatus, string> = {
  online: "Online",
  degraded: "Degraded signal",
  offline: "Offline",
  unpaired: "Unpaired",
};

/** A device as a list row (use inside a Card). "Last seen" ticks live. */
export function DeviceRow({ device, armedCount, isLast }: { device: Device; armedCount?: number; isLast?: boolean }) {
  const now = useNow(5000);
  const parts = [deviceStatusLabel[device.status], `seen ${timeAgo(device.last_seen_at, now)}`];
  if (device.signal_strength != null && device.status !== "offline") parts.push(`Wi-Fi ${device.signal_strength}%`);
  if (armedCount !== undefined) parts.push(`${armedCount} armed`);
  return (
    <ListRow
      icon="cpu"
      title={device.name}
      subtitle={parts.join(" · ")}
      onPress={() => router.push(`/devices/${device.id}`)}
      showChevron
      isLast={isLast}
      right={<StatusDot tone={deviceTone[device.status]} />}
    />
  );
}
