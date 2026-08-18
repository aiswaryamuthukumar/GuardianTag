import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors } from "@/constants/theme";

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        backgroundColor: "rgba(105,215,184,0.14)",
        borderWidth: 1,
        borderColor: "rgba(105,215,184,0.35)",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Feather name="shield" size={size * 0.55} color={colors.primaryLight} />
    </View>
  );
}
