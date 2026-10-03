import { useEffect, useRef, useState } from "react";
import { Animated, View, Text, Pressable } from "react-native";
import Svg, { Path, Circle, Line } from "react-native-svg";
import { colors } from "@/constants/theme";

export interface DailyIncidentCount {
  date: string;
  count: number;
}

const HEIGHT = 130;
const PAD_TOP = 16;

export function ActivityTimeline({ data }: { data: DailyIncidentCount[] }) {
  const [selected, setSelected] = useState<DailyIncidentCount | null>(null);
  const anim = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  const maxCount = Math.max(1, ...data.map((d) => d.count));
  const stepX = 100 / Math.max(1, data.length - 1);
  const points = data.map((d, i) => ({
    x: i * stepX,
    y: PAD_TOP + (1 - d.count / maxCount) * (HEIGHT - PAD_TOP * 2),
    d,
  }));

  const shown = selected ?? data[data.length - 1];
  const shownPoint = points.find((p) => p.d.date === shown?.date);

  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: false }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    ).start();
  }, [anim, pulse]);

  const linePath = points.length > 1
    ? points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ")
    : "";
  const areaPath = points.length > 1
    ? `${linePath} L${points[points.length - 1].x},${HEIGHT} L${points[0].x},${HEIGHT} Z`
    : "";

  return (
    <View>
      <View className="flex-row items-baseline justify-between mb-2">
        <Text className="text-muted text-[12px]">Peak: {maxCount} in a day</Text>
        {shown ? (
          <Text className="text-foreground text-[12px] font-medium">
            {new Date(shown.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })} · {shown.count} incident{shown.count === 1 ? "" : "s"}
          </Text>
        ) : null}
      </View>

      <Animated.View
        style={{
          height: HEIGHT,
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
        }}
      >
        <Svg width="100%" height={HEIGHT} viewBox={`0 0 100 ${HEIGHT}`} preserveAspectRatio="none">
          <Line x1={0} y1={HEIGHT - 1} x2={100} y2={HEIGHT - 1} stroke={colors.hairline} strokeWidth={0.5} />
          {areaPath ? <Path d={areaPath} fill={colors.primary} opacity={0.08} /> : null}
          {linePath ? (
            <Path d={linePath} stroke={colors.primary} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          ) : null}
          {points.map((p) => {
            const isShown = shownPoint?.d.date === p.d.date;
            return (
              <Circle
                key={p.d.date}
                cx={p.x}
                cy={p.y}
                r={p.d.count === 0 ? 0 : isShown ? 2.6 : 1.8}
                fill={p.d.count === 0 ? "transparent" : isShown ? colors.primaryLight : colors.primary}
              />
            );
          })}
        </Svg>

        {shownPoint && shownPoint.d.count > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: `${shownPoint.x}%`,
              top: shownPoint.y - 7,
              width: 14,
              height: 14,
              marginLeft: -7,
              borderRadius: 7,
              borderWidth: 1.5,
              borderColor: colors.primaryLight,
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }),
              transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] }) }],
            }}
          />
        ) : null}

        <View className="flex-row absolute inset-0">
          {data.map((d) => (
            <Pressable key={d.date} className="flex-1" onPress={() => setSelected(d)} />
          ))}
        </View>
      </Animated.View>

      <Text className="text-muted text-[12px] mt-1">
        Today: {data[data.length - 1]?.count ?? 0} · last {data.length} days
      </Text>
    </View>
  );
}
