import { Image } from "react-native";

export function Logo({ size = 36 }: { size?: number }) {
  return (
    <Image
      source={require("@/assets/logo.png")}
      style={{ width: size, height: size, resizeMode: "contain" }}
    />
  );
}
