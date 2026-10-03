import type {
  AssetCategory,
  GuardianLevel,
  IncidentSeverity,
  IncidentStatus,
  SensorEventType,
} from "@/src/types/api";

export function formatDuration(seconds: number | null): string {
  if (seconds === null || Number.isNaN(seconds)) return "—";
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = seconds / 60;
  if (minutes < 60) return `${minutes.toFixed(1)}m`;
  const hours = minutes / 60;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

/** "just now", "42s ago", "5m ago", "3h ago", "2d ago". `now` lets live counters tick. */
export function timeAgo(iso: string | null | undefined, now: number = Date.now()): string {
  if (!iso) return "never";
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatClock(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function formatUptime(seconds: number | null): string {
  if (seconds === null) return "—";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  return `${m}m`;
}

/** Wi-Fi RSSI (dBm) in words, the way a student would describe it. */
export function signalLabel(rssi: number | null): string {
  if (rssi === null) return "Unknown";
  if (rssi >= -55) return "Excellent";
  if (rssi >= -67) return "Good";
  if (rssi >= -75) return "Fair";
  return "Weak";
}

export const levelLabels: Record<GuardianLevel, string> = {
  rookie: "Rookie",
  watchman: "Watchman",
  guardian: "Guardian",
  sentinel: "Sentinel",
  hostel_protector: "Hostel Protector",
};

export const categoryLabels: Record<AssetCategory, string> = {
  bag: "Bag",
  laptop: "Laptop",
  document: "Documents",
  other: "Other",
};

export const categoryIcons: Record<AssetCategory, string> = {
  bag: "🎒",
  laptop: "💻",
  document: "📄",
  other: "📦",
};

export const statusLabels: Record<IncidentStatus, string> = {
  open: "Open",
  investigating: "Investigating",
  resolved: "Resolved",
  false_alarm: "False alarm",
};

export const severityLabels: Record<IncidentSeverity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const eventLabels: Record<SensorEventType, string> = {
  movement: "Movement",
  hall_trigger: "Opened (hall sensor)",
  dual_verified: "Dual-verified trigger",
  disarmed: "Disarmed on device",
  heartbeat: "Heartbeat",
};

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Bit 0 = Monday, matching the backend's ArmSchedule.days_mask. */
export function daysFromMask(mask: number): string {
  if (mask === 0b1111111) return "Every day";
  if (mask === 0b0011111) return "Weekdays";
  if (mask === 0b1100000) return "Weekends";
  return WEEKDAYS.filter((_, i) => mask & (1 << i)).join(", ");
}

/** "09:00:00" -> "09:00" */
export function hhmm(time: string): string {
  return time.slice(0, 5);
}

export function hourLabel(hour: number): string {
  const suffix = hour < 12 ? "am" : "pm";
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}${suffix}`;
}
