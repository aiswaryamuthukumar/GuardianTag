import { View } from "react-native";
import { Stack } from "expo-router";
import { BottomTabBar } from "@/components/BottomTabBar";

export default function AppLayout() {
  return (
    <View className="flex-1">
      <Stack screenOptions={{ headerShown: false }} />
      <BottomTabBar />
    </View>
  );
}
