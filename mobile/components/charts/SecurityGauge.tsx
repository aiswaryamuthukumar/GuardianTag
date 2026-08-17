import { useEffect, useRef } from "react";
import { Animated, View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors } from "@/constants/theme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const SIZE = 132;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

export function SecurityGauge({ score, max = 1500, label }: { score: number; max?: number; label: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  const pct = Math.max(0, Math.min(1, score / max));

  useEffect(() => {
    Animated.timing(anim, { toValue: pct, duration: 1100, useNativeDriver: false }).start();
  }, [pct, anim]);

  const strokeDashoffset = anim.interpolate({ inputRange: [0, 1], outputRange: [CIRC, CIRC * (1 - pct)] });

  return (
    <View className="items-center justify-center" style={{ width: SIZE, height: SIZE }}>
      <Svg width={SIZE} height={SIZE}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={colors.surfaceAlt}
          strokeWidth={STROKE}
          fill="none"
        />
        <AnimatedCircle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={colors.primary}
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={strokeDashoffset}
          rotation={-90}
          originX={SIZE / 2}
          originY={SIZE / 2}
        />
      </Svg>
      <View style={{ position: "absolute", alignItems: "center" }}>
        <Text className="text-foreground text-[26px] font-bold">{score}</Text>
        <Text className="text-muted text-[12px] mt-0.5">{label}</Text>
      </View>
    </View>
  );
}
