import { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import type { Feather } from "@expo/vector-icons";
import { Badge } from "@/src/components/ui/Badge";
import { Card } from "@/src/components/ui/Card";
import { ConfirmSheet } from "@/src/components/ui/ConfirmSheet";
import { Avatar } from "@/src/components/ui/Display";
import { ListRow } from "@/src/components/ui/ListRow";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { ScreenHeader } from "@/src/components/ui/ScreenHeader";
import { StatRow } from "@/src/components/ui/StatRow";
import { StatTile } from "@/src/components/ui/StatTile";
import { useAssets } from "@/src/features/assets/api";
import { useDevices } from "@/src/features/devices/api";
import { useMe } from "@/src/features/profile/api";
import { useLevel } from "@/src/features/rewards/api";
import { useAuth } from "@/src/lib/auth/AuthProvider";
import { levelLabels } from "@/src/lib/format";

type Link = { icon: keyof typeof Feather.glyphMap; title: string; subtitle?: string; href: string };

const STUDENT_LINKS: Link[] = [
  { icon: "cpu", title: "Devices", subtitle: "Pairing, health & signal", href: "/devices" },
  { icon: "activity", title: "Live activity", subtitle: "Raw sensor feed", href: "/activity" },
  { icon: "bar-chart-2", title: "Analytics & reports", subtitle: "Trends, heatmap, PDF export", href: "/analytics" },
  { icon: "bell", title: "Notifications", href: "/notifications" },
  { icon: "volume-2", title: "Hostel notices", subtitle: "Announcements from your warden", href: "/hostel-notices" },
  { icon: "settings", title: "Settings", subtitle: "Profile, alerts, Telegram, password", href: "/settings" },
];

const SUPPORT_LINKS: Link[] = [
  { icon: "sliders", title: "Demo Controls", subtitle: "Act out device events without hardware", href: "/demo-controls" },
  { icon: "help-circle", title: "Help & FAQ", href: "/help" },
  { icon: "info", title: "About GuardianTag", href: "/about" },
];

function LinkCard({ links }: { links: Link[] }) {
  return (
    <Card className="mb-5 py-1">
      {links.map((link, i) => (
        <ListRow
          key={link.href}
          icon={link.icon}
          title={link.title}
          subtitle={link.subtitle}
          onPress={() => router.push(link.href as never)}
          showChevron
          isLast={i === links.length - 1}
        />
      ))}
    </Card>
  );
}

export default function MeScreen() {
  const { data: me } = useMe();
  const warden = me?.role === "warden";
  const level = useLevel();
  const assets = useAssets();
  const devices = useDevices();
  const { signOut } = useAuth();
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const armed = (assets.data ?? []).filter((a) => a.is_armed).length;

  return (
    <ScreenContainer>
      <ScreenHeader title={warden ? "Account" : "Profile"} subtitle="Your account" />

      <View className="items-center mb-5">
        <Avatar name={me?.full_name ?? ""} size={80} />
        <Text className="text-foreground font-bold text-[19px] mt-3">{me?.full_name}</Text>
        <Text className="text-muted text-[13px] mt-0.5">{me?.email}</Text>
        <View className="flex-row gap-2 mt-2">
          <Badge label={warden ? "Hostel staff" : "Student"} tone={warden ? "warning" : "primary"} />
          {me?.hostel_block ? (
            <Badge label={`Block ${me.hostel_block}${me.room_number ? ` · Room ${me.room_number}` : ""}`} />
          ) : null}
          {!warden && level.data ? <Badge label={levelLabels[level.data.level]} tone="safe" /> : null}
        </View>
      </View>

      {!warden ? (
        <>
          <StatRow className="mb-5">
            <StatTile label="XP" value={level.data?.score ?? 0} accent="text-primary-light" />
            <StatTile label="Protected" value={`${armed}/${assets.data?.length ?? 0}`} accent="text-safe-light" />
            <StatTile label="Devices" value={devices.data?.length ?? 0} />
          </StatRow>
          <LinkCard links={STUDENT_LINKS} />
        </>
      ) : (
        <LinkCard links={[{ icon: "settings", title: "Settings", subtitle: "Profile, alerts, Telegram, password", href: "/settings" }]} />
      )}

      <LinkCard links={warden ? SUPPORT_LINKS.slice(1) : SUPPORT_LINKS} />

      <Card className="py-1">
        <ListRow icon="log-out" title="Sign out" onPress={() => setConfirmSignOut(true)} tone="emergency" isLast />
      </Card>

      <ConfirmSheet
        visible={confirmSignOut}
        title="Sign out?"
        message="You'll stop receiving live alerts on this phone."
        confirmLabel="Sign out"
        onCancel={() => setConfirmSignOut(false)}
        onConfirm={() => {
          setConfirmSignOut(false);
          signOut();
        }}
      />
    </ScreenContainer>
  );
}
