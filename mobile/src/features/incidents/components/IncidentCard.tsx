import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Badge, type BadgeTone } from "@/src/components/ui/Badge";
import { Card } from "@/src/components/ui/Card";
import { IconAvatar } from "@/src/components/ui/IconAvatar";
import { formatDateTime, severityLabels, statusLabels, timeAgo } from "@/src/lib/format";
import { colors } from "@/src/theme";
import type { Incident, IncidentSeverity, IncidentStatus } from "@/src/types/api";

export const statusTone: Record<IncidentStatus, BadgeTone> = {
  open: "emergency",
  investigating: "warning",
  resolved: "safe",
  false_alarm: "muted",
};

export const severityTone: Record<IncidentSeverity, "safe" | "warning" | "emergency"> = {
  low: "safe",
  medium: "warning",
  high: "emergency",
  critical: "emergency",
};

export const severityColor: Record<IncidentSeverity, string> = {
  low: colors.safe,
  medium: colors.warning,
  high: colors.emergency,
  critical: colors.emergency,
};

const severityIcon: Record<IncidentSeverity, keyof typeof Feather.glyphMap> = {
  low: "shield",
  medium: "alert-circle",
  high: "alert-triangle",
  critical: "alert-triangle",
};

export function IncidentBadges({ status, severity }: { status: IncidentStatus; severity: IncidentSeverity }) {
  return (
    <View className="flex-row items-center gap-2">
      <Badge label={statusLabels[status]} tone={statusTone[status]} />
      <View className="flex-row items-center">
        <View className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: severityColor[severity] }} />
        <Text className="text-muted text-[12px]">{severityLabels[severity]}</Text>
      </View>
    </View>
  );
}

export function IncidentCard({ incident, subtitle }: { incident: Incident; subtitle?: string }) {
  const active = incident.status === "open" || incident.status === "investigating";
  return (
    <Pressable onPress={() => router.push(`/incidents/${incident.id}`)} accessibilityRole="button" className="mb-3">
      <Card className={`py-4 ${active && incident.severity === "high" ? "border-emergency/60" : ""}`}>
        <View className="flex-row items-start">
          <IconAvatar icon={severityIcon[incident.severity]} tone={active ? severityTone[incident.severity] : "muted"} size={44} />
          <View className="flex-1 ml-3">
            <View className="flex-row items-start justify-between">
              <Text className="text-foreground text-[16px] font-semibold flex-1 mr-2" numberOfLines={2}>
                {incident.title}
              </Text>
              <Feather name="chevron-right" size={18} color={colors.muted} />
            </View>
            {subtitle ? <Text className="text-muted text-[13px] mt-0.5">{subtitle}</Text> : null}
            <View className="mt-2">
              <IncidentBadges status={incident.status} severity={incident.severity} />
            </View>
            <View className="flex-row items-center mt-2.5 pt-2.5 border-t border-hairline">
              <Feather name="clock" size={12} color={colors.muted} style={{ marginRight: 5 }} />
              <Text className="text-muted text-[12px]">
                {formatDateTime(incident.triggered_at)} · {timeAgo(incident.triggered_at)}
              </Text>
            </View>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}
