import { Pressable, Text, View } from "react-native";
import type { UserRole } from "@/src/types/api";

const ROLES: { value: UserRole; label: string; icon: string }[] = [
  { value: "student", label: "Student", icon: "🎒" },
  { value: "warden", label: "Hostel staff", icon: "🛡️" },
];

/** Student / Hostel staff switch at the top of the login and register screens. */
export function RoleTabs({ value, onChange }: { value: UserRole; onChange: (role: UserRole) => void }) {
  return (
    <View className="flex-row bg-surface border border-border rounded-2xl p-1 mb-6">
      {ROLES.map((role) => {
        const active = role.value === value;
        return (
          <Pressable
            key={role.value}
            onPress={() => onChange(role.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            className={`flex-1 flex-row items-center justify-center py-3 rounded-xl ${active ? "bg-primary" : ""}`}
          >
            <Text className="mr-1.5">{role.icon}</Text>
            <Text className={`font-semibold ${active ? "text-white" : "text-muted"}`}>{role.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
