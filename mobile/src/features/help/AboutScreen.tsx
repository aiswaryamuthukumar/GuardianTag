import { Text, View } from "react-native";
import Constants from "expo-constants";
import { Card } from "@/src/components/ui/Card";
import { ListRow } from "@/src/components/ui/ListRow";
import { Logo } from "@/src/components/ui/Logo";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { ScreenHeader } from "@/src/components/ui/ScreenHeader";
import { API_ORIGIN } from "@/src/lib/api/client";

export default function AboutScreen() {
  return (
    <ScreenContainer>
      <ScreenHeader title="About" showBack />
      <View className="items-center py-6 mb-4">
        <Logo size={72} />
        <Text className="text-muted text-[13px] mt-3">Version {Constants.expoConfig?.version ?? "1.0.0"}</Text>
      </View>
      <Card className="py-1">
        <ListRow icon="cpu" title="Sensor unit" subtitle="ESP32 · MPU6050 motion · Hall-effect opening sensor" />
        <ListRow icon="check-square" title="Dual verification" subtitle="Both sensors must trigger together to raise an alert" />
        <ListRow icon="zap" title="Real time" subtitle="FastAPI + PostgreSQL + WebSocket, push and Telegram" />
        <ListRow icon="users" title="Two roles" subtitle="Students guard belongings; hostel staff watch the whole block" />
        <ListRow icon="server" title="Connected to" subtitle={API_ORIGIN} isLast />
      </Card>
      <Text className="text-muted text-[12px] text-center mt-6">
        CS4504 Mobile Application Development PBL{"\n"}Chennai Institute of Technology
      </Text>
    </ScreenContainer>
  );
}
