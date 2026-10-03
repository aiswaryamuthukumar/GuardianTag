import { Pressable, Text, ActivityIndicator } from "react-native";

export type ButtonVariant = "primary" | "danger" | "safe" | "secondary" | "ghost";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary",
  danger: "bg-emergency",
  safe: "bg-safe",
  secondary: "bg-surface-alt border border-border",
  ghost: "bg-transparent",
};

const textClasses: Record<ButtonVariant, string> = {
  primary: "text-white",
  danger: "text-white",
  safe: "text-white",
  secondary: "text-white",
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
  const padding = size === "sm" ? "py-2 px-3" : size === "lg" ? "py-4" : "py-3";
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      className={`rounded-xl items-center justify-center ${padding} ${variantClasses[variant]} ${isDisabled ? "opacity-50" : ""} ${className}`}
      style={({ pressed }) => ({ opacity: pressed && !isDisabled ? 0.8 : undefined })}
    >
      {loading ? (
        <ActivityIndicator color="white" />
      ) : (
        <Text className={`font-semibold ${size === "lg" ? "text-lg" : size === "sm" ? "text-sm" : ""} ${textClasses[variant]}`}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
