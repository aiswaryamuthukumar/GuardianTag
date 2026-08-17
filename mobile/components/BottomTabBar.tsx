import { View, Text, Pressable } from "react-native";
import { router, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { colors } from "@/constants/theme";

const TABS = [
  { key: "home", label: "Home", icon: "home" as const, href: "/(app)/home" as const, path: "/home" },
  { key: "guard", label: "Guard", icon: "shield" as const, href: "/(app)/guardian-mode" as const, path: "/guardian-mode" },
  { key: "cases", label: "Cases", icon: "search" as const, href: "/(app)/incidents" as const, path: "/incidents" },
  { key: "rewards", label: "Rewards", icon: "award" as const, href: "/(app)/gamification" as const, path: "/gamification" },
  { key: "profile", label: "Profile", icon: "user" as const, href: "/(app)/profile" as const, path: "/profile" },
];

const ROOT_PATHS = new Set(TABS.map((t) => t.path));

export function BottomTabBar() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  if (!ROOT_PATHS.has(pathname)) return null;

  return (
    <View
      className="absolute left-0 right-0 bottom-0 bg-surface dark:bg-[#15161C] border-t border-border"
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}
    >
      <View className="flex-row">
        {TABS.map((tab) => {
          const active = pathname === tab.path;
          const color = active ? colors.primary : colors.muted;
          return (
            <Pressable
              key={tab.key}
              onPress={() => !active && router.replace(tab.href)}
              className="flex-1 items-center py-2.5"
            >
              <Feather name={tab.icon} size={22} color={color} />
              <Text
                className="text-[11px] mt-1"
                style={{ color, fontWeight: active ? "600" : "400" }}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
