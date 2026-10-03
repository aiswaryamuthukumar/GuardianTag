import { Pressable } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { colors } from "@/src/theme";

/** Round back (or close) button used in every screen header. Falls back to the app root with no history. */
export function BackButton({ icon = "arrow-left", onPress }: { icon?: "arrow-left" | "x"; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress ?? (() => (router.canGoBack() ? router.back() : router.replace("/")))}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={icon === "x" ? "Close" : "Go back"}
      className="w-10 h-10 rounded-full bg-surface-alt border border-border items-center justify-center"
    >
      <Feather name={icon} size={20} color={colors.text} />
    </Pressable>
  );
}
