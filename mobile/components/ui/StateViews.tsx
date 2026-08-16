import { View, Text, ActivityIndicator } from "react-native";
import { colors } from "@/constants/theme";
import { Button } from "@/components/ui/Button";

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <View className="items-center justify-center py-16">
      <ActivityIndicator color={colors.primary} size="large" />
      <Text className="text-muted mt-3">{label}</Text>
    </View>
  );
}

export function ErrorState({
  message = "Something went wrong.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <View className="items-center justify-center py-16 px-4">
      <Text className="text-emergency font-semibold text-center mb-1">Couldn&apos;t load this</Text>
      <Text className="text-muted text-center mb-4">{message}</Text>
      {onRetry ? (
        <View className="w-40">
          <Button label="Retry" onPress={onRetry} variant="secondary" />
        </View>
      ) : null}
    </View>
  );
}

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View className="items-center justify-center py-16 px-4">
      <Text className="text-white font-semibold text-center mb-1">{title}</Text>
      {message ? <Text className="text-muted text-center mb-4">{message}</Text> : null}
      {actionLabel && onAction ? (
        <View className="w-48">
          <Button label={actionLabel} onPress={onAction} variant="secondary" />
        </View>
      ) : null}
    </View>
  );
}
