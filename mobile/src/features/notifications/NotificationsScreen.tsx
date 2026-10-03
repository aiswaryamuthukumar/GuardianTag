import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import type { Feather } from "@expo/vector-icons";
import { Badge } from "@/src/components/ui/Badge";
import { Card } from "@/src/components/ui/Card";
import { ListRow } from "@/src/components/ui/ListRow";
import { Segmented } from "@/src/components/ui/Form";
import { IconAvatar } from "@/src/components/ui/IconAvatar";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { ScreenHeader } from "@/src/components/ui/ScreenHeader";
import { EmptyState, ErrorState, LoadingState } from "@/src/components/ui/StateViews";
import { useMarkAllRead, useMarkRead, useNotices, useNotifications } from "@/src/features/notifications/api";
import { timeAgo } from "@/src/lib/format";
import { colors } from "@/src/theme";
import type { Notification, NotificationType } from "@/src/types/api";

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

type Filter = "all" | "unread" | "incident";

function NotificationRow({ notification }: { notification: Notification }) {
  const markRead = useMarkRead();
  const open = () => {
    if (!notification.is_read) markRead.mutate(notification.id);
    const data = notification.data ?? {};
    if (data.notice_id) router.push("/hostel-notices");
    else if (data.incident_id) router.push(`/incidents/${data.incident_id}`);
    else if (data.device_id) router.push(`/devices/${data.device_id}`);
    else if (data.asset_id) router.push(`/belongings/${data.asset_id}`);
    else if (notification.type === "achievement" || notification.type === "challenge") router.push("/rewards");
  };
  return (
    <Pressable onPress={open} accessibilityRole="button" className="flex-row items-start py-3.5 border-b border-hairline">
      <IconAvatar icon={iconFor[notification.type]} tone={toneFor[notification.type]} size={38} />
      <View className="flex-1 ml-3">
        <View className="flex-row items-center">
          {!notification.is_read ? <View className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: colors.primary }} /> : null}
          <Text
            className={`text-[15px] flex-1 ${notification.is_read ? "text-muted" : "text-foreground font-semibold"}`}
            numberOfLines={1}
          >
            {notification.title}
          </Text>
        </View>
        <Text className="text-muted text-[13px] mt-0.5">{notification.body}</Text>
        <Text className="text-muted text-[12px] mt-1">{timeAgo(notification.created_at)}</Text>
      </View>
    </Pressable>
  );
}

/** Alerts inbox: every notification the backend sent, arriving live, plus hostel notices. */
export default function NotificationsScreen() {
  const notifications = useNotifications();
  const notices = useNotices();
  const markAll = useMarkAllRead();
  const [filter, setFilter] = useState<Filter>("all");

  const all = notifications.data ?? [];
  const list = all.filter((n) => (filter === "unread" ? !n.is_read : filter === "incident" ? n.type === "incident" : true));
  const unread = all.filter((n) => !n.is_read).length;
  const unreadNotices = (notices.data ?? []).filter((n) => !n.is_read).length;

  return (
    <ScreenContainer onRefresh={() => { notifications.refetch(); notices.refetch(); }} refreshing={notifications.isRefetching}>
      <ScreenHeader
        title="Notifications"
        showBack
        subtitle={unread ? `${unread} unread` : "You're all caught up"}
        right={
          unread ? (
            <Pressable onPress={() => markAll.mutate()} className="p-2" accessibilityRole="button">
              <Text className="text-primary-light text-[13px] font-medium">Mark all read</Text>
            </Pressable>
          ) : undefined
        }
      />

      <Card className="py-1 mb-1">
        <ListRow
          icon="volume-2"
          title="Hostel notices"
          subtitle={
            unreadNotices ? `${unreadNotices} unread from your warden` : notices.data?.length ? "All read" : "Nothing from your warden yet"
          }
          right={unreadNotices ? <Badge label={String(unreadNotices)} tone="warning" /> : undefined}
          onPress={() => router.push("/hostel-notices")}
          showChevron
          isLast
        />
      </Card>

      <View className="mt-4 mb-1">
        <Segmented
          options={[
            { value: "all", label: "All" },
            { value: "unread", label: "Unread" },
            { value: "incident", label: "Security" },
          ]}
          value={filter}
          onChange={setFilter}
        />
      </View>

      {notifications.isLoading ? <LoadingState /> : null}
      {notifications.error ? <ErrorState message={notifications.error.message} onRetry={notifications.refetch} /> : null}
      {notifications.data && list.length === 0 ? (
        <EmptyState title="No notifications" message="Security alerts, device warnings and rewards show up here in real time." />
      ) : null}
      {list.map((n) => (
        <NotificationRow key={n.id} notification={n} />
      ))}
    </ScreenContainer>
  );
}
