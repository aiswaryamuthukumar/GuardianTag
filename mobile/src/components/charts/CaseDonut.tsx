import { useEffect, useRef, useState } from "react";
import { Animated, View, Text, Pressable } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors } from "@/src/theme";

const SIZE = 132;
const STROKE = 16;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

export function CaseDonut({
  segments,
}: {
  segments: { label: string; value: number; color: string }[];
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const [selected, setSelected] = useState<number | null>(null);
  const total = segments.reduce((s, x) => s + x.value, 0);

  useEffect(() => {
    Animated.spring(anim, { toValue: 1, friction: 7, tension: 45, useNativeDriver: true }).start();
  }, [anim]);

  let cumulative = 0;
  const active = selected !== null ? segments[selected] : null;

  return (
    <View className="flex-row items-center">
      <Animated.View
        style={{
          width: SIZE,
          height: SIZE,
          opacity: anim,
          transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }],
        }}
      >
        <Svg width={SIZE} height={SIZE}>
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} stroke={colors.surfaceAlt} strokeWidth={STROKE} fill="none" />
          {segments.map((seg, i) => {
            if (total === 0 || seg.value === 0) return null;
            const fraction = seg.value / total;
            const offset = cumulative;
            cumulative += fraction;
            return (
              <Circle
                key={seg.label}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                stroke={seg.color}
                strokeWidth={STROKE}
                fill="none"
                strokeDasharray={`${fraction * CIRC} ${CIRC}`}
                strokeDashoffset={-offset * CIRC}
                strokeLinecap="butt"
                rotation={-90}
                originX={SIZE / 2}
                originY={SIZE / 2}
                opacity={selected === null || selected === i ? 1 : 0.3}
              />
            );
          })}
        </Svg>
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}>
          <Text className="text-foreground text-[22px] font-bold">{active ? active.value : total}</Text>
          <Text className="text-muted text-[11px]">{active ? active.label : "Total cases"}</Text>
        </View>
      </Animated.View>
      <View className="flex-1 ml-4 gap-2">
        {segments.map((seg, i) => (
          <Pressable
            key={seg.label}
            onPress={() => setSelected(selected === i ? null : i)}
            className="flex-row items-center"
          >
            <View className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: seg.color }} />
            <Text className="text-muted text-[13px] flex-1">{seg.label}</Text>
            <Text className="text-foreground text-[13px] font-medium">
              {total > 0 ? Math.round((seg.value / total) * 100) : 0}%
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
