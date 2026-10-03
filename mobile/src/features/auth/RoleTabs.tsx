import { Pressable, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors } from "@/src/theme";
import type { UserRole } from "@/src/types/api";

const ROLES: { value: UserRole; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { value: "student", label: "Student", icon: "user" },
  { value: "warden", label: "Hostel staff", icon: "shield" },
];

/** Student / Hostel staff switch at the top of the login and register screens. */
export function RoleTabs({ value, onChange }: { value: UserRole; onChange: (role: UserRole) => void }) {
  return (
    <View className="flex-row bg-surface border border-border rounded-xl p-1 mb-5">
      {ROLES.map((role) => {
        const active = role.value === value;
        return (
          <Pressable
            key={role.value}
            onPress={() => onChange(role.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            className={`flex-1 flex-row items-center justify-center py-2.5 rounded-lg ${active ? "bg-primary" : ""}`}
          >
            <Feather name={role.icon} size={15} color={active ? colors.background : colors.muted} style={{ marginRight: 6 }} />
            <Text className={`font-semibold text-[14px] ${active ? "text-background" : "text-muted"}`}>{role.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
