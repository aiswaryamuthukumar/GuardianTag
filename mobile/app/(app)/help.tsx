import { View, Text } from "react-native";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Card } from "@/components/ui/Card";

const faqs = [
  {
    q: "How does Guardian Mode work?",
    a: "Arm an asset to start monitoring it. Movement raises an alert right away.",
  },
  {
    q: "What happens during a false alarm?",
    a: "Mark it false alarm from the case. It won't affect your score.",
  },
  {
    q: "Can I pair more than one device?",
    a: "Yes. Pair as many as you need from Home.",
  },
  {
    q: "How is my security score calculated?",
    a: "Based on how often you arm assets and how fast you resolve cases.",
  },
];

export default function Help() {
  return (
    <ScreenContainer>
      <ScreenHeader title="Help & FAQ" showBack subtitle="Common questions" />
      {faqs.map((item, i) => (
        <Card key={item.q} className={i === faqs.length - 1 ? "mb-2" : "mb-3"}>
          <Text className="text-foreground dark:text-white font-semibold text-[15px] mb-1.5">{item.q}</Text>
          <Text className="text-muted dark:text-[#8A8D98] text-[14px] leading-5">{item.a}</Text>
        </Card>
      ))}
      <View className="mt-2 mb-2">
        <Text className="text-muted dark:text-[#8A8D98] text-[13px] text-center">
          Still need help? Message us on Telegram.
        </Text>
      </View>
    </ScreenContainer>
  );
}
