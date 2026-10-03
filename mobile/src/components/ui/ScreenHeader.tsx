import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";

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
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
            className="mr-3 w-9 h-9 rounded-full bg-surface border border-border items-center justify-center"
          >
            <Text className="text-white text-lg">‹</Text>
          </Pressable>
        ) : null}
        <View className="flex-1">
          <Text className="text-2xl font-bold text-white" accessibilityRole="header">
            {title}
          </Text>
          {subtitle ? <Text className="text-muted mt-0.5">{subtitle}</Text> : null}
        </View>
      </View>
      {right}
    </View>
  );
}
