import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { colors } from "@/constants/theme";

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
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/(app)/home"))}
            hitSlop={8}
            className="w-10 h-10 rounded-full bg-surface-alt border border-border items-center justify-center mr-3"
          >
            <Feather name="arrow-left" size={20} color={colors.text} />
          </Pressable>
        ) : null}
        <View className="flex-1">
          <Text className="text-[22px] font-bold text-foreground tracking-tight">{title}</Text>
          {subtitle ? <Text className="text-muted mt-0.5 text-[14px]">{subtitle}</Text> : null}
        </View>
      </View>
      {right}
    </View>
  );
}
