import { useState } from "react";
import { Text, View } from "react-native";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { ConfirmSheet } from "@/src/components/ui/ConfirmSheet";
import { LiveIndicator, SectionTitle } from "@/src/components/ui/Display";
import { Segmented, TextField } from "@/src/components/ui/Form";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { ScreenHeader } from "@/src/components/ui/ScreenHeader";
import { EmptyState, ErrorState, LoadingState } from "@/src/components/ui/StateViews";
import { useNotices } from "@/src/features/notifications/api";
import { NoticeCard } from "@/src/features/notices/NoticeCard";
import { useMe } from "@/src/features/profile/api";
import { useDeleteNotice, useSendNotice } from "@/src/features/warden/api";
import { toastBus } from "@/src/lib/toast";
import type { Notice, NoticePriority } from "@/src/types/api";

/** Hostel notices: broadcast to students as push, Telegram and inbox, with live read receipts. */
export default function NoticesScreen() {
  const { data: me } = useMe();
  const notices = useNotices();
  const send = useSendNotice();
  const remove = useDeleteNotice();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [block, setBlock] = useState("");
  const [priority, setPriority] = useState<NoticePriority>("normal");
  const [confirmSend, setConfirmSend] = useState(false);
  const [toDelete, setToDelete] = useState<Notice | null>(null);

  const lockedBlock = me?.hostel_block ?? null; // block wardens can only message their own block
  const target = lockedBlock ?? (block.trim().toUpperCase() || null);
  const audience = target ? `every student in block ${target}` : "every student in the hostel";

  const doSend = () => {
    setConfirmSend(false);
    send.mutate(
      { title: title.trim(), body: body.trim(), hostel_block: target ?? undefined, priority },
      {
        onSuccess: (notice) => {
          setTitle("");
          setBody("");
          setPriority("normal");
          toastBus.show({
            icon: "send",
            title: "Notice sent",
            subtitle: `Delivered to ${notice.recipients} student${notice.recipients === 1 ? "" : "s"}`,
            tone: "safe",
          });
        },
      },
    );
  };

  return (
    <ScreenContainer onRefresh={notices.refetch} refreshing={notices.isRefetching}>
      <ScreenHeader title="Notices" subtitle="Broadcast to your students" right={<LiveIndicator />} />

      <Card>
        <TextField label="Title" placeholder="Room inspection at 6 pm" value={title} onChangeText={setTitle} maxLength={255} />
        <TextField
          label="Message"
          placeholder="Please keep lockers accessible…"
          value={body}
          onChangeText={setBody}
          multiline
          style={{ minHeight: 90, textAlignVertical: "top" }}
        />
        {lockedBlock ? (
          <Text className="text-muted text-[13px] mb-3">Sending to block {lockedBlock}</Text>
        ) : (
          <TextField
            label="Block (leave empty for the whole hostel)"
            placeholder="e.g. A"
            autoCapitalize="characters"
            value={block}
            onChangeText={setBlock}
          />
        )}
        <Text className="text-muted text-[13px] mb-1.5">Priority</Text>
        <View className="mb-4">
          <Segmented
            options={[
              { value: "normal", label: "Normal" },
              { value: "urgent", label: "Urgent (vibrates, ignores quiet hours)" },
            ]}
            value={priority}
            onChange={setPriority}
          />
        </View>
        {send.error ? <Text className="text-emergency text-[13px] mb-2">{send.error.message}</Text> : null}
        <Button
          label={priority === "urgent" ? "Send urgent notice" : "Send notice"}
          variant={priority === "urgent" ? "danger" : "primary"}
          onPress={() => setConfirmSend(true)}
          disabled={!title.trim() || !body.trim()}
          loading={send.isPending}
        />
      </Card>

      <SectionTitle title="Sent notices" />
      {notices.isLoading ? <LoadingState /> : null}
      {notices.error ? <ErrorState message={notices.error.message} onRetry={notices.refetch} /> : null}
      {notices.data?.length === 0 ? <EmptyState title="No notices yet" message="Read receipts update live as students open them." /> : null}
      {notices.data?.map((n) => (
        <NoticeCard key={n.id} notice={n} view="warden" onDelete={() => setToDelete(n)} />
      ))}

      <ConfirmSheet
        visible={confirmSend}
        title={priority === "urgent" ? "Send urgent notice?" : "Send notice?"}
        message={`"${title.trim()}" goes to ${audience} as a push, Telegram and in-app notice.`}
        confirmLabel="Send"
        destructive={priority === "urgent"}
        onCancel={() => setConfirmSend(false)}
        onConfirm={doSend}
      />
      <ConfirmSheet
        visible={!!toDelete}
        title="Withdraw this notice?"
        message="It will disappear from every student's notices and inbox."
        confirmLabel="Withdraw"
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) remove.mutate(toDelete.id);
          setToDelete(null);
        }}
      />
    </ScreenContainer>
  );
}
