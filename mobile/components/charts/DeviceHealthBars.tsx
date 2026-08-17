import { useEffect, useRef } from "react";
import { Animated, View, Text } from "react-native";
import { colors } from "@/constants/theme";
import type { Device, DeviceStatus } from "@/types/api";

const signalFor: Record<DeviceStatus, number> = {
  online: 0.95,
  degraded: 0.45,
  offline: 0.08,
  unpaired: 0,
};

const colorFor: Record<DeviceStatus, string> = {
  online: colors.safe,
  degraded: colors.warning,
  offline: colors.muted,
  unpaired: colors.muted,
};

function PulseDot({ color, live }: { color: string; live: boolean }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!live) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [live, pulse]);

  return (
    <View style={{ width: 8, height: 8, alignItems: "center", justifyContent: "center" }}>
      {live ? (
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
  );
}

function DeviceBar({ device, index, isLast }: { device: Device; index: number; isLast: boolean }) {
  const anim = useRef(new Animated.Value(0)).current;
  const signal = signalFor[device.status];

  useEffect(() => {
    Animated.timing(anim, { toValue: signal, duration: 700, delay: index * 100, useNativeDriver: false }).start();
  }, [anim, signal, index]);

  return (
    <View className={isLast ? "" : "mb-3"}>
      <View className="flex-row items-center justify-between mb-1.5">
        <View className="flex-row items-center">
          <PulseDot color={colorFor[device.status]} live={device.status === "online"} />
          <Text className="text-foreground text-[14px] font-medium ml-2">{device.name}</Text>
        </View>
        <Text className="text-muted text-[12px] capitalize">{device.status}</Text>
      </View>
      <View className="h-1.5 rounded-full bg-surface-alt overflow-hidden">
        <Animated.View
          style={{
            height: "100%",
            borderRadius: 999,
            backgroundColor: colorFor[device.status],
            width: anim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
          }}
        />
      </View>
    </View>
  );
}

export function DeviceHealthBars({ devices }: { devices: Device[] }) {
  return (
    <View>
      {devices.map((device, i) => (
        <DeviceBar key={device.id} device={device} index={i} isLast={i === devices.length - 1} />
      ))}
    </View>
  );
}
