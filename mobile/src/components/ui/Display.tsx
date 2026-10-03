import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { useRealtimeState } from "@/src/lib/realtime/RealtimeProvider";
import { colors } from "@/src/theme";

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View className="flex-row items-center justify-between mt-6 mb-2.5">
      <Text className="text-foreground font-semibold text-[17px]">{title}</Text>
      {action && onAction ? (
        <Pressable onPress={onAction} hitSlop={8} accessibilityRole="button">
          <Text className="text-primary-light text-[14px] font-medium">{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Small uppercase label above a group of rows (settings style). */
export function GroupLabel({ label }: { label: string }) {
  return <Text className="text-muted text-[12px] font-medium uppercase tracking-wide mb-2 ml-1 mt-5">{label}</Text>;
}

export function ProgressBar({ value, max, tone = "bg-primary" }: { value: number; max: number; tone?: string }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <View
      className="h-1.5 bg-surface-alt rounded-full overflow-hidden"
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max, now: value }}
    >
      <View className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
    </View>
  );
}

/** Pulsing dot + label showing whether the live socket is connected. */
export function LiveIndicator() {
  const state = useRealtimeState();
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (state !== "live") return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [state, pulse]);

  const color = state === "live" ? colors.safe : state === "connecting" ? colors.warning : colors.emergency;
  const label = state === "live" ? "LIVE" : state === "connecting" ? "SYNCING" : "OFFLINE";
  return (
    <View
      className="flex-row items-center bg-surface border border-border rounded-full px-2.5 py-1"
      accessibilityLabel={`Realtime ${label.toLowerCase()}`}
    >
      <View style={{ width: 8, height: 8, alignItems: "center", justifyContent: "center", marginRight: 6 }}>
        {state === "live" ? (
          <Animated.View
            style={{
              position: "absolute",
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: color,
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
              transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] }) }],
            }}
          />
        ) : null}
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
      </View>
      <Text className="text-[10px] font-bold text-foreground tracking-widest">{label}</Text>
    </View>
  );
}

export function StatusDot({ tone }: { tone: "safe" | "warning" | "emergency" | "muted" }) {
  const color = { safe: colors.safe, warning: colors.warning, emergency: colors.emergency, muted: colors.muted }[tone];
  return <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />;
}

export function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return (
    <View
      className="bg-surface-alt border border-border items-center justify-center rounded-full"
      style={{ width: size, height: size }}
    >
      <Text className="text-primary-light font-bold" style={{ fontSize: size * 0.34 }}>
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

export function KeyValue({ label, value, isLast = false }: { label: string; value: string; isLast?: boolean }) {
  return (
    <View className={`flex-row justify-between py-2.5 ${isLast ? "" : "border-b border-hairline"}`}>
      <Text className="text-muted text-[14px]">{label}</Text>
      <Text className="text-foreground text-[14px] font-medium">{value}</Text>
    </View>
  );
}
