import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { LiveIndicator, SectionTitle } from "@/src/components/ui/Display";
import { Segmented } from "@/src/components/ui/Form";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { ScreenHeader } from "@/src/components/ui/ScreenHeader";
import { EmptyState, ErrorState, LoadingState } from "@/src/components/ui/StateViews";
import { useMarkAllRead, useMarkRead, useNotices, useNotifications } from "@/src/features/notifications/api";
import { timeAgo } from "@/src/lib/format";
import type { Notification, NotificationType } from "@/src/types/api";

const typeIcon: Record<NotificationType, string> = {
  incident: "🚨",
  achievement: "🏆",
  challenge: "🎯",
  device_health: "📡",
  system: "📢",
};

type Filter = "all" | "unread" | "incident";

function NotificationRow({ notification }: { notification: Notification }) {
  const markRead = useMarkRead();
  const open = () => {
    if (!notification.is_read) markRead.mutate(notification.id);
    const data = notification.data ?? {};
    if (data.incident_id) router.push(`/incidents/${data.incident_id}`);
    else if (data.device_id) router.push(`/devices/${data.device_id}`);
    else if (data.asset_id) router.push(`/assets/${data.asset_id}`);
    else if (notification.type === "achievement" || notification.type === "challenge") router.push("/rewards");
  };
  return (
    <Pressable
      onPress={open}
      accessibilityRole="button"
      className={`flex-row p-4 mb-2 rounded-2xl border ${notification.is_read ? "bg-surface border-border" : "bg-primary/10 border-primary/40"}`}
    >
      <Text className="text-xl mr-3">{typeIcon[notification.type]}</Text>
      <View className="flex-1">
        <View className="flex-row justify-between">
          <Text className="text-white font-semibold flex-1 pr-2" numberOfLines={1}>
            {notification.title}
          </Text>
          <Text className="text-muted text-xs">{timeAgo(notification.created_at)}</Text>
        </View>
        <Text className="text-muted text-sm mt-0.5">{notification.body}</Text>
      </View>
      {!notification.is_read ? <View className="w-2 h-2 rounded-full bg-primary ml-2 mt-1.5" /> : null}
    </Pressable>
  );
}

/** Alerts inbox: every notification the backend sent, arriving live, plus hostel notices. */
export default function NotificationsScreen() {
  const notifications = useNotifications();
  const notices = useNotices();
  const markAll = useMarkAllRead();
  const [filter, setFilter] = useState<Filter>("all");

  const list = (notifications.data ?? []).filter((n) =>
    filter === "unread" ? !n.is_read : filter === "incident" ? n.type === "incident" : true,
  );
  const unread = (notifications.data ?? []).filter((n) => !n.is_read).length;

  return (
    <ScreenContainer onRefresh={() => { notifications.refetch(); notices.refetch(); }} refreshing={notifications.isRefetching}>
      <ScreenHeader title="Alerts" subtitle={unread ? `${unread} unread` : "You're all caught up"} right={<LiveIndicator />} />

      {notices.data?.length ? (
        <>
          <SectionTitle title="Hostel notices" />
          {notices.data.slice(0, 2).map((notice) => (
            <Card key={notice.id} className="mb-2 border-warning/40">
              <Text className="text-warning font-semibold">📢 {notice.title}</Text>
              <Text className="text-white mt-1">{notice.body}</Text>
              <Text className="text-muted text-xs mt-1">
                {notice.hostel_block ? `Block ${notice.hostel_block}` : "Whole hostel"} · {timeAgo(notice.created_at)}
              </Text>
            </Card>
          ))}
        </>
      ) : null}

      <View className="flex-row items-center justify-between mt-4 mb-3">
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
      {unread ? <Button label="Mark all as read" variant="ghost" size="sm" onPress={() => markAll.mutate()} /> : null}

      {notifications.isLoading ? (
        <LoadingState />
      ) : notifications.error ? (
        <ErrorState message={notifications.error.message} onRetry={notifications.refetch} />
      ) : list.length ? (
        list.map((n) => <NotificationRow key={n.id} notification={n} />)
      ) : (
        <EmptyState title="No alerts" message="Security alerts, device warnings and rewards show up here in real time." />
      )}
    </ScreenContainer>
  );
}
