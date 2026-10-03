import { Text } from "react-native";
import { Card } from "@/src/components/ui/Card";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { ScreenHeader } from "@/src/components/ui/ScreenHeader";

const faqs = [
  {
    q: "How does Guardian Mode work?",
    a: "Arm a belonging linked to a device. When motion and opening happen together, the unit buzzes, gives you 3 seconds to cancel with its button, and reports the trigger. If anything on that device is armed, you get an alert within a second.",
  },
  {
    q: "Why didn't a trigger raise an alert?",
    a: "Everything linked to that device was disarmed, so the trigger was logged but ignored. You can still see it in Live activity, marked 'ignored'.",
  },
  {
    q: "What happens if I don't respond?",
    a: "After 30 seconds an open alert is escalated to HIGH and your hostel warden is notified. Tap 'I'm going to check' to stop the escalation.",
  },
  {
    q: "How do I report a false alarm?",
    a: "Press the device's button within 3 seconds, or tap 'It was me' on the alert. False alarms never lower your score.",
  },
  {
    q: "Can I arm things automatically?",
    a: "Yes. In Guardian, add a schedule, e.g. weekdays 09:00–17:00 while you're in class.",
  },
  {
    q: "How is my security score calculated?",
    a: "You earn XP for good habits only: daily check-ins, arming belongings, quick disarms and resolving cases. Setting off an alarm never earns XP.",
  },
  {
    q: "My device shows offline.",
    a: "It sends a heartbeat every minute; after 3 minutes of silence it's marked offline. Check its power and hostel Wi-Fi.",
  },
];

export default function HelpScreen() {
  return (
    <ScreenContainer>
      <ScreenHeader title="Help & FAQ" showBack subtitle="Common questions" />
      {faqs.map((item) => (
        <Card key={item.q} className="mb-3">
          <Text className="text-foreground font-semibold text-[15px] mb-1.5">{item.q}</Text>
          <Text className="text-muted text-[14px] leading-5">{item.a}</Text>
        </Card>
      ))}
      <Text className="text-muted text-[13px] text-center mt-2">Still stuck? Ask your hostel warden or message the GuardianTag bot on Telegram.</Text>
    </ScreenContainer>
  );
}
