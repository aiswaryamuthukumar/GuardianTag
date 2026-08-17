import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import Svg, { Path } from "react-native-svg";
import { colors } from "@/constants/theme";

export interface DailyIncidentCount {
  date: string;
  count: number;
}

const CHART_HEIGHT = 120;
const MAX_BAR_WIDTH = 24;
const BAR_GAP = 2;
const BAR_RADIUS = 4;

// A rect path with rounded top corners only, square at the baseline - per the
// mark spec, bars are never fully rounded (that reads as a pill, not a bar).
function roundedTopBarPath(x: number, y: number, width: number, height: number, radius: number): string {
  const r = Math.min(radius, width / 2, height);
  if (height <= 0) return "";
  return `
    M${x},${y + height}
    L${x},${y + r}
    Q${x},${y} ${x + r},${y}
    L${x + width - r},${y}
    Q${x + width},${y} ${x + width},${y + r}
    L${x + width},${y + height}
    Z
  `;
}

export function IncidentTrendChart({ data }: { data: DailyIncidentCount[] }) {
  const [selected, setSelected] = useState<DailyIncidentCount | null>(null);

  const maxCount = Math.max(1, ...data.map((d) => d.count));
  const barWidth = Math.min(MAX_BAR_WIDTH, 100 / data.length - BAR_GAP);
  const chartWidthUnits = data.length * (barWidth + BAR_GAP);

  const todaysCount = data[data.length - 1]?.count ?? 0;
  const shown = selected ?? data[data.length - 1];

  return (
    <View>
      <View className="flex-row items-baseline justify-between mb-2">
        <Text className="text-muted text-xs">Peak: {maxCount} in a day</Text>
        {shown ? (
          <Text className="text-white text-xs font-medium">
            {new Date(shown.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })} ·{" "}
            {shown.count} incident{shown.count === 1 ? "" : "s"}
          </Text>
        ) : null}
      </View>

      <Svg width="100%" height={CHART_HEIGHT} viewBox={`0 0 ${chartWidthUnits} ${CHART_HEIGHT}`}>
        {data.map((d, i) => {
          const barHeight = (d.count / maxCount) * (CHART_HEIGHT - 4);
          const x = i * (barWidth + BAR_GAP);
          const y = CHART_HEIGHT - barHeight;
          const isSelected = shown?.date === d.date;
          return (
            <Path
              key={`path-${d.date}`}
              d={roundedTopBarPath(x, y, barWidth, barHeight, BAR_RADIUS)}
              fill={isSelected ? colors.primary : colors.primaryDark}
              opacity={d.count === 0 ? 0.3 : 1}
            />
          );
        })}
      </Svg>

      {/* Invisible touch targets, one per bar - SVG itself doesn't handle RN touch events per-shape. */}
      <View className="flex-row absolute inset-0" style={{ height: CHART_HEIGHT }}>
        {data.map((d) => (
          <Pressable key={`bar-${d.date}`} className="flex-1" onPress={() => setSelected(d)} />
        ))}
      </View>

      <Text className="text-muted text-xs mt-1">
        Today: {todaysCount} · last {data.length} days
      </Text>
    </View>
  );
}
