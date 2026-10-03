import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRealtimeState } from "@/src/lib/realtime/RealtimeProvider";

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View className="flex-row items-center justify-between mt-6 mb-3">
      <Text className="text-white font-semibold text-base">{title}</Text>
      {action && onAction ? (
        <Pressable onPress={onAction} hitSlop={8} accessibilityRole="button">
          <Text className="text-primary-light text-sm">{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ProgressBar({ value, max, tone = "bg-primary" }: { value: number; max: number; tone?: string }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <View
      className="h-2 bg-surface-alt rounded-full overflow-hidden"
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max, now: value }}
    >
      <View className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
    </View>
  );
}

/** A pulsing dot + label showing whether the live socket is connected. */
export function LiveIndicator() {
  const state = useRealtimeState();
  const [dim, setDim] = useState(false);
  useEffect(() => {
    if (state !== "live") return;
    const timer = setInterval(() => setDim((d) => !d), 900);
    return () => clearInterval(timer);
  }, [state]);

  const tone = state === "live" ? "bg-safe" : state === "connecting" ? "bg-warning" : "bg-emergency";
  const label = state === "live" ? "LIVE" : state === "connecting" ? "CONNECTING" : "OFFLINE";
  return (
    <View className="flex-row items-center bg-surface border border-border rounded-full px-2.5 py-1" accessibilityLabel={`Realtime ${label}`}>
      <View className={`w-2 h-2 rounded-full mr-1.5 ${tone}`} style={{ opacity: dim ? 0.35 : 1 }} />
      <Text className="text-[10px] font-bold text-white tracking-widest">{label}</Text>
    </View>
  );
}

export function StatusDot({ tone }: { tone: "safe" | "warning" | "emergency" | "muted" }) {
  const cls = { safe: "bg-safe", warning: "bg-warning", emergency: "bg-emergency", muted: "bg-muted" }[tone];
  return <View className={`w-2.5 h-2.5 rounded-full ${cls}`} />;
}

export function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return (
    <View className="bg-primary/25 border border-primary/40 items-center justify-center rounded-full" style={{ width: size, height: size }}>
      <Text className="text-primary-light font-bold" style={{ fontSize: size * 0.38 }}>
        {initials || "?"}
      </Text>
    </View>
  );
}

/** Re-renders every `intervalMs` so "last seen 12s ago" style labels tick live. */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

export function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-2 border-b border-border/60">
      <Text className="text-muted">{label}</Text>
      <Text className="text-white font-medium">{value}</Text>
    </View>
  );
}
