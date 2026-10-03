import { View, Text } from "react-native";
import { BackButton } from "@/src/components/ui/BackButton";

export function ScreenHeader({
  title,
  subtitle,
  showBack = false,
  right,
}: {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  right?: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center justify-between py-4">
      <View className="flex-row items-center flex-1">
        {showBack ? (
          <View className="mr-3">
            <BackButton />
          </View>
        ) : null}
        <View className="flex-1">
          <Text className="text-[22px] font-bold text-foreground tracking-tight" accessibilityRole="header" numberOfLines={2}>
            {title}
          </Text>
          {subtitle ? <Text className="text-muted mt-0.5 text-[14px]">{subtitle}</Text> : null}
        </View>
      </View>
      {right}
    </View>
  );
}
