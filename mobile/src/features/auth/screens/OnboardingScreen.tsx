import { Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/src/components/ui/Button";

const FEATURES = [
  { icon: "🧲", title: "Dual-sensor detection", body: "Motion and hall sensor must both trigger, so a bump never cries wolf." },
  { icon: "⚡", title: "Real-time alerts", body: "A live socket, push and Telegram reach you within a second." },
  { icon: "🛡️", title: "Warden backup", body: "Unanswered alerts escalate to your hostel warden automatically." },
];

export default function OnboardingScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6 justify-between py-10">
        <View className="items-center mt-6">
          <View className="w-20 h-20 rounded-3xl bg-primary/20 border border-primary/40 items-center justify-center mb-5">
            <Text className="text-4xl">🛡️</Text>
          </View>
          <Text className="text-4xl font-extrabold text-white mb-2">GuardianTag</Text>
          <Text className="text-muted text-center text-base">Object-level security for your hostel belongings.</Text>
        </View>

        <View>
          {FEATURES.map((f) => (
            <View key={f.title} className="flex-row bg-surface border border-border rounded-2xl p-4 mb-3">
              <Text className="text-2xl mr-3">{f.icon}</Text>
              <View className="flex-1">
                <Text className="text-white font-semibold">{f.title}</Text>
                <Text className="text-muted text-sm mt-0.5">{f.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <View>
          <Button label="Get started" size="lg" onPress={() => router.push("/(auth)/register")} />
          <Button label="I already have an account" variant="ghost" onPress={() => router.push("/(auth)/login")} />
          <Button
            label="Hostel staff sign in"
            variant="ghost"
            onPress={() => router.push({ pathname: "/(auth)/login", params: { role: "warden" } })}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
