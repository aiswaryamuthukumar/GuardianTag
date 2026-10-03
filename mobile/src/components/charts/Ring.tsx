import { Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors } from "@/src/theme";

/** Circular progress ring with a centred value, e.g. asset coverage %. */
export function Ring({
  percent,
  size = 96,
  stroke = 10,
  color = colors.safe,
  label,
}: {
  percent: number;
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <View style={{ width: size, height: size }} accessibilityLabel={`${label ?? "Progress"} ${Math.round(clamped)} percent`}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.surfaceAlt} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - clamped / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View className="absolute inset-0 items-center justify-center">
        <Text className="text-white font-bold text-lg">{Math.round(clamped)}%</Text>
        {label ? <Text className="text-muted text-[10px]">{label}</Text> : null}
      </View>
    </View>
  );
}
