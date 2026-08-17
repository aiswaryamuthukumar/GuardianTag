import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import { Logo } from "@/components/ui/Logo";
import { demoSession } from "@/lib/demo/session";

export default function Splash() {
  const scale = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => demoSession.markHydrated(), 1200);
    return () => clearTimeout(timer);
  }, [opacity, scale]);

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Animated.View style={{ opacity, transform: [{ scale }] }}>
        <Logo size={140} />
      </Animated.View>
    </View>
  );
}
