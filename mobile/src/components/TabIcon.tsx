import { Text, View, type ColorValue } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors } from "@/src/theme";

/** Feather tab icon with an optional count badge (e.g. unread alerts). */
export function TabIcon({
  icon,
  color,
  badge,
}: {
  icon: keyof typeof Feather.glyphMap;
  color: ColorValue;
  badge?: number;
}) {
  return (
    <View>
      <Feather name={icon} size={22} color={color as string} />
      {badge ? (
        <View
          className="absolute -top-1 -right-2.5 rounded-full min-w-[16px] h-4 px-1 items-center justify-center"
          style={{ backgroundColor: colors.emergency }}
        >
          <Text className="text-white text-[10px] font-bold">{badge > 99 ? "99+" : badge}</Text>
        </View>
      ) : null}
    </View>
  );
}

export const tabScreenOptions = {
  headerShown: false,
  tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 64, paddingBottom: 8, paddingTop: 6 },
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.muted,
  tabBarLabelStyle: { fontSize: 11, fontWeight: "600" as const },
  sceneStyle: { backgroundColor: colors.background },
};
