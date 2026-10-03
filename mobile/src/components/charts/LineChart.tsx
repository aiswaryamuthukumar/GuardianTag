import { Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";
import { colors } from "@/src/theme";

/** Area line chart for a numeric series (oldest first), e.g. Wi-Fi signal over recent heartbeats. */
export function LineChart({
  values,
  height = 90,
  color = colors.primary,
  min,
  max,
  caption,
}: {
  values: number[];
  height?: number;
  color?: string;
  min?: number;
  max?: number;
  caption?: string;
}) {
  if (values.length < 2) {
    return <Text className="text-muted text-xs py-6 text-center">Waiting for more heartbeats…</Text>;
  }
  const lo = min ?? Math.min(...values);
  const hi = max ?? Math.max(...values);
  const span = hi - lo || 1;
  const width = 100;
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - 4 - ((v - lo) / span) * (height - 8);
    return [x, y] as const;
  });
  const line = points.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;

  return (
    <View>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={0.35} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Path d={area} fill="url(#fill)" />
        <Path d={line} stroke={color} strokeWidth={1.5} fill="none" vectorEffect="non-scaling-stroke" />
      </Svg>
      {caption ? <Text className="text-muted text-[10px] mt-1">{caption}</Text> : null}
    </View>
  );
}
