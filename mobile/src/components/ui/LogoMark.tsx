import { Image } from "react-native";

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <Image
      source={require("@/assets/symbol.png")}
      style={{ width: size, height: size, resizeMode: "contain" }}
    />
  );
}
