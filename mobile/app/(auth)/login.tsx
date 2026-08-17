import { View, Text, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Logo } from "@/components/ui/Logo";
import { colors } from "@/constants/theme";
import { demoSession } from "@/lib/demo/session";

const highlights = [
  { icon: "shield" as const, label: "Real-time Guardian Mode monitoring" },
  { icon: "bell" as const, label: "Instant incident alerts" },
  { icon: "award" as const, label: "XP, streaks and achievements" },
];

export default function Login() {
  return (
    <View className="flex-1 bg-background px-6 justify-center">
      <View className="items-center mb-8">
        <Logo size={84} />
        <Text className="text-foreground text-[22px] font-bold mt-4">Welcome to HosDost</Text>
        <Text className="text-muted text-[14px] mt-1.5 text-center">
          This build runs on local demo data — no account needed.
        </Text>
      </View>

      <Pressable className="bg-primary rounded-xl py-4 items-center" onPress={() => demoSession.signIn()}>
        <Text className="text-foreground font-semibold text-[15px]">Continue as Guest</Text>
      </Pressable>
      <Text className="text-muted text-[12px] text-center mt-3 mb-8">
        Backend features are simulated for this demo.
      </Text>

      <View className="gap-3">
        {highlights.map((item) => (
          <View key={item.label} className="flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-surface-alt border border-border items-center justify-center mr-3">
              <Feather name={item.icon} size={15} color={colors.primaryLight} />
            </View>
            <Text className="text-muted text-[14px] flex-1">{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
