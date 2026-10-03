import { useState } from "react";
import { Image, Text, View } from "react-native";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { KeyValue, LiveIndicator } from "@/src/components/ui/Display";
import { Segmented, TextField } from "@/src/components/ui/Form";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { ScreenHeader } from "@/src/components/ui/ScreenHeader";
import { ErrorState, LoadingState } from "@/src/components/ui/StateViews";
import { usePickAndUpload } from "@/src/features/assets/PhotoPicker";
import { IncidentBadges } from "@/src/features/incidents/components/IncidentCard";
import { useAcknowledge, useAddEvidence, useAddNote, useIncident, useResolve } from "@/src/features/incidents/api";
import { useMe } from "@/src/features/profile/api";
import { fileUrl } from "@/src/lib/api/client";
import { formatDateTime, formatDuration } from "@/src/lib/format";
import type { IncidentDetail, TimelineActor } from "@/src/types/api";

type Tab = "timeline" | "evidence" | "resolve";

const actorDot: Record<TimelineActor, string> = { system: "bg-primary", device: "bg-warning", user: "bg-safe" };

function Timeline({ incident }: { incident: IncidentDetail }) {
  const addNote = useAddNote(incident.id);
  const [note, setNote] = useState("");
  return (
    <View>
      <Card>
        {incident.timeline_events.map((event, i) => (
          <View key={event.id} className="flex-row">
            <View className="items-center mr-3">
              <View className={`w-3 h-3 rounded-full mt-1 ${actorDot[event.actor]}`} />
              {i < incident.timeline_events.length - 1 ? <View className="w-px flex-1 bg-border my-1" /> : null}
            </View>
            <View className="flex-1 pb-4">
              <Text className="text-foreground">{event.description}</Text>
              <Text className="text-muted text-xs mt-0.5">
                {formatDateTime(event.occurred_at)} · {event.event_metadata?.author ? String(event.event_metadata.author) : event.actor}
              </Text>
            </View>
          </View>
        ))}
      </Card>
      <View className="mt-4">
        <TextField label="Add a note" placeholder="What did you find?" value={note} onChangeText={setNote} multiline />
        <Button
          label="Post note"
          variant="secondary"
          disabled={!note.trim()}
          loading={addNote.isPending}
          onPress={() => addNote.mutate(note.trim(), { onSuccess: () => setNote("") })}
        />
      </View>
    </View>
  );
}

function EvidenceTab({ incident }: { incident: IncidentDetail }) {
  const addEvidence = useAddEvidence(incident.id);
  const { pick, uploading, sheet } = usePickAndUpload();
  const [text, setText] = useState("");
  return (
    <View>
      {incident.evidence_items.length ? (
        incident.evidence_items.map((item) => (
          <Card key={item.id} className="mb-2">
            {item.type === "photo" && item.url ? (
              <Image source={{ uri: fileUrl(item.url) }} className="w-full h-48 rounded-xl mb-2" resizeMode="cover" />
            ) : null}
            {item.content ? <Text className="text-foreground">{item.content}</Text> : null}
            <Text className="text-muted text-xs mt-1">
              {item.type.replace("_", " ")} · {formatDateTime(item.captured_at)}
            </Text>
          </Card>
        ))
      ) : (
        <Text className="text-muted mb-3">No evidence yet. Photograph the belonging or note what's missing.</Text>
      )}
      <View className="mt-3">
        <Button
          label="Add photo evidence"
          variant="secondary"
          loading={uploading || (addEvidence.isPending && addEvidence.variables?.type === "photo")}
          onPress={() => pick((url) => addEvidence.mutate({ type: "photo", url }))}
        />
        <View className="mt-4">
          <TextField label="Written evidence" placeholder="e.g. Charger missing from front pocket" value={text} onChangeText={setText} multiline />
          <Button
            label="Add note evidence"
            variant="secondary"
            disabled={!text.trim()}
            onPress={() => addEvidence.mutate({ type: "note", content: text.trim() }, { onSuccess: () => setText("") })}
          />
        </View>
      </View>
      {sheet}
    </View>
  );
}

