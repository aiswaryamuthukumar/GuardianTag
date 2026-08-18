import { useState } from "react";
import { Linking, Text, View, Switch } from "react-native";
import { router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/hooks/useApi";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Card } from "@/components/ui/Card";
import { ListRow } from "@/components/ui/ListRow";
import { Badge } from "@/components/ui/Badge";
import { colors } from "@/constants/theme";
import type { TelegramLinkCode, User } from "@/types/api";

function SectionLabel({ label }: { label: string }) {
  return <Text className="text-muted text-[12px] font-medium uppercase tracking-wide mb-2 ml-1">{label}</Text>;
}

export default function Settings() {
  const api = useApi();
  const queryClient = useQueryClient();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const meQuery = useQuery({ queryKey: ["me"], queryFn: () => api.get<User>("/auth/me") });

  const linkMutation = useMutation({
    mutationFn: () => api.post<TelegramLinkCode>("/auth/telegram/link-code"),
    onSuccess: async (result) => {
      if (result.deep_link) {
        await Linking.openURL(result.deep_link);
      }
    },
  });

  const isLinked = !!meQuery.data?.telegram_chat_id;

  return (
    <ScreenContainer onRefresh={() => queryClient.invalidateQueries({ queryKey: ["me"] })}>
      <ScreenHeader title="Settings" showBack subtitle="Alerts and app options" />

      <SectionLabel label="Notifications" />
      <Card className="mb-6">
        <ListRow
          icon="bell"
          title="Push notifications"
          subtitle="Incident and achievement alerts"
          right={<Switch value={pushEnabled} onValueChange={setPushEnabled} trackColor={{ false: colors.surfaceAlt, true: colors.primary }} thumbColor="#FFFFFF" />}
        />
        <ListRow
          icon="volume-2"
          title="Sound & alerts"
          subtitle="Play a sound for critical incidents"
          right={<Switch value={soundEnabled} onValueChange={setSoundEnabled} trackColor={{ false: colors.surfaceAlt, true: colors.primary }} thumbColor="#FFFFFF" />}
          isLast
        />
      </Card>

      <SectionLabel label="Emergency contacts" />
      <Card className="mb-2">
        <ListRow
          icon="send"
          title="Telegram alerts"
          subtitle={isLinked ? "Linked to your account" : "Not linked yet"}
          right={<Badge label={isLinked ? "Linked" : "Not linked"} tone={isLinked ? "safe" : "muted"} />}
          onPress={() => linkMutation.mutate()}
          showChevron
          isLast
        />
      </Card>
      {linkMutation.isSuccess && linkMutation.data ? (
        <Text className="text-muted text-[12px] mb-6 px-1">
          Opened Telegram. Or send /start {linkMutation.data.link_code} to the bot.
        </Text>
      ) : (
        <View className="mb-6" />
      )}

      <SectionLabel label="Support" />
      <Card className="mb-6">
        <ListRow icon="help-circle" title="Help & FAQ" onPress={() => router.push("/(app)/help")} showChevron />
        <ListRow icon="info" title="About HosDost" onPress={() => router.push("/(app)/about")} showChevron isLast />
      </Card>

      <SectionLabel label="Demo" />
      <Card>
        <ListRow icon="sliders" title="Demo Controls" subtitle="Trigger live demo actions" onPress={() => router.push("/(app)/demo-controls")} showChevron isLast />
      </Card>
    </ScreenContainer>
  );
}
