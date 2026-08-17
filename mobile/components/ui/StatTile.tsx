import { View, Text } from "react-native";

export function StatTile({
  label,
  value,
  accent = "text-foreground dark:text-white",
}: {
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <View className="flex-1 items-center">
      <Text className={`text-[26px] font-bold ${accent}`}>{value}</Text>
      <Text className="text-muted text-[14px] mt-0.5">{label}</Text>
    </View>
  );
}
