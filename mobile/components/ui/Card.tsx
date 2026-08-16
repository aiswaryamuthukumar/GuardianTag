import { View, Pressable, type ViewProps } from "react-native";

export function Card({ children, className = "", ...rest }: ViewProps & { className?: string }) {
  return (
    <View
      className={`bg-surface border border-border rounded-2xl p-4 ${className}`}
      {...rest}
    >
      {children}
    </View>
  );
}

export function PressableCard({
  children,
  onPress,
  className = "",
}: {
  children: React.ReactNode;
  onPress: () => void;
  className?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`bg-surface border border-border rounded-2xl p-4 ${className}`}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      {children}
    </Pressable>
  );
}
