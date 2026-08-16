import { Linking, Text, View } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/hooks/useApi";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/StateViews";
import type { TelegramLinkCode, User } from "@/types/api";

export default function Settings() {
  const { signOut } = useAuth();
  const api = useApi();
  const queryClient = useQueryClient();

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
      <ScreenHeader title="Settings" showBack />

      <Card className="mb-4">
        <Text className="text-white font-semibold mb-1">Push notifications</Text>
        <Text className="text-muted text-xs">
          Enabled automatically once you grant notification permission — you'll get incident and
          achievement alerts on this device even when the app is closed.
        </Text>
      </Card>

      <Card className="mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-white font-semibold">Telegram emergency alerts</Text>
          <Badge label={isLinked ? "Linked" : "Not linked"} tone={isLinked ? "safe" : "muted"} />
        </View>
        <Text className="text-muted text-xs mb-3">
          {isLinked
            ? "Critical alerts are sent to your linked Telegram chat, independent of the app."
            : "Link a Telegram chat to also receive alerts there, even if push notifications fail."}
        </Text>
        {meQuery.isLoading ? (
          <LoadingState label="Checking status..." />
        ) : (
          <Button
            label={isLinked ? "Re-link Telegram" : "Link Telegram"}
            variant="secondary"
            onPress={() => linkMutation.mutate()}
            loading={linkMutation.isPending}
          />
        )}
        {linkMutation.isSuccess && linkMutation.data ? (
          <Text className="text-muted text-xs mt-2">
            Opened Telegram — if it didn't open, message the bot with: /start {linkMutation.data.link_code}
          </Text>
        ) : null}
      </Card>

      <Button label="Sign Out" variant="danger" onPress={() => signOut()} />
    </ScreenContainer>
  );
}
