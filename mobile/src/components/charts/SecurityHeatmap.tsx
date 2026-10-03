import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import { colors } from "@/src/theme";
import type { HeatmapDay } from "@/src/types/api";

function cellColor(day: HeatmapDay) {
  if (day.alert) return colors.emergency;
  if (day.resolved) return colors.warning;
  if (day.checked) return colors.primary;
  return colors.surfaceAlt;
}

function Cell({ day, index }: { day: HeatmapDay; index: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, delay: index * 12, friction: 7, tension: 80, useNativeDriver: true }).start();
  }, [anim, index]);

  return (
    <Animated.View
      style={{
        width: 16,
        height: 16,
        borderRadius: 4,
        backgroundColor: cellColor(day),
        opacity: anim,
        transform: [{ scale: anim }],
      }}
    />
  );
}

export function SecurityHeatmap({ days }: { days: HeatmapDay[] }) {
  return (
    <View className="flex-row flex-wrap gap-1.5">
      {days.map((d, i) => (
        <Cell key={d.date} day={d} index={i} />
      ))}
    </View>
  );
}
