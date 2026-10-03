import { useState } from "react";
import { Text } from "react-native";
import { LiveIndicator } from "@/src/components/ui/Display";
import { Segmented } from "@/src/components/ui/Form";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { ScreenHeader } from "@/src/components/ui/ScreenHeader";
import { EmptyState, ErrorState, LoadingState } from "@/src/components/ui/StateViews";
import { useAssets } from "@/src/features/assets/api";
import { useDevices } from "@/src/features/devices/api";
import { IncidentCard } from "@/src/features/incidents/components/IncidentCard";
import { useIncidents, type IncidentFilter } from "@/src/features/incidents/api";

type Tab = "active" | "resolved" | "false_alarm" | "all";

const TABS: { value: Tab; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "resolved", label: "Resolved" },
  { value: "false_alarm", label: "False alarms" },
  { value: "all", label: "All" },
];

function toFilter(tab: Tab): IncidentFilter {
  if (tab === "active") return { active: true };
  if (tab === "all") return {};
  return { status: tab };
}

export default function IncidentsScreen() {
  const [tab, setTab] = useState<Tab>("active");
  const incidents = useIncidents(toFilter(tab));
  const devices = useDevices();
  const assets = useAssets();

  const subtitle = (deviceId: string, assetId: string | null) =>
    [assets.data?.find((a) => a.id === assetId)?.name, devices.data?.find((d) => d.id === deviceId)?.name]
      .filter(Boolean)
      .join(" · ");

  return (
    <ScreenContainer onRefresh={incidents.refetch} refreshing={incidents.isRefetching}>
      <ScreenHeader title="Incidents" subtitle="Every confirmed trigger, with its full timeline" right={<LiveIndicator />} />
      <Segmented options={TABS} value={tab} onChange={setTab} />
      <Text className="text-muted text-xs mt-3 mb-2">
        {incidents.data ? `${incidents.data.length} incident${incidents.data.length === 1 ? "" : "s"}` : " "}
      </Text>
      {incidents.isLoading ? (
        <LoadingState />
      ) : incidents.error ? (
        <ErrorState message={incidents.error.message} onRetry={incidents.refetch} />
      ) : incidents.data?.length ? (
        incidents.data.map((incident) => (
          <IncidentCard key={incident.id} incident={incident} subtitle={subtitle(incident.device_id, incident.asset_id)} />
        ))
      ) : (
        <EmptyState
          title={tab === "active" ? "All clear" : "Nothing here"}
          message={tab === "active" ? "No open incidents. Your belongings are quiet." : "No incidents in this category yet."}
        />
      )}
    </ScreenContainer>
  );
}
