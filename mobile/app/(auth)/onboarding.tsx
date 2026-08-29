import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";

export default function Onboarding() {
  return (
    <View className="flex-1 bg-background px-6 justify-between py-16">
      <View />
      <View className="items-center">
        <Text className="text-4xl font-extrabold text-primary mb-3">GuardianTag</Text>
        <Text className="text-white text-lg text-center mb-2">
          Your bags, guarded around the clock.
        </Text>
        <Text className="text-muted text-center">
          Movement and hall-sensor detection, instant alerts, and a live incident timeline —
          even when your phone is asleep.
        </Text>
      </View>
      <View>
        <Pressable
          className="bg-primary rounded-xl py-3 items-center mb-3"
          onPress={() => router.push("/(auth)/register")}
        >
          <Text className="text-white font-semibold">Get Started</Text>
        </Pressable>
        <Pressable className="py-3 items-center" onPress={() => router.push("/(auth)/login")}>
          <Text className="text-primary-light">I already have an account</Text>
        </Pressable>
      </View>
    </View>
  );
}
