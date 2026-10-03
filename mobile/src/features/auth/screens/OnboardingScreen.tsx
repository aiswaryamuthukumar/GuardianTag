import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Button } from "@/src/components/ui/Button";
import { Logo } from "@/src/components/ui/Logo";
import { markOnboardingSeen } from "@/src/lib/onboarding";
import { colors } from "@/src/theme";

const slides = [
  { icon: "shield" as const, title: "Guard what matters", body: "Attach GuardianTag to your bag, locker or laptop and arm it from your phone." },
  { icon: "zap" as const, title: "Instant, verified alerts", body: "Movement and opening must happen together, so a bump never cries wolf. Real alerts reach you in a second." },
  { icon: "users" as const, title: "Your warden has your back", body: "If nobody answers an alert, it escalates to your hostel warden automatically." },
  { icon: "award" as const, title: "Stay motivated", body: "Earn XP, streaks and badges for good security habits." },
];

export default function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const isLast = index === slides.length - 1;
  const slide = slides[index];

  // Shown once per install: finishing or skipping goes to sign in and never returns here.
  const finish = async () => {
    await markOnboardingSeen();
    router.replace("/(auth)/login");
  };
  const next = () => (isLast ? finish() : setIndex((i) => i + 1));

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-4 pt-2" style={{ height: 56 }}>
        {index > 0 ? (
          <Pressable
            onPress={() => setIndex((i) => Math.max(0, i - 1))}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Previous"
            className="w-10 h-10 rounded-full bg-surface-alt border border-border items-center justify-center"
          >
            <Feather name="arrow-left" size={20} color={colors.text} />
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
        {!isLast ? (
          <Pressable onPress={finish} hitSlop={8} accessibilityRole="button">
            <Text className="text-muted text-[14px]">Skip</Text>
          </Pressable>
        ) : null}
      </View>

      <View className="flex-1 px-8 items-center justify-center">
        {index === 0 ? (
          <Logo size={96} showWordmark={false} />
        ) : (
          <View className="w-24 h-24 rounded-full bg-surface border border-border items-center justify-center">
            <Feather name={slide.icon} size={40} color={colors.primary} />
          </View>
        )}
        {index === 0 ? (
          <Text className="text-[30px] font-extrabold mt-5">
            <Text className="text-foreground">Guardian</Text>
            <Text className="text-primary">Tag</Text>
          </Text>
        ) : null}
        <Text className="text-foreground text-[24px] font-bold text-center mt-6 mb-3">{slide.title}</Text>
        <Text className="text-muted text-[15px] text-center leading-6">{slide.body}</Text>
      </View>

      <View className="px-8 pb-8">
        <View className="flex-row items-center justify-center mb-8 gap-2">
          {slides.map((s, i) => (
            <View
              key={s.title}
              className="h-1.5 rounded-full"
              style={{ width: i === index ? 22 : 8, backgroundColor: i === index ? colors.primary : colors.border }}
            />
          ))}
        </View>
        <Button label={isLast ? "Get started" : "Next"} size="lg" onPress={next} />
      </View>
    </SafeAreaView>
  );
}
