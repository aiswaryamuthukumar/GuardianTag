import { View, Text } from "react-native";

/** One figure in a StatRow: big value, small label underneath. */
export function StatTile({
  label,
  value,
  accent = "text-foreground",
}: {
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <View className="flex-1 items-center" accessible accessibilityLabel={`${label}: ${value}`}>
      <Text className={`text-[24px] font-bold ${accent}`} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text className="text-muted text-[13px] mt-0.5 text-center">{label}</Text>
    </View>
  );
}
