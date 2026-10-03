import { useEffect, useRef } from "react";
import { Animated } from "react-native";

export function PulseOnChange({ value, children }: { value: string | number; children: React.ReactNode }) {
  const anim = useRef(new Animated.Value(1)).current;
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current === value) return;
    prev.current = value;
    anim.setValue(1.3);
    Animated.spring(anim, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }).start();
  }, [value, anim]);

  return <Animated.View style={{ transform: [{ scale: anim }] }}>{children}</Animated.View>;
}
