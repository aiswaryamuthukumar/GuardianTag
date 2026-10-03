import { Pressable, Text, ActivityIndicator } from "react-native";
import { colors } from "@/src/theme";

export type ButtonVariant = "primary" | "danger" | "safe" | "secondary" | "ghost";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary",
  danger: "bg-emergency",
  safe: "bg-safe",
  secondary: "bg-surface-alt border border-border",
  ghost: "bg-transparent",
};

// Dark text on the light teal fills keeps contrast readable.
const textClasses: Record<ButtonVariant, string> = {
  primary: "text-background",
  danger: "text-white",
  safe: "text-background",
  secondary: "text-foreground",
  ghost: "text-primary-light",
};

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const isDisabled = disabled || loading;
  const padding = size === "sm" ? "py-2 px-3" : size === "lg" ? "py-4" : "py-3.5";
  const textSize = size === "sm" ? "text-[13px]" : "text-[15px]";
  const spinner = variant === "primary" || variant === "safe" ? colors.background : colors.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      className={`rounded-xl items-center justify-center ${padding} ${variantClasses[variant]} ${isDisabled ? "opacity-40" : ""} ${className}`}
      style={({ pressed }) => ({ opacity: pressed && !isDisabled ? 0.8 : undefined })}
    >
      {loading ? (
        <ActivityIndicator color={spinner} />
      ) : (
        <Text className={`font-semibold ${textSize} ${textClasses[variant]}`}>{label}</Text>
      )}
    </Pressable>
  );
}
