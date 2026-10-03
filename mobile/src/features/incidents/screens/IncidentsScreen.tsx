import { useMemo, useState } from "react";
import { TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LiveIndicator } from "@/src/components/ui/Display";
import { Segmented } from "@/src/components/ui/Form";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { ScreenHeader } from "@/src/components/ui/ScreenHeader";
import { EmptyState, ErrorState, LoadingState } from "@/src/components/ui/StateViews";
import { useAssets } from "@/src/features/assets/api";
import { useDevices } from "@/src/features/devices/api";
import { IncidentCard } from "@/src/features/incidents/components/IncidentCard";
import { useIncidents, type IncidentFilter } from "@/src/features/incidents/api";
import { colors } from "@/src/theme";

type Tab = "active" | "resolved" | "false_alarm" | "all";

const TABS: { value: Tab; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "all", label: "All" },
  { value: "resolved", label: "Resolved" },
  { value: "false_alarm", label: "False alarm" },
];

function toFilter(tab: Tab): IncidentFilter {
  if (tab === "active") return { active: true };
  if (tab === "all") return {};
  return { status: tab };
}

export default function IncidentsScreen() {
  const [tab, setTab] = useState<Tab>("active");
  const [search, setSearch] = useState("");
  const incidents = useIncidents(toFilter(tab));
  const devices = useDevices();
  const assets = useAssets();

  const subtitle = useMemo(() => {
    const assetNames = new Map((assets.data ?? []).map((a) => [a.id, a.name]));
    const deviceNames = new Map((devices.data ?? []).map((d) => [d.id, d.name]));
    return (deviceId: string, assetId: string | null) =>
      [assetId ? assetNames.get(assetId) : undefined, deviceNames.get(deviceId)].filter(Boolean).join(" · ");
  }, [assets.data, devices.data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (incidents.data ?? []).filter(
      (i) => !q || i.title.toLowerCase().includes(q) || subtitle(i.device_id, i.asset_id).toLowerCase().includes(q),
    );
  }, [incidents.data, search, subtitle]);

  return (
    <ScreenContainer onRefresh={incidents.refetch} refreshing={incidents.isRefetching}>
      <ScreenHeader title="Cases" subtitle="Every confirmed trigger, with its timeline" right={<LiveIndicator />} />

      <View className="flex-row items-center bg-surface border border-border rounded-xl px-3 mb-3">
        <Feather name="search" size={16} color={colors.muted} />
        <TextInput
          className="flex-1 py-2.5 px-2 text-foreground text-[14px]"
          placeholder="Search cases, belongings, devices"
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
          accessibilityLabel="Search cases"
        />
      </View>
      <View className="mb-4">
        <Segmented options={TABS} value={tab} onChange={setTab} />
      </View>

      {incidents.isLoading ? <LoadingState /> : null}
      {incidents.error ? <ErrorState message={incidents.error.message} onRetry={incidents.refetch} /> : null}
      {incidents.data && filtered.length === 0 ? (
        <EmptyState
          title={tab === "active" && !search ? "All clear" : "No matching cases"}
          message={
            tab === "active" && !search ? "No open cases. Your belongings are quiet." : "Try a different search or filter."
          }
        />
      ) : null}

      {filtered.map((incident) => (
        <IncidentCard key={incident.id} incident={incident} subtitle={subtitle(incident.device_id, incident.asset_id)} />
      ))}
    </ScreenContainer>
  );
}
