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
        <ListRow icon="shield" title="Smart Security" subtitle="Sensor-backed asset monitoring" />
        <ListRow icon="zap" title="Instant Alerts" subtitle="Real-time incident detection" />
        <ListRow icon="award" title="Guardian Rewards" subtitle="XP, streaks and achievements" isLast />
      </Card>
      <Text className="text-muted dark:text-[#8A8D98] text-[12px] text-center mt-6">
        Built for hostel residents to keep their belongings safe.
      </Text>
    </ScreenContainer>
  );
}
