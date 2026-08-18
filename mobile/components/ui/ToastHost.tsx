import { useEffect, useRef, useState } from "react";
import { Animated, Text, Vibration, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors } from "@/constants/theme";
import { toastBus, type ToastData, type ToastTone } from "@/lib/demo/toast";

const toneColor: Record<ToastTone, string> = {
  primary: colors.primary,
  safe: colors.safe,
  emergency: colors.emergency,
  warning: colors.warning,
};

export function ToastHost() {
  const [toast, setToast] = useState<ToastData | null>(null);
  const anim = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = toastBus.subscribe((next) => {
      if (timer.current) clearTimeout(timer.current);
      setToast(next);
      if (next.tone === "emergency") Vibration.vibrate(120);
      anim.setValue(0);
      Animated.spring(anim, { toValue: 1, friction: 8, tension: 90, useNativeDriver: true }).start();
      timer.current = setTimeout(() => {
        Animated.timing(anim, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => setToast(null));
      }, 1800);
    });
    return () => {
      unsubscribe();
    };
  }, [anim]);

  if (!toast) return null;
  const color = toneColor[toast.tone];

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 56,
        left: 16,
        right: 16,
        opacity: anim,
        transform: [
          { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) },
          { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
        ],
        zIndex: 999,
      }}
    >
      <View
        className="flex-row items-center bg-surface border rounded-2xl px-4 py-3"
        style={{ borderColor: color, shadowColor: color, shadowOpacity: 0.35, shadowRadius: 14, elevation: 8 }}
      >
        <View
          className="w-9 h-9 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: `${color}29` }}
        >
          <Feather name={toast.icon} size={17} color={color} />
        </View>
        <View className="flex-1">
          <Text className="text-foreground font-semibold text-[14px]">{toast.title}</Text>
          {toast.subtitle ? <Text className="text-muted text-[12px] mt-0.5">{toast.subtitle}</Text> : null}
        </View>
      </View>
    </Animated.View>
  );
}
