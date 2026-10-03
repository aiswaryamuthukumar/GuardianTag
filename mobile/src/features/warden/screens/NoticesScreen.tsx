import { useState } from "react";
import { Alert, Text } from "react-native";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { SectionTitle } from "@/src/components/ui/Display";
import { TextField } from "@/src/components/ui/Form";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { ScreenHeader } from "@/src/components/ui/ScreenHeader";
import { EmptyState, LoadingState } from "@/src/components/ui/StateViews";
import { useNotices } from "@/src/features/notifications/api";
import { useMe } from "@/src/features/profile/api";
import { useSendNotice } from "@/src/features/warden/api";
import { timeAgo } from "@/src/lib/format";

/** Hostel notices: broadcast to every student in a block as push, Telegram and inbox. */
export default function NoticesScreen() {
  const { data: me } = useMe();
  const notices = useNotices();
  const send = useSendNotice();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [block, setBlock] = useState("");

  const target = block.trim().toUpperCase() || me?.hostel_block || null;

  const onSend = () =>
    Alert.alert("Send notice?", `This goes to every student in ${target ? `block ${target}` : "the whole hostel"}.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Send",
        onPress: () =>
          send.mutate(
            { title: title.trim(), body: body.trim(), hostel_block: block.trim().toUpperCase() || undefined },
            { onSuccess: () => { setTitle(""); setBody(""); } },
          ),
      },
    ]);

  return (
    <ScreenContainer onRefresh={notices.refetch} refreshing={notices.isRefetching}>
      <ScreenHeader title="Notices" subtitle="Broadcast to your students" />
      <Card>
        <TextField label="Title" placeholder="Room inspection at 6 pm" value={title} onChangeText={setTitle} maxLength={255} />
        <TextField label="Message" placeholder="Please keep lockers accessible…" value={body} onChangeText={setBody} multiline />
        <TextField
          label="Block"
          placeholder={me?.hostel_block ?? "Blank = whole hostel"}
          autoCapitalize="characters"
          value={block}
          onChangeText={setBlock}
        />
        {send.error ? <Text className="text-emergency mb-2">{send.error.message}</Text> : null}
        <Button label="Send notice" onPress={onSend} disabled={!title.trim() || !body.trim()} loading={send.isPending} />
      </Card>

      <SectionTitle title="Sent notices" />
      {notices.isLoading ? (
        <LoadingState />
      ) : notices.data?.length ? (
        notices.data.map((n) => (
          <Card key={n.id} className="mb-2">
            <Text className="text-white font-semibold">{n.title}</Text>
            <Text className="text-muted mt-1">{n.body}</Text>
            <Text className="text-muted text-xs mt-2">
              {n.hostel_block ? `Block ${n.hostel_block}` : "Whole hostel"} · {timeAgo(n.created_at)}
            </Text>
          </Card>
        ))
      ) : (
        <EmptyState title="No notices yet" />
      )}
    </ScreenContainer>
  );
}
