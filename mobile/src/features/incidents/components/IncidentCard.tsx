import { Text, View } from "react-native";
import { router } from "expo-router";
import { Badge, type BadgeTone } from "@/src/components/ui/Badge";
import { PressableCard } from "@/src/components/ui/Card";
import { severityLabels, statusLabels, timeAgo } from "@/src/lib/format";
import type { Incident, IncidentSeverity, IncidentStatus } from "@/src/types/api";

export const statusTone: Record<IncidentStatus, BadgeTone> = {
  open: "emergency",
  investigating: "warning",
  resolved: "safe",
  false_alarm: "muted",
};

export const severityTone: Record<IncidentSeverity, BadgeTone> = {
  low: "muted",
  medium: "warning",
  high: "emergency",
  critical: "emergency",
};

export function IncidentBadges({ status, severity }: { status: IncidentStatus; severity: IncidentSeverity }) {
  return (
    <View className="flex-row gap-2">
      <Badge label={statusLabels[status]} tone={statusTone[status]} />
      {status === "open" || status === "investigating" ? (
        <Badge label={severityLabels[severity]} tone={severityTone[severity]} />
      ) : null}
    </View>
  );
}

export function IncidentCard({ incident, subtitle }: { incident: Incident; subtitle?: string }) {
  const active = incident.status === "open" || incident.status === "investigating";
  return (
    <PressableCard
      onPress={() => router.push(`/incidents/${incident.id}`)}
      className={`mb-3 ${active ? "border-emergency/40" : ""}`}
    >
      <View className="flex-row items-start justify-between mb-2">
        <Text className="text-white font-semibold flex-1 pr-3" numberOfLines={1}>
          {incident.title}
        </Text>
        <Text className="text-muted text-xs">{timeAgo(incident.triggered_at)}</Text>
      </View>
      {subtitle ? <Text className="text-muted text-sm mb-2">{subtitle}</Text> : null}
      <IncidentBadges status={incident.status} severity={incident.severity} />
    </PressableCard>
  );
}
