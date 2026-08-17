import { View, Text } from "react-native";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Card } from "@/components/ui/Card";

const faqs = [
  {
    q: "How does Guardian Mode work?",
    a: "Arm an asset from Guardian to start monitoring it. If its paired sensor node detects unverified movement, an incident is raised and you're alerted immediately.",
  },
  {
    q: "What happens during a false alarm?",
    a: "Open the incident from Cases and mark it as a false alarm. It's logged in your history but doesn't affect your security score.",
  },
  {
    q: "Can I pair more than one device?",
    a: "Yes — pair as many sensor nodes as you have from Home → Pair device. Each one can be linked to a different asset.",
  },
  {
    q: "How is my security score calculated?",
    a: "It factors in how consistently you arm your assets, how quickly you resolve incidents, and your day-to-day streak.",
  },
];

export default function Help() {
  return (
    <ScreenContainer>
      <ScreenHeader title="Help & FAQ" showBack subtitle="Common questions about HosDost" />
      {faqs.map((item, i) => (
        <Card key={item.q} className={i === faqs.length - 1 ? "mb-2" : "mb-3"}>
          <Text className="text-foreground dark:text-white font-semibold text-[15px] mb-1.5">{item.q}</Text>
          <Text className="text-muted dark:text-[#8A8D98] text-[14px] leading-5">{item.a}</Text>
        </Card>
      ))}
      <View className="mt-2 mb-2">
        <Text className="text-muted dark:text-[#8A8D98] text-[13px] text-center">
          Still need help? Reach out via the Telegram bot linked in Settings.
        </Text>
      </View>
    </ScreenContainer>
  );
}
