import { View, Text } from "react-native";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Card } from "@/components/ui/Card";

const lessons = [
  {
    title: "Arm before you leave",
    body: "Only armed assets are protected. Arm your bag every time you step away.",
  },
  {
    title: "Know the disarm window",
    body: "You get a short window to disarm before an alert fires.",
  },
  {
    title: "False alarms are okay",
    body: "Marking a false alarm doesn't hurt your score.",
  },
  {
    title: "Keep devices charged",
    body: "Check Device Health before trips.",
  },
  {
    title: "Check the timeline",
    body: "Review the timeline and evidence before resolving a case.",
  },
];

export default function GuardianAcademy() {
  return (
    <ScreenContainer>
      <ScreenHeader title="Guardian Academy" showBack subtitle="Tips to stay safe" />

      <Card>
        {lessons.map((lesson, i) => (
          <View key={lesson.title} className={`py-3.5 ${i === lessons.length - 1 ? "" : "border-b border-hairline"}`}>
            <Text className="text-foreground dark:text-white font-medium text-[15px] mb-1">{lesson.title}</Text>
            <Text className="text-muted dark:text-[#8A8D98] text-[13px] leading-5">{lesson.body}</Text>
          </View>
        ))}
      </Card>
    </ScreenContainer>
  );
}
