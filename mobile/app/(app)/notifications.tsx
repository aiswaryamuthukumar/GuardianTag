import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { useApi } from "@/hooks/useApi";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { IconAvatar } from "@/components/ui/IconAvatar";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/StateViews";
import { colors } from "@/constants/theme";
import type { Notification, NotificationType } from "@/types/api";

const iconFor: Record<NotificationType, keyof typeof Feather.glyphMap> = {
  incident: "alert-triangle",
  achievement: "award",
  challenge: "target",
  device_health: "cpu",
  system: "info",
};

const toneFor: Record<NotificationType, "primary" | "safe" | "warning" | "emergency" | "muted"> = {
  incident: "emergency",
  achievement: "primary",
  challenge: "primary",
  device_health: "warning",
  system: "muted",
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function Notifications() {
  const api = useApi();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get<Notification[]>("/notifications"),
  });

  const readMutation = useMutation({
    mutationFn: (id: string) => api.patch<Notification>(`/notifications/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const readAllMutation = useMutation({
    mutationFn: () => api.post<Notification[]>("/notifications/read-all"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unreadCount = (query.data ?? []).filter((n) => !n.is_read).length;

  const openNotification = (n: Notification) => {
    if (!n.is_read) readMutation.mutate(n.id);
    const incidentId = n.data?.incident_id as string | undefined;
    if (n.type === "incident" && incidentId) {
      router.push(`/(app)/incidents/${incidentId}`);
    }
  };

  return (
    <ScreenContainer onRefresh={() => query.refetch()} refreshing={query.isRefetching}>
      <ScreenHeader
        title="Notifications"
        showBack
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
        right={
          unreadCount > 0 ? (
            <Pressable onPress={() => readAllMutation.mutate()} className="p-2">
              <Text className="text-primary-light text-[13px] font-medium">Mark all read</Text>
            </Pressable>
          ) : undefined
        }
      />

      {query.isLoading ? <LoadingState /> : null}
      {query.error ? <ErrorState message={(query.error as Error).message} onRetry={() => query.refetch()} /> : null}
      {query.data && query.data.length === 0 ? (
        <EmptyState title="No notifications" message="Alerts and updates will show up here." />
      ) : null}

      {query.data?.map((n) => (
        <Pressable
          key={n.id}
          onPress={() => openNotification(n)}
          className="flex-row items-start py-3.5 border-b border-hairline dark:border-[#2C2E36]"
        >
          <IconAvatar icon={iconFor[n.type]} tone={toneFor[n.type]} size={38} />
          <View className="flex-1 ml-3">
            <View className="flex-row items-center">
              {!n.is_read ? <View className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: colors.primary }} /> : null}
              <Text className={`text-[15px] flex-1 ${n.is_read ? "text-muted dark:text-[#8A8D98]" : "text-foreground dark:text-white font-semibold"}`}>
                {n.title}
              </Text>
            </View>
            <Text className="text-muted dark:text-[#8A8D98] text-[13px] mt-0.5">{n.body}</Text>
            <Text className="text-muted dark:text-[#8A8D98] text-[12px] mt-1">{timeAgo(n.created_at)}</Text>
          </View>
        </Pressable>
      ))}
    </ScreenContainer>
  );
}
