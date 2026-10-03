import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import Svg, { Path } from "react-native-svg";
import { colors } from "@/src/theme";

export interface BarDatum {
  key: string;
  label: string; // shown when selected, e.g. "Sep 28"
  value: number;
}

const BAR_GAP = 2;
const BAR_RADIUS = 4;

// A rect path with rounded top corners only, square at the baseline - bars are
// never fully rounded (that reads as a pill, not a bar).
function roundedTopBarPath(x: number, y: number, width: number, height: number, radius: number): string {
  if (height <= 0) return "";
  const r = Math.min(radius, width / 2, height);
  return `M${x},${y + height} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + width - r},${y} Q${x + width},${y} ${x + width},${y + r} L${x + width},${y + height} Z`;
}

/** Tappable bar chart; tap a bar to read its exact value. */
export function BarChart({
  data,
  height = 120,
  unit = "incident",
  color = colors.primary,
  axisLabels,
}: {
  data: BarDatum[];
  height?: number;
  unit?: string;
  color?: string;
  /** Optional labels under the first / middle / last bar. */
  axisLabels?: [string, string, string];
}) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  if (data.length === 0) return null;

  const max = Math.max(1, ...data.map((d) => d.value));
  const barWidth = 100 / data.length - BAR_GAP;
  const widthUnits = data.length * (barWidth + BAR_GAP);
  const shown = data.find((d) => d.key === selectedKey) ?? data.reduce((a, b) => (b.value > a.value ? b : a));

  return (
    <View>
      <View className="flex-row items-baseline justify-between mb-2">
        <Text className="text-muted text-xs">Peak {max}</Text>
        <Text className="text-white text-xs font-medium">
          {shown.label} · {shown.value} {unit}
          {shown.value === 1 ? "" : "s"}
        </Text>
      </View>

      <View style={{ height }}>
        <Svg width="100%" height={height} viewBox={`0 0 ${widthUnits} ${height}`} preserveAspectRatio="none">
          {data.map((d, i) => {
            const barHeight = (d.value / max) * (height - 4);
            return (
              <Path
                key={d.key}
                d={roundedTopBarPath(i * (barWidth + BAR_GAP), height - barHeight, barWidth, barHeight, BAR_RADIUS)}
                fill={d.key === shown.key ? color : colors.primaryDark}
                opacity={d.key === shown.key ? 1 : 0.7}
              />
            );
          })}
        </Svg>
        {/* Invisible per-bar touch targets: SVG shapes don't take RN touches. */}
        <View className="flex-row absolute inset-0">
          {data.map((d) => (
            <Pressable
              key={d.key}
              className="flex-1"
              onPress={() => setSelectedKey(d.key)}
              accessibilityLabel={`${d.label}: ${d.value}`}
            />
          ))}
        </View>
      </View>

      {axisLabels ? (
        <View className="flex-row justify-between mt-1">
          {axisLabels.map((label, i) => (
            <Text key={i} className="text-muted text-[10px]">
              {label}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}
