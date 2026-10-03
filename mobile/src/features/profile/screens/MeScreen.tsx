import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Badge } from "@/src/components/ui/Badge";
import { Card } from "@/src/components/ui/Card";
import { Avatar, SectionTitle } from "@/src/components/ui/Display";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { useMe } from "@/src/features/profile/api";
import { useLevel } from "@/src/features/rewards/api";
import { levelLabels } from "@/src/lib/format";

type Link = { icon: string; label: string; hint: string; href: string };

const STUDENT_LINKS: Link[] = [
  { icon: "📡", label: "Devices", hint: "Pairing, health & signal", href: "/devices" },
  { icon: "〰️", label: "Live activity", hint: "Raw sensor feed", href: "/activity" },
  { icon: "📈", label: "Analytics & reports", hint: "Trends, heatmap, PDF export", href: "/analytics" },
  { icon: "🏆", label: "Security score", hint: "XP, challenges, achievements", href: "/rewards" },
  { icon: "⚙️", label: "Settings", hint: "Profile, alerts, Telegram, password", href: "/settings" },
];

const WARDEN_LINKS: Link[] = [{ icon: "⚙️", label: "Settings", hint: "Profile, alerts, Telegram", href: "/settings" }];

function LinkRow({ link }: { link: Link }) {
  return (
    <Pressable
      onPress={() => router.push(link.href as never)}
      accessibilityRole="button"
      className="flex-row items-center py-3.5 border-b border-border/60"
    >
      <Text className="text-xl w-9">{link.icon}</Text>
      <View className="flex-1">
        <Text className="text-white font-medium">{link.label}</Text>
        <Text className="text-muted text-xs">{link.hint}</Text>
      </View>
      <Text className="text-muted text-lg">›</Text>
    </Pressable>
  );
}

export default function MeScreen() {
  const { data: me } = useMe();
  const level = useLevel();
  const warden = me?.role === "warden";

  return (
    <ScreenContainer>
      <View className="items-center pt-8 pb-4">
        <Avatar name={me?.full_name ?? ""} size={80} />
        <Text className="text-white text-2xl font-bold mt-3">{me?.full_name}</Text>
        <Text className="text-muted">{me?.email}</Text>
        <View className="flex-row gap-2 mt-3">
          <Badge label={warden ? "Warden" : "Student"} tone={warden ? "warning" : "primary"} />
          {me?.hostel_block ? <Badge label={`Block ${me.hostel_block}${me.room_number ? ` · ${me.room_number}` : ""}`} /> : null}
          {!warden && level.data ? <Badge label={levelLabels[level.data.level]} tone="safe" /> : null}
        </View>
      </View>

      <SectionTitle title={warden ? "Account" : "Everything else"} />
      <Card className="py-0">
        {(warden ? WARDEN_LINKS : STUDENT_LINKS).map((link) => (
          <LinkRow key={link.href} link={link} />
        ))}
      </Card>
    </ScreenContainer>
  );
}
