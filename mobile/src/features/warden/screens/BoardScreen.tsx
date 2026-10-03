import { useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { LiveIndicator, useNow } from "@/src/components/ui/Display";
import { Segmented } from "@/src/components/ui/Form";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { ScreenHeader } from "@/src/components/ui/ScreenHeader";
import { StatRow } from "@/src/components/ui/StatRow";
import { StatTile } from "@/src/components/ui/StatTile";
import { EmptyState, ErrorState, LoadingState } from "@/src/components/ui/StateViews";
import { IncidentBadges } from "@/src/features/incidents/components/IncidentCard";
import { useAcknowledge } from "@/src/features/incidents/api";
import { useMe } from "@/src/features/profile/api";
import { useBoard } from "@/src/features/warden/api";
import { timeAgo } from "@/src/lib/format";
import type { WardenIncident } from "@/src/types/api";

function BoardCard({ incident, now }: { incident: WardenIncident; now: number }) {
  const acknowledge = useAcknowledge(incident.id);
  const where = [incident.hostel_block && `Block ${incident.hostel_block}`, incident.room_number && `Room ${incident.room_number}`]
    .filter(Boolean)
    .join(" · ");
  const urgent = incident.status === "open" && incident.severity === "high";

  return (
    // A plain card with its own tappable summary: a pressable card can't contain the
    // Acknowledge/Call buttons (nested <button> on web).
    <Card className={`mb-3 ${urgent ? "border-emergency" : ""}`}>
      <Pressable onPress={() => router.push(`/incidents/${incident.id}`)} accessibilityRole="button">
      <View className="flex-row justify-between items-start">
        <View className="flex-1 pr-3">
          <Text className="text-foreground font-bold text-lg">{where || "Room unknown"}</Text>
          <Text className="text-foreground">{incident.student_name}</Text>
        </View>
        <Text className={`text-xs ${urgent ? "text-emergency font-bold" : "text-muted"}`}>{timeAgo(incident.triggered_at, now)}</Text>
      </View>
      <Text className="text-muted text-sm my-2">
        {incident.asset_name ?? incident.device_name} · {incident.title}
      </Text>
      <IncidentBadges status={incident.status} severity={incident.severity} />
      </Pressable>
      {incident.status === "open" || incident.phone ? (
        <View className="flex-row gap-2 mt-3">
          {incident.status === "open" ? (
            <Button label="Acknowledge" size="sm" variant="danger" className="flex-1" loading={acknowledge.isPending} onPress={() => acknowledge.mutate(undefined)} />
          ) : null}
          {incident.phone ? (
            <Button label="Call student" size="sm" variant="secondary" className="flex-1" onPress={() => Linking.openURL(`tel:${incident.phone!.replace(/\s/g, "")}`)} />
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

/** Warden Live Board: every active incident in the hostel, most urgent first, updating in real time. */
export default function BoardScreen() {
  const { data: me } = useMe();
  const [scope, setScope] = useState<"active" | "all">("active");
  const board = useBoard(scope);
  const now = useNow(5000);

  const list = board.data ?? [];
  const open = list.filter((i) => i.status === "open").length;
  const escalated = list.filter((i) => i.status === "open" && i.severity === "high").length;

  return (
    <ScreenContainer onRefresh={board.refetch} refreshing={board.isRefetching}>
      <ScreenHeader
        title="Live board"
        subtitle={me?.hostel_block ? `Block ${me.hostel_block}` : "Whole hostel"}
        right={<LiveIndicator />}
      />
      <StatRow className="mb-4">
        <StatTile label="Unanswered" value={open} accent={open ? "text-emergency" : "text-foreground"} />
        <StatTile label="Escalated" value={escalated} accent={escalated ? "text-emergency" : "text-foreground"} />
        <StatTile label="Investigating" value={list.filter((i) => i.status === "investigating").length} accent="text-warning" />
      </StatRow>
      <Segmented
        options={[
          { value: "active", label: "Active" },
          { value: "all", label: "History" },
        ]}
        value={scope}
        onChange={setScope}
      />
      <View className="mt-3">
        {board.isLoading ? (
          <LoadingState />
        ) : board.error ? (
          <ErrorState message={board.error.message} onRetry={board.refetch} />
        ) : list.length ? (
          list.map((incident) => <BoardCard key={incident.id} incident={incident} now={now} />)
        ) : (
          <EmptyState title="All quiet" message="No active incidents. New and escalated alerts appear here instantly." />
        )}
      </View>
    </ScreenContainer>
  );
}
