import { useMemo, useState } from "react";
import { View, Text, Pressable, TextInput } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { useApi } from "@/hooks/useApi";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Badge } from "@/components/ui/Badge";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/StateViews";
import { colors } from "@/constants/theme";
import type { Incident, IncidentSeverity, IncidentStatus } from "@/types/api";

const severityColor: Record<IncidentSeverity, string> = {
  low: colors.safe,
  medium: colors.warning,
  high: colors.emergency,
  critical: colors.emergency,
};

const statusLabel: Record<IncidentStatus, string> = {
  open: "Open",
  investigating: "Investigating",
  resolved: "Resolved",
  false_alarm: "False alarm",
};

const statusTone: Record<IncidentStatus, "emergency" | "warning" | "safe" | "muted"> = {
  open: "emergency",
  investigating: "warning",
  resolved: "safe",
  false_alarm: "muted",
};

const filters: { key: IncidentStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "investigating", label: "Investigating" },
  { key: "resolved", label: "Resolved" },
  { key: "false_alarm", label: "False alarm" },
];

export default function Incidents() {
  const api = useApi();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<IncidentStatus | "all">("all");

  const incidentsQuery = useQuery({
    queryKey: ["incidents"],
    queryFn: () => api.get<Incident[]>("/incidents"),
  });

  const filtered = useMemo(() => {
    return (incidentsQuery.data ?? [])
      .filter((i) => filter === "all" || i.status === filter)
      .filter((i) => i.title.toLowerCase().includes(search.trim().toLowerCase()));
  }, [incidentsQuery.data, filter, search]);

  return (
    <ScreenContainer onRefresh={() => incidentsQuery.refetch()} refreshing={incidentsQuery.isRefetching}>
      <ScreenHeader title="Cases" subtitle="Everything your guardians have flagged" />

      <View className="flex-row items-center bg-surface dark:bg-[#15161C] border border-border dark:border-[#26282F] rounded-xl px-3 mb-3">
        <Feather name="search" size={16} color={colors.muted} />
        <TextInput
          className="flex-1 py-2.5 px-2 text-foreground dark:text-white text-[14px]"
          placeholder="Search cases"
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View className="flex-row flex-wrap gap-2 mb-4">
        {filters.map((f) => {
          const active = filter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              className="px-3 py-1.5 rounded-full border"
              style={{
                backgroundColor: active ? colors.primary : "transparent",
                borderColor: active ? colors.primary : colors.border,
              }}
            >
              <Text className={`text-[12px] font-medium ${active ? "text-white" : "text-muted dark:text-[#8A8D98]"}`}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {incidentsQuery.isLoading ? <LoadingState /> : null}
      {incidentsQuery.error ? (
        <ErrorState message={(incidentsQuery.error as Error).message} onRetry={() => incidentsQuery.refetch()} />
      ) : null}

      {incidentsQuery.data && filtered.length === 0 ? (
        <EmptyState
          title="No matching cases"
          message={incidentsQuery.data.length === 0 ? "Nothing has been flagged yet — that's a good thing." : "Try a different search or filter."}
        />
      ) : null}

      <View>
        {filtered.map((incident, i) => (
          <Pressable
            key={incident.id}
            onPress={() => router.push(`/(app)/incidents/${incident.id}`)}
            className={`flex-row py-4 ${i === filtered.length - 1 ? "" : "border-b border-hairline"}`}
          >
            <View className="items-center mr-3 pt-1">
              <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: severityColor[incident.severity] }} />
              {i < filtered.length - 1 ? <View className="w-px flex-1 bg-hairline mt-2" /> : null}
            </View>
            <View className="flex-1 pb-2">
              <View className="flex-row items-start justify-between mb-1.5">
                <Text className="text-foreground text-[15px] font-semibold flex-1 mr-2">{incident.title}</Text>
                <Feather name="chevron-right" size={16} color={colors.muted} />
              </View>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Badge label={statusLabel[incident.status]} tone={statusTone[incident.status]} />
                  <Text className="text-muted text-[12px] capitalize">{incident.severity} severity</Text>
                </View>
                <Text className="text-muted text-[12px]">
                  {new Date(incident.triggered_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </Text>
              </View>
            </View>
          </Pressable>
        ))}
      </View>
    </ScreenContainer>
  );
}
