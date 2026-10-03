import { Text, View } from "react-native";
import { BarChart } from "@/src/components/charts/BarChart";
import { Ring } from "@/src/components/charts/Ring";
import { Card } from "@/src/components/ui/Card";
import { KeyValue, SectionTitle } from "@/src/components/ui/Display";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { ScreenHeader } from "@/src/components/ui/ScreenHeader";
import { StatRow } from "@/src/components/ui/StatRow";
import { StatTile } from "@/src/components/ui/StatTile";
import { ErrorState, LoadingState } from "@/src/components/ui/StateViews";
import { useWardenStats } from "@/src/features/warden/api";
import { formatDuration, hourLabel } from "@/src/lib/format";

/** Hostel analytics: where and when incidents happen across the warden's blocks. */
export default function StatsScreen() {
  const stats = useWardenStats();
  const s = stats.data;

  return (
    <ScreenContainer onRefresh={stats.refetch} refreshing={stats.isRefetching}>
      <ScreenHeader title="Hostel stats" subtitle="Last 30 days" />
      {stats.isLoading ? (
        <LoadingState />
      ) : !s ? (
        <ErrorState message={stats.error?.message} onRetry={stats.refetch} />
      ) : (
        <>
          <StatRow>
            <StatTile label="Students" value={s.students} />
            <StatTile label="Open now" value={s.open_incidents} accent={s.open_incidents ? "text-emergency" : "text-foreground"} />
            <StatTile label="Incidents" value={s.incidents_30d} accent="text-warning" />
          </StatRow>

          <SectionTitle title="Device fleet" />
          <Card className="flex-row items-center">
            <Ring percent={s.devices_total ? (s.devices_online / s.devices_total) * 100 : 0} label="online" />
            <View className="flex-1 ml-4">
              <KeyValue label="Online" value={`${s.devices_online} / ${s.devices_total}`} />
              <KeyValue label="Avg. response" value={formatDuration(s.avg_response_seconds)} />
              <KeyValue label="False-alarm rate" value={`${s.false_alarm_rate}%`} />
            </View>
          </Card>

          <SectionTitle title="Incidents by hour" />
          <Card>
            <BarChart
              data={s.by_hour.map((value, hour) => ({ key: String(hour), label: hourLabel(hour), value }))}
              axisLabels={["12am", "12pm", "11pm"]}
            />
          </Card>

          <SectionTitle title="Incidents by block" />
          <Card>
            {s.by_block.length ? (
              s.by_block.map((b) => <KeyValue key={b.hostel_block} label={`Block ${b.hostel_block}`} value={String(b.incidents)} />)
            ) : (
              <Text className="text-muted">No incidents in the last 30 days.</Text>
            )}
          </Card>
        </>
      )}
    </ScreenContainer>
  );
}
