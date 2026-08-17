import { View, Text, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors } from "@/constants/theme";

export function ListRow({
  icon,
  title,
  subtitle,
  right,
  onPress,
  showChevron = false,
  isLast = false,
  tone = "default",
}: {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  isLast?: boolean;
  tone?: "default" | "emergency";
}) {
  const Wrapper = onPress ? Pressable : View;
  const iconColor = tone === "emergency" ? colors.emergency : colors.mutedLight;
  const titleClass = tone === "emergency" ? "text-emergency-light" : "text-foreground";

  return (
    <Wrapper
      onPress={onPress}
      className={`flex-row items-center py-3.5 ${isLast ? "" : "border-b border-hairline"}`}
      style={onPress ? ({ pressed }: { pressed: boolean }) => ({ opacity: pressed ? 0.6 : 1 }) : undefined}
    >
      {icon ? (
        <View className="w-9 h-9 rounded-full bg-surface-alt items-center justify-center mr-3">
          <Feather name={icon} size={17} color={iconColor} />
        </View>
      ) : null}
      <View className="flex-1">
        <Text className={`text-[15px] font-medium ${titleClass}`}>{title}</Text>
        {subtitle ? <Text className="text-muted text-[14px] mt-0.5">{subtitle}</Text> : null}
      </View>
      {right}
      {showChevron ? (
        <Feather name="chevron-right" size={18} color={colors.muted} style={{ marginLeft: 6 }} />
      ) : null}
    </Wrapper>
  );
}
