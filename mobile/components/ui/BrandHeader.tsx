import { View, Text } from "react-native";
import { LogoMark } from "@/components/ui/LogoMark";

export function BrandHeader({ size = 34 }: { size?: number }) {
  return (
    <View className="flex-row items-center">
      <LogoMark size={size} />
      <Text className="text-foreground font-bold text-[18px] ml-2.5 tracking-tight">HosDost</Text>
    </View>
  );
}
