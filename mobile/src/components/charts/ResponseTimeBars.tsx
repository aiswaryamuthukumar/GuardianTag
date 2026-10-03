import { useEffect, useRef } from "react";
import { Animated, View, Text } from "react-native";
import { colors } from "@/constants/theme";
import { formatDuration } from "@/lib/format";

function Bar({ label, seconds, max, sampleSize, index }: { label: string; seconds: number | null; max: number; sampleSize: number; index: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  const fraction = seconds && max > 0 ? Math.min(1, seconds / max) : 0;

  useEffect(() => {
    Animated.timing(anim, { toValue: fraction, duration: 800, delay: index * 120, useNativeDriver: false }).start();
  }, [anim, fraction, index]);

  return (
    <View className="mb-3">
      <View className="flex-row items-center justify-between mb-1.5">
        <Text className="text-muted text-[13px]">{label}</Text>
        <Text className="text-foreground text-[13px] font-medium">
          {formatDuration(seconds)}
          {sampleSize > 0 ? ` · ${sampleSize} sample${sampleSize === 1 ? "" : "s"}` : ""}
        </Text>
      </View>
      <View className="h-2.5 rounded-full bg-surface-alt overflow-hidden">
        <Animated.View
          style={{
            height: "100%",
            borderRadius: 999,
            backgroundColor: colors.primary,
            width: anim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
          }}
        />
      </View>
    </View>
  );
}

export function ResponseTimeBars({
  avgDisarmSeconds,
  disarmSampleSize,
  avgResolutionSeconds,
  resolvedSampleSize,
}: {
  avgDisarmSeconds: number | null;
  disarmSampleSize: number;
  avgResolutionSeconds: number | null;
  resolvedSampleSize: number;
}) {
  const max = Math.max(avgDisarmSeconds ?? 0, avgResolutionSeconds ?? 0, 1);

  return (
    <View>
      <Bar label="Avg. quick disarm" seconds={avgDisarmSeconds} max={max} sampleSize={disarmSampleSize} index={0} />
      <Bar label="Avg. manual resolution" seconds={avgResolutionSeconds} max={max} sampleSize={resolvedSampleSize} index={1} />
    </View>
  );
}
