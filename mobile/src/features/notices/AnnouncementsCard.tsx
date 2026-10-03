import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Badge } from "@/src/components/ui/Badge";
import { useMarkNoticeRead, useNotices } from "@/src/features/notifications/api";
import { timeAgo } from "@/src/lib/format";
import { colors, tint } from "@/src/theme";
import type { Notice } from "@/src/types/api";

function Row({ notice, isLast, onOpen }: { notice: Notice; isLast: boolean; onOpen: (n: Notice) => void }) {
  const urgent = notice.priority === "urgent";
  return (
    <Pressable
      onPress={() => onOpen(notice)}
      accessibilityRole="button"
      accessibilityLabel={`${urgent ? "Urgent notice" : "Notice"}: ${notice.title}${notice.is_read ? "" : ", unread"}`}
      className={`flex-row items-start py-3 ${isLast ? "" : "border-b border-hairline"}`}
    >
      <View
        className="w-8 h-8 rounded-full items-center justify-center mr-3 mt-0.5"
        style={{ backgroundColor: urgent ? tint(colors.emergency, 0.14) : notice.is_read ? colors.surfaceAlt : tint(colors.warning, 0.14) }}
      >
        <Feather name={urgent ? "alert-octagon" : "volume-2"} size={15} color={urgent ? colors.emergency : notice.is_read ? colors.muted : colors.warning} />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center">
          {!notice.is_read ? <View className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: colors.primary }} /> : null}
          <Text className={`flex-1 text-[14px] ${notice.is_read ? "text-foreground" : "text-foreground font-semibold"}`} numberOfLines={1}>
            {notice.title}
          </Text>
          {urgent ? <Badge label="Urgent" tone="emergency" /> : null}
        </View>
        <Text className="text-muted text-[13px] mt-0.5" numberOfLines={2}>
          {notice.body}
        </Text>
        <Text className="text-muted text-[11px] mt-1">
          {notice.author_name ?? "Hostel warden"} · {timeAgo(notice.created_at)}
        </Text>
      </View>
    </Pressable>
  );
}

/**
 * Latest hostel announcements, always on the student's Home. New ones slide in
 * live; tapping one marks it read (the warden sees the receipt) and opens the list.
 */
export function AnnouncementsCard({ limit = 3 }: { limit?: number }) {
  const notices = useNotices();
  const markRead = useMarkNoticeRead();
  const list = notices.data ?? [];
  const unread = list.filter((n) => !n.is_read).length;
  const hasUrgent = list.some((n) => n.priority === "urgent" && !n.is_read);

  const open = (n: Notice) => {
    if (!n.is_read) markRead.mutate(n.id);
    router.push("/hostel-notices");
  };

  return (
    <View
      className={`bg-surface border rounded-2xl px-4 pt-3.5 pb-1 mb-5 ${hasUrgent ? "border-emergency/60" : unread ? "border-warning/40" : "border-border"}`}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Feather name="volume-2" size={16} color={hasUrgent ? colors.emergency : colors.warning} />
          <Text className="text-foreground font-semibold text-[15px] ml-2">Hostel announcements</Text>
          {unread ? (
            <View className="ml-2">
              <Badge label={`${unread} new`} tone={hasUrgent ? "emergency" : "warning"} />
            </View>
          ) : null}
        </View>
        {list.length ? (
          <Pressable onPress={() => router.push("/hostel-notices")} hitSlop={8} accessibilityRole="button">
            <Text className="text-primary-light text-[13px] font-medium">See all</Text>
          </Pressable>
        ) : null}
      </View>

      {list.length ? (
        list.slice(0, limit).map((n, i, shown) => <Row key={n.id} notice={n} isLast={i === shown.length - 1} onOpen={open} />)
      ) : (
        <Text className="text-muted text-[13px] py-3">
          {notices.isLoading ? "Loading…" : "No announcements yet. Notices from your warden appear here instantly."}
        </Text>
      )}
    </View>
  );
}
