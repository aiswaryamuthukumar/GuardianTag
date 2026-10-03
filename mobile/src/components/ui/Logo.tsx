import { Image, Text, View } from "react-native";
import { colors } from "@/src/theme";

/** Shield mark plus the two-tone GuardianTag wordmark. */
export function Logo({ size = 36, showWordmark = true }: { size?: number; showWordmark?: boolean }) {
  return (
    <View className="flex-row items-center" accessibilityRole="image" accessibilityLabel="GuardianTag">
      <Image source={require("@/assets/symbol.png")} style={{ width: size, height: size }} resizeMode="contain" />
      {showWordmark ? (
        <Text style={{ fontSize: size * 0.44, marginLeft: size * 0.08, fontWeight: "800", letterSpacing: -0.3 }}>
          <Text style={{ color: colors.text }}>Guardian</Text>
          <Text style={{ color: colors.primary }}>Tag</Text>
        </Text>
      ) : null}
    </View>
  );
}
