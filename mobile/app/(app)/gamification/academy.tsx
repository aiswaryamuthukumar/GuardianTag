import { View, Text } from "react-native";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Card } from "@/components/ui/Card";

const lessons = [
  {
    title: "Arm before you leave",
    body: "Guardian Mode only protects assets you've explicitly armed. Get in the habit of arming your bag every time you step away.",
  },
  {
    title: "Understand the disarm window",
    body: "When your device detects movement, you get a short window to disarm before an alert fires. Moving your own bag? Disarm quickly from the device or the app.",
  },
  {
    title: "False alarms still matter",
    body: "Marking an alert as a false alarm helps keep your incident history accurate and doesn't count against you.",
  },
  {
    title: "Keep your device charged",
    body: "A dead sensor node can't protect anything. Check Device Health regularly, especially before trips.",
  },
  {
    title: "Review incidents together",
    body: "Use the Timeline and Evidence Board to understand exactly what happened before resolving a case.",
  },
];

export default function GuardianAcademy() {
  return (
    <ScreenContainer>
      <ScreenHeader title="Guardian Academy" showBack subtitle="Habits that keep you safe" />

      {lessons.map((lesson) => (
        <Card key={lesson.title} className="mb-3">
          <Text className="text-white font-semibold mb-1">{lesson.title}</Text>
          <Text className="text-muted">{lesson.body}</Text>
        </Card>
      ))}
    </ScreenContainer>
  );
}
