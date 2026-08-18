import { View, Text } from "react-native";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Card } from "@/components/ui/Card";
import { ListRow } from "@/components/ui/ListRow";
import { Logo } from "@/components/ui/Logo";

export default function About() {
  return (
    <ScreenContainer>
      <ScreenHeader title="About HosDost" showBack />
      <View className="items-center py-6 mb-4">
        <Logo size={72} />
        <Text className="text-foreground dark:text-white font-bold text-[18px] mt-4">HosDost</Text>
        <Text className="text-muted dark:text-[#8A8D98] text-[13px] mt-1">Version 1.0.0 (Demo build)</Text>
      </View>
      <Card>
        <ListRow icon="shield" title="Guardian Mode" subtitle="Arm and monitor your assets" />
        <ListRow icon="zap" title="Instant alerts" subtitle="Get notified right away" />
        <ListRow icon="award" title="Rewards" subtitle="XP, streaks and badges" isLast />
      </Card>
      <Text className="text-muted dark:text-[#8A8D98] text-[12px] text-center mt-6">
        Keeps your things safe in the hostel.
      </Text>
    </ScreenContainer>
  );
}