function ResolveTab({ incident }: { incident: IncidentDetail }) {
  const resolve = useResolve(incident.id);
  const [verdict, setVerdict] = useState<"resolved" | "false_alarm">("false_alarm");
  const [notes, setNotes] = useState("");
  const closed = incident.status === "resolved" || incident.status === "false_alarm";

  if (closed) {
    return (
      <Card>
        <KeyValue label="Outcome" value={incident.status === "resolved" ? "Resolved" : "False alarm"} />
        <KeyValue label="Closed" value={incident.resolved_at ? formatDateTime(incident.resolved_at) : "—"} />
        <KeyValue
          label="Time to close"
          value={incident.resolved_at ? formatDuration((+new Date(incident.resolved_at) - +new Date(incident.triggered_at)) / 1000) : "—"}
        />
        {incident.resolution_notes ? <Text className="text-muted mt-3">{incident.resolution_notes}</Text> : null}
      </Card>
    );
  }
  return (
    <View>
      <Segmented
        options={[
          { value: "false_alarm", label: "False alarm (it was me)" },
          { value: "resolved", label: "Real incident, handled" },
        ]}
        value={verdict}
        onChange={setVerdict}
      />
      <View className="mt-4">
        <TextField
          label="Resolution notes"
          placeholder={verdict === "resolved" ? "What happened and what was done" : "e.g. Roommate moved my bag"}
          value={notes}
          onChangeText={setNotes}
          multiline
        />
      </View>
      <Button
        label={verdict === "resolved" ? "Close as resolved (+15 XP)" : "Close as false alarm (+5 XP)"}
        variant={verdict === "resolved" ? "primary" : "secondary"}
        loading={resolve.isPending}
        onPress={() => resolve.mutate({ status: verdict, resolution_notes: notes.trim() || undefined })}
      />
      {resolve.error ? <Text className="text-emergency mt-2">{resolve.error.message}</Text> : null}
    </View>
  );
}

export default function IncidentDetailScreen({ id }: { id: string }) {
  const incident = useIncident(id);
  const me = useMe();
  const acknowledge = useAcknowledge(id);
  const [tab, setTab] = useState<Tab>("timeline");

  if (incident.isLoading) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Incident" showBack />
        <LoadingState />
      </ScreenContainer>
    );
  }
  if (!incident.data) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Incident" showBack />
        <ErrorState message={incident.error?.message ?? "Incident not found"} onRetry={incident.refetch} />
      </ScreenContainer>
    );
  }

  const i = incident.data;
  const isWarden = me.data?.role === "warden" && me.data.id !== i.user_id;

  return (
    <ScreenContainer onRefresh={incident.refetch} refreshing={incident.isRefetching}>
      <ScreenHeader title={i.title} subtitle={formatDateTime(i.triggered_at)} showBack right={<LiveIndicator />} />
      <Card className={i.status === "open" ? "border-emergency/50" : ""}>
        <IncidentBadges status={i.status} severity={i.severity} />
        {i.description ? <Text className="text-muted mt-3">{i.description}</Text> : null}
        {i.status === "open" ? (
          <View className="mt-4">
            <Button
              label={isWarden ? "Acknowledge as warden" : "I'm checking on it"}
              variant="danger"
              loading={acknowledge.isPending}
              onPress={() => acknowledge.mutate(undefined)}
            />
            <Text className="text-muted text-xs mt-2">
              Acknowledging stops the automatic escalation to your warden.
            </Text>
          </View>
        ) : null}
      </Card>

      <View className="my-4">
        <Segmented
          options={[
            { value: "timeline", label: `Timeline (${i.timeline_events.length})` },
            { value: "evidence", label: `Evidence (${i.evidence_items.length})` },
            { value: "resolve", label: i.status === "open" || i.status === "investigating" ? "Resolve" : "Outcome" },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>

      {tab === "timeline" ? <Timeline incident={i} /> : tab === "evidence" ? <EvidenceTab incident={i} /> : <ResolveTab incident={i} />}
    </ScreenContainer>
  );
}
