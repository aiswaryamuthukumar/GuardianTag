import { View, Text } from "react-native";

export function StatTile({
  label,
  value,
  accent = "text-white",
}: {
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <View className="flex-1 bg-surface border border-border rounded-2xl p-4">
      <Text className={`text-2xl font-bold ${accent}`}>{value}</Text>
      <Text className="text-muted text-xs mt-1">{label}</Text>
    </View>
  );
}
