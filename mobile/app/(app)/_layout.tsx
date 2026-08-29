import { View } from "react-native";
import { Stack } from "expo-router";
import { BottomNav } from "@/components/BottomNav";
import { colors } from "@/constants/theme";

export default function AppLayout() {
  return (
    <View className="flex-1 bg-background">
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen 
          name="home" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="incidents" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="incidents/[id]/index" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="incidents/[id]/timeline" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="incidents/[id]/evidence" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="incidents/[id]/resolution" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="assets/index" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="assets/[id]" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="device-pairing" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="device-health" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="guardian-mode" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="gamification/xp" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="gamification/achievements" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="gamification/challenges" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="gamification/academy" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="analytics" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="hostel-map" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="emergency-alert" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="profile" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="settings" 
          options={{ headerShown: false }} 
        />
      </Stack>
      <BottomNav />
    </View>
  );
}