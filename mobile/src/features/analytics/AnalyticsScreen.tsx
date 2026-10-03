import { useState } from "react";
import { Alert, Text, View } from "react-native";
import { BarChart } from "@/src/components/charts/BarChart";
import { Heatmap } from "@/src/components/charts/Heatmap";
import { Ring } from "@/src/components/charts/Ring";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { KeyValue, SectionTitle } from "@/src/components/ui/Display";
import { Segmented } from "@/src/components/ui/Form";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { ScreenHeader } from "@/src/components/ui/ScreenHeader";
import { StatTile } from "@/src/components/ui/StatTile";
import { LoadingState } from "@/src/components/ui/StateViews";
import { exportSecurityReport } from "@/src/features/analytics/report";
import {
  useCoverage,
  useEventMix,
  useHeatmap,
  useResponseTimes,
  useSummary,
  useTrend,
} from "@/src/features/analytics/api";
import { useMe } from "@/src/features/profile/api";
import { eventLabels, formatDuration, hourLabel, WEEKDAYS } from "@/src/lib/format";

export default function AnalyticsScreen() {
  const [days, setDays] = useState<"7" | "14" | "30">("14");
  const me = useMe();
  const summary = useSummary();
  const trend = useTrend(Number(days));
  const response = useResponseTimes();
  const coverage = useCoverage();
  const heatmap = useHeatmap(30);
  const mix = useEventMix(7);
  const [exporting, setExporting] = useState(false);

  const s = summary.data;
  const closed = (s?.resolved_incidents ?? 0) + (s?.false_alarms ?? 0);
  const falseRate = closed ? Math.round(((s?.false_alarms ?? 0) / closed) * 100) : 0;
  const rawTriggers = (mix.data ?? []).filter((m) => m.event_type === "movement" || m.event_type === "hall_trigger").reduce((a, m) => a + m.count, 0);
  const verified = mix.data?.find((m) => m.event_type === "dual_verified")?.count ?? 0;

  const refetchAll = () => [summary, trend, response, coverage, heatmap, mix].forEach((q) => q.refetch());

  const onExport = async () => {
    setExporting(true);
    try {
      await exportSecurityReport({
        me: me.data,
        summary: s,
        trend: trend.data,
        response: response.data,
        coverage: coverage.data,
        heatmap: heatmap.data,
      });
    } catch (error) {
      Alert.alert("Export failed", (error as Error).message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <ScreenContainer onRefresh={refetchAll} refreshing={summary.isRefetching}>
      <ScreenHeader title="Analytics" subtitle="How secure your belongings have been" showBack />

      <View className="flex-row gap-3">
        <StatTile label="Open" value={s?.open_incidents ?? "—"} accent="text-emergency" />
        <StatTile label="Resolved" value={s?.resolved_incidents ?? "—"} accent="text-safe" />
        <StatTile label="False alarms" value={s?.false_alarms ?? "—"} accent="text-warning" />
      </View>

      <SectionTitle title="Incident trend" />
      <Card>
        <View className="mb-3">
          <Segmented
            options={[
              { value: "7", label: "7 days" },
              { value: "14", label: "14 days" },
              { value: "30", label: "30 days" },
            ]}
            value={days}
            onChange={setDays}
          />
        </View>
        {trend.data ? (
          <BarChart
            data={trend.data.map((d) => ({
              key: d.date,
              label: new Date(d.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
              value: d.count,
            }))}
            axisLabels={[trend.data[0].date.slice(5), trend.data[Math.floor(trend.data.length / 2)].date.slice(5), "Today"]}
          />
        ) : (
          <LoadingState />
        )}
      </Card>

      <SectionTitle title="When do alerts happen?" />
      <Card>
        {heatmap.data ? (
          <>
            <Heatmap cells={heatmap.data.cells} />
            <Text className="text-muted text-xs mt-3">
              {heatmap.data.peak_weekday != null && heatmap.data.peak_hour != null
                ? `Most alerts: ${WEEKDAYS[heatmap.data.peak_weekday]} around ${hourLabel(heatmap.data.peak_hour)}. Consider an auto-arm schedule for that time.`
                : "No incidents in the last 30 days."}
            </Text>
          </>
        ) : (
          <LoadingState />
        )}
      </Card>

      <SectionTitle title="Coverage & accuracy" />
      <Card className="flex-row items-center">
        <Ring percent={coverage.data?.coverage_percent ?? 0} label="armed" />
        <View className="flex-1 ml-4">
          <KeyValue label="Belongings armed" value={`${coverage.data?.armed_assets ?? 0} / ${coverage.data?.total_assets ?? 0}`} />
          <KeyValue label="False-alarm rate" value={`${falseRate}%`} />
          <KeyValue label="Single-sensor noise (7d)" value={`${rawTriggers} → ${verified} alerts`} />
        </View>
      </Card>
      <Text className="text-muted text-xs mt-2">
        Dual verification turned {rawTriggers} raw movement/opening events into {verified} confirmed triggers this week.
      </Text>

      <SectionTitle title="Response times" />
      <Card>
        <KeyValue label="Avg. time to resolve" value={formatDuration(response.data?.avg_resolution_seconds ?? null)} />
        <KeyValue label="Avg. on-device disarm" value={formatDuration(response.data?.avg_disarm_seconds ?? null)} />
        <KeyValue label="Fastest disarm" value={formatDuration(response.data?.fastest_disarm_seconds ?? null)} />
      </Card>

      <SectionTitle title="Sensor events (7 days)" />
      <Card>
        {(mix.data ?? []).length ? (
          mix.data!.map((m) => <KeyValue key={m.event_type} label={eventLabels[m.event_type]} value={String(m.count)} />)
        ) : (
          <Text className="text-muted">No sensor events this week.</Text>
        )}
      </Card>

      <View className="mt-6">
        <Button label="Export PDF report" onPress={onExport} loading={exporting} />
      </View>
    </ScreenContainer>
  );
}
