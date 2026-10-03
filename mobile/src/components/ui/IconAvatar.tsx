import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors } from "@/constants/theme";

const toneBg: Record<string, string> = {
  primary: "rgba(105,215,184,0.14)",
  safe: "rgba(105,215,184,0.14)",
  warning: "rgba(242,184,75,0.14)",
  emergency: "rgba(239,98,98,0.14)",
  muted: colors.surfaceAlt,
};

const toneColor: Record<string, string> = {
  primary: colors.primaryLight,
  safe: colors.safe,
  warning: colors.warning,
  emergency: colors.emergency,
  muted: colors.muted,
};

export function IconAvatar({
  icon,
  tone = "muted",
  size = 40,
}: {
  icon: keyof typeof Feather.glyphMap;
  tone?: "primary" | "safe" | "warning" | "emergency" | "muted";
  size?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: toneBg[tone],
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Feather name={icon} size={size * 0.45} color={toneColor[tone]} />
    </View>
  );
}
