import { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, tint } from "@/src/theme";

export type ScannerTone = "primary" | "emergency" | "muted";

const toneColor: Record<ScannerTone, string> = {
  primary: colors.primary,
  emergency: colors.emergency,
  muted: colors.muted,
};

const toneBg: Record<ScannerTone, string> = {
  primary: tint(colors.primary, 0.1),
  emergency: tint(colors.emergency, 0.1),
  muted: tint(colors.muted, 0.06),
};

export function ShieldScanner({
  active,
  tone = "primary",
  size = 140,
  icon = "shield",
  fast = false,
}: {
  active: boolean;
  tone?: ScannerTone;
  size?: number;
  icon?: keyof typeof Feather.glyphMap;
  fast?: boolean;
}) {
  const ring = useRef(new Animated.Value(0)).current;
  const color = toneColor[tone];

  useEffect(() => {
    if (!active) {
      ring.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(ring, {
          toValue: 1,
          duration: fast ? 1100 : 2200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(ring, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, fast, ring]);

  return (
    <View style={{ width: size * 1.4, height: size * 1.4, alignItems: "center", justifyContent: "center" }}>
      {active ? (
        <Animated.View
          style={{
            position: "absolute",
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 1.5,
            borderColor: color,
            opacity: ring.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] }),
            transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] }) }],
          }}
        />
      ) : null}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: toneBg[tone],
          borderWidth: 1.5,
          borderColor: color,
        }}
      >
        <Feather name={icon} size={size * 0.36} color={color} />
      </View>
    </View>
  );
}
