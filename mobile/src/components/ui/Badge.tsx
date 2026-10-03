import { View, Text } from "react-native";

export type BadgeTone = "primary" | "safe" | "warning" | "emergency" | "muted";

const toneClasses: Record<BadgeTone, string> = {
  primary: "bg-primary/20 text-primary-light border-primary/30",
  safe: "bg-safe/20 text-safe border-safe/30",
  warning: "bg-warning/20 text-warning border-warning/30",
  emergency: "bg-emergency/20 text-emergency border-emergency/30",
  muted: "bg-surface-alt text-muted border-border",
};

export function Badge({ label, tone = "muted" }: { label: string; tone?: BadgeTone }) {
  const classes = toneClasses[tone].split(" ");
  const bgBorder = classes.filter((c) => c.startsWith("bg-") || c.startsWith("border-")).join(" ");
  const textColor = classes.find((c) => c.startsWith("text-"));

  return (
    <View className={`self-start px-2.5 py-1 rounded-full border ${bgBorder}`}>
      <Text className={`text-xs font-semibold ${textColor}`}>{label}</Text>
    </View>
  );
}
