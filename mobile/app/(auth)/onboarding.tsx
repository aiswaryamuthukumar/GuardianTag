import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { colors } from "@/constants/theme";
import { Logo } from "@/components/ui/Logo";

const slides = [
  {
    title: "Guard what matters",
    body: "Arm your bag or laptop. Your sensor watches it for you.",
  },
  {
    title: "Instant alerts",
    body: "Movement sends you an alert right away.",
  },
  {
    title: "Stay motivated",
    body: "Earn XP and badges for staying safe.",
  },
];

export default function Onboarding() {
  const [index, setIndex] = useState(0);
  const isLast = index === slides.length - 1;
  const slide = slides[index];

  const next = () => {
    if (isLast) {
      router.push("/(auth)/login");
      return;
    }
    setIndex((i) => i + 1);
  };

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-4 pt-6" style={{ height: 56 }}>
        {index > 0 ? (
          <Pressable
            onPress={() => setIndex((i) => Math.max(0, i - 1))}
            hitSlop={8}
            className="w-10 h-10 rounded-full bg-surface-alt border border-border items-center justify-center"
          >
            <Feather name="arrow-left" size={20} color={colors.text} />
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
        <View style={{ width: 40 }} />
      </View>

      <View className="flex-1 px-8 items-center justify-center">
        <Logo size={96} />
        <Text className="text-foreground text-[24px] font-bold text-center mt-8 mb-3">{slide.title}</Text>
        <Text className="text-muted text-[15px] text-center leading-6">{slide.body}</Text>
      </View>

      <View className="px-8 pb-10">
        <View className="flex-row items-center justify-center mb-8 gap-2">
          {slides.map((s, i) => (
            <View
              key={s.title}
              className="h-1.5 rounded-full"
              style={{ width: i === index ? 22 : 8, backgroundColor: i === index ? colors.primary : colors.border }}
            />
          ))}
          <Text className="text-muted text-[12px] ml-2">
            {index + 1}/{slides.length}
          </Text>
        </View>
        <Pressable className="bg-primary rounded-xl py-4 items-center mb-3" onPress={next}>
          <Text className="text-foreground font-semibold text-[15px]">{isLast ? "Get Started" : "Next"}</Text>
        </Pressable>
        {!isLast ? (
          <Pressable className="py-2 items-center" onPress={() => router.push("/(auth)/login")}>
            <Text className="text-muted text-[14px]">Skip</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
