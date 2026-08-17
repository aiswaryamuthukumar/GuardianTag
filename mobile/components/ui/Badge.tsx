import { View, Text } from "react-native";

export type BadgeTone = "primary" | "safe" | "warning" | "emergency" | "muted";

const bgClasses: Record<BadgeTone, string> = {
  primary: "bg-primary/15",
  safe: "bg-safe/15",
  warning: "bg-warning/15",
  emergency: "bg-emergency/15",
  muted: "bg-surface-alt dark:bg-[#1B1D24]",
};

const textClasses: Record<BadgeTone, string> = {
  primary: "text-primary-light",
  safe: "text-safe-light",
  warning: "text-warning-light",
  emergency: "text-emergency-light",
  muted: "text-muted dark:text-[#8A8D98]",
};

export function Badge({ label, tone = "muted" }: { label: string; tone?: BadgeTone }) {
  return (
    <View className={`self-start px-2.5 py-1 rounded-md ${bgClasses[tone]}`}>
      <Text className={`text-xs font-medium ${textClasses[tone]}`}>{label}</Text>
    </View>
  );
}
