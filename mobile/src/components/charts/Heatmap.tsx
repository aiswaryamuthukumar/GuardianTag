import { Text, View } from "react-native";
import { WEEKDAYS } from "@/src/lib/format";

// Sequential scale: surface -> warning -> emergency as counts rise.
const SCALE = ["#1E1E2B", "#4C2A1F", "#8A3A1A", "#C2410C", "#EF4444"];

function shade(value: number, max: number): string {
  if (value === 0 || max === 0) return SCALE[0];
  return SCALE[Math.min(SCALE.length - 1, Math.ceil((value / max) * (SCALE.length - 1)))];
}

/** 7 x 24 grid of when alerts happen: rows = weekdays, columns = hours of the day. */
export function Heatmap({ cells }: { cells: number[][] }) {
  const max = Math.max(0, ...cells.flat());
  return (
    <View>
      {cells.map((row, day) => (
        <View key={day} className="flex-row items-center mb-[3px]">
          <Text className="text-muted text-[10px] w-8">{WEEKDAYS[day]}</Text>
          <View className="flex-1 flex-row">
            {row.map((value, hour) => (
              <View
                key={hour}
                className="flex-1 rounded-[2px] mx-[1px]"
                style={{ aspectRatio: 1, backgroundColor: shade(value, max) }}
              />
            ))}
          </View>
        </View>
      ))}
      <View className="flex-row justify-between ml-8 mt-1">
        {["12am", "6am", "12pm", "6pm", "11pm"].map((label) => (
          <Text key={label} className="text-muted text-[10px]">
            {label}
          </Text>
        ))}
      </View>
      <View className="flex-row items-center justify-end mt-2">
        <Text className="text-muted text-[10px] mr-1.5">Fewer</Text>
        {SCALE.map((c) => (
          <View key={c} className="w-3 h-3 rounded-[2px] mx-[1px]" style={{ backgroundColor: c }} />
        ))}
        <Text className="text-muted text-[10px] ml-1.5">More</Text>
      </View>
    </View>
  );
}
