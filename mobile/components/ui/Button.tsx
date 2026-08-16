import { Pressable, Text, ActivityIndicator } from "react-native";

export type ButtonVariant = "primary" | "danger" | "secondary" | "ghost";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary",
  danger: "bg-emergency",
  secondary: "bg-surface-alt border border-border",
  ghost: "bg-transparent",
};

const textClasses: Record<ButtonVariant, string> = {
  primary: "text-white",
  danger: "text-white",
  secondary: "text-white",
  ghost: "text-primary-light",
};

export function Button({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
}) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`rounded-xl py-3 items-center ${variantClasses[variant]} ${isDisabled ? "opacity-50" : ""}`}
    >
      {loading ? (
        <ActivityIndicator color="white" />
      ) : (
        <Text className={`font-semibold ${textClasses[variant]}`}>{label}</Text>
      )}
    </Pressable>
  );
}
