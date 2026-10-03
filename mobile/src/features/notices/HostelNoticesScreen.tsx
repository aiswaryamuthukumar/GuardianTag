import { useState } from "react";
import { Text, View } from "react-native";
import { LiveIndicator } from "@/src/components/ui/Display";
import { Segmented } from "@/src/components/ui/Form";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { ScreenHeader } from "@/src/components/ui/ScreenHeader";
import { EmptyState, ErrorState, LoadingState } from "@/src/components/ui/StateViews";
import { useMarkNoticeRead, useNotices } from "@/src/features/notifications/api";
import { NoticeCard } from "@/src/features/notices/NoticeCard";

/** Student view of hostel notices: new ones arrive live; opening one sends the warden a read receipt. */
export default function HostelNoticesScreen() {
  const notices = useNotices();
  const markRead = useMarkNoticeRead();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [open, setOpen] = useState<string | null>(null);

  const all = notices.data ?? [];
  const unread = all.filter((n) => !n.is_read).length;
  const list = filter === "unread" ? all.filter((n) => !n.is_read) : all;

  const onOpen = (id: string, isRead: boolean) => {
    setOpen((current) => (current === id ? null : id));
    if (!isRead) markRead.mutate(id);
  };

  return (
    <ScreenContainer onRefresh={notices.refetch} refreshing={notices.isRefetching}>
      <ScreenHeader
        title="Hostel notices"
        subtitle={unread ? `${unread} new from your warden` : "From your hostel wardens"}
        showBack
        right={<LiveIndicator />}
      />
      <View className="mb-4">
        <Segmented
          options={[
            { value: "all", label: `All (${all.length})` },
            { value: "unread", label: `Unread (${unread})` },
          ]}
          value={filter}
          onChange={setFilter}
        />
      </View>

      {notices.isLoading ? <LoadingState /> : null}
      {notices.error ? <ErrorState message={notices.error.message} onRetry={notices.refetch} /> : null}
      {notices.data && list.length === 0 ? (
        <EmptyState
          title={filter === "unread" ? "All caught up" : "No notices yet"}
          message="Notices from your warden appear here the moment they're sent."
        />
      ) : null}

      {list.map((notice) => (
        <NoticeCard
          key={notice.id}
          notice={notice}
          view="student"
          expanded={open === notice.id || notice.priority === "urgent"}
          onPress={() => onOpen(notice.id, notice.is_read)}
        />
      ))}
      {list.length ? <Text className="text-muted text-[12px] text-center mt-1">Tap a notice to read it in full.</Text> : null}
    </ScreenContainer>
  );
}
