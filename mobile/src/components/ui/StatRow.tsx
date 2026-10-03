import { View } from "react-native";

export function StatRow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const items = Array.isArray(children) ? children : [children];
  return (
    <View className={`flex-row bg-surface border border-border rounded-2xl py-4 ${className}`}>
      {items.map((child, i) => (
        <View
          key={i}
          className={`flex-1 items-center px-2 ${i < items.length - 1 ? "border-r border-hairline" : ""}`}
        >
          {child}
        </View>
      ))}
    </View>
  );
}
