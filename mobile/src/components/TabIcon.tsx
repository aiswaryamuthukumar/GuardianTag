import { Text, View } from "react-native";
import { colors } from "@/src/theme";

/** Emoji tab icon with an optional count badge (e.g. unread alerts). */
export function TabIcon({ icon, focused, badge }: { icon: string; focused: boolean; badge?: number }) {
  return (
    <View>
      <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.55 }}>{icon}</Text>
      {badge ? (
        <View className="absolute -top-1 -right-3 bg-emergency rounded-full min-w-[16px] h-4 px-1 items-center justify-center">
          <Text className="text-white text-[10px] font-bold">{badge > 99 ? "99+" : badge}</Text>
        </View>
      ) : null}
    </View>
  );
}

export const tabScreenOptions = {
    headerShown: false,
    tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 64, paddingBottom: 8, paddingTop: 6 },
    tabBarActiveTintColor: colors.primaryLight,
    tabBarInactiveTintColor: colors.muted,
    tabBarLabelStyle: { fontSize: 11, fontWeight: "600" as const },
    sceneStyle: { backgroundColor: colors.background },
};
