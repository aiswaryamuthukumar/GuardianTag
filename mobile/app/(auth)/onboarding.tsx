import { useRef, useState } from "react";
import { View, Text, Pressable, ScrollView, NativeSyntheticEvent, NativeScrollEvent, Dimensions } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { colors } from "@/constants/theme";
import { Logo } from "@/components/ui/Logo";

const { width } = Dimensions.get("window");

const slides = [
  {
    icon: "shield" as const,
    title: "Guard what matters",
    body: "Arm your bag, laptop, or documents in seconds. Every sensor node watches over them around the clock.",
  },
  {
    icon: "bell" as const,
    title: "Instant alerts",
    body: "Unverified movement triggers an immediate alert with a live incident timeline, even while your phone sleeps.",
  },
  {
    icon: "trending-up" as const,
    title: "Stay motivated",
    body: "Earn XP, unlock achievements, and build a streak of good security habits over time.",
  },
];

export default function Onboarding() {
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const isLast = index === slides.length - 1;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  const next = () => {
    if (isLast) {
      router.push("/(auth)/login");
      return;
    }
    scrollRef.current?.scrollTo({ x: (index + 1) * width, animated: true });
  };

  return (
    <View className="flex-1 bg-background">
      <View className="items-center pt-6">
        <Logo size={40} />
      </View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
      >
        {slides.map((slide) => (
          <View key={slide.title} style={{ width }} className="px-8 items-center justify-center">
            <View
              className="w-24 h-24 rounded-3xl items-center justify-center mb-8"
              style={{ backgroundColor: "rgba(124,111,224,0.12)", borderWidth: 1.5, borderColor: "rgba(124,111,224,0.35)" }}
            >
              <Feather name={slide.icon} size={44} color={colors.primaryLight} />
            </View>
            <Text className="text-foreground dark:text-white text-[24px] font-bold text-center mb-3">{slide.title}</Text>
            <Text className="text-muted dark:text-[#8A8D98] text-[15px] text-center leading-6">{slide.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View className="px-8 pb-10">
        <View className="flex-row justify-center mb-8 gap-2">
          {slides.map((slide, i) => (
            <View
              key={slide.title}
              className="h-1.5 rounded-full"
              style={{ width: i === index ? 22 : 8, backgroundColor: i === index ? colors.primary : colors.border }}
            />
          ))}
        </View>
        <Pressable className="bg-primary rounded-xl py-4 items-center mb-3" onPress={next}>
          <Text className="text-foreground dark:text-white font-semibold text-[15px]">{isLast ? "Get Started" : "Next"}</Text>
        </Pressable>
        {!isLast ? (
          <Pressable className="py-2 items-center" onPress={() => router.push("/(auth)/login")}>
            <Text className="text-muted dark:text-[#8A8D98] text-[14px]">Skip</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
