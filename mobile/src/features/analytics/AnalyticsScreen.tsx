import { useState } from "react";
import { Text, View } from "react-native";
import { ActivityTimeline } from "@/src/components/charts/ActivityTimeline";
import { CaseDonut } from "@/src/components/charts/CaseDonut";
import { DeviceHealthBars } from "@/src/components/charts/DeviceHealthBars";
import { Heatmap } from "@/src/components/charts/Heatmap";
import { ResponseTimeBars } from "@/src/components/charts/ResponseTimeBars";
import { SecurityGauge } from "@/src/components/charts/SecurityGauge";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { KeyValue } from "@/src/components/ui/Display";
import { Segmented } from "@/src/components/ui/Form";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { ScreenHeader } from "@/src/components/ui/ScreenHeader";
import { StatRow } from "@/src/components/ui/StatRow";
import { StatTile } from "@/src/components/ui/StatTile";
import { EmptyState, ErrorState, LoadingState } from "@/src/components/ui/StateViews";
import {
  useAlertTimeline,
  useCoverage,
  useEventMix,
  useHeatmap,
  useResponseTimes,
  useSummary,
  useTrend,
} from "@/src/features/analytics/api";
import { exportSecurityReport } from "@/src/features/analytics/report";
import { useDevices } from "@/src/features/devices/api";
import { statusTone } from "@/src/features/incidents/components/IncidentCard";
import { useMe } from "@/src/features/profile/api";
import { useLevel, useWeeklySummary } from "@/src/features/rewards/api";
import { formatDateTime, hourLabel, severityLabels, statusLabels, WEEKDAYS } from "@/src/lib/format";
import { toastBus } from "@/src/lib/toast";
import { colors } from "@/src/theme";

function CardTitle({ children }: { children: string }) {
  return <Text className="text-foreground font-semibold mb-3">{children}</Text>;
}

export default function AnalyticsScreen() {
  const [days, setDays] = useState<"7" | "14" | "30">("14");
  const me = useMe();
  const summary = useSummary();
  const trend = useTrend(Number(days));
  const response = useResponseTimes();
  const coverage = useCoverage();
  const heatmap = useHeatmap(30);
  const mix = useEventMix(7);
  const level = useLevel();
  const devices = useDevices();
  const weekly = useWeeklySummary();
  const timeline = useAlertTimeline(8);
  const [exporting, setExporting] = useState(false);

  const s = summary.data;
  const raw = (mix.data ?? []).filter((m) => m.event_type === "movement" || m.event_type === "hall_trigger").reduce((a, m) => a + m.count, 0);
  const verified = mix.data?.find((m) => m.event_type === "dual_verified")?.count ?? 0;
  const refetchAll = () => [summary, trend, response, coverage, heatmap, mix, level, devices, weekly, timeline].forEach((q) => q.refetch());

  const onExport = async () => {
    setExporting(true);
    try {
      await exportSecurityReport({ me: me.data, summary: s, trend: trend.data, response: response.data, coverage: coverage.data, heatmap: heatmap.data });
    } catch (error) {
      toastBus.show({ icon: "alert-circle", title: "Export failed", subtitle: (error as Error).message, tone: "warning" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <ScreenContainer onRefresh={refetchAll} refreshing={summary.isRefetching}>
      <ScreenHeader title="Analytics" showBack subtitle="Your security stats" />

      {summary.isLoading ? <LoadingState /> : null}
      {summary.error ? <ErrorState message={summary.error.message} onRetry={refetchAll} /> : null}

      {level.data ? (
        <Card className="mb-4 items-center py-6">
          <SecurityGauge score={level.data.score} max={level.data.next_level_at ?? level.data.score} label="Security score" />
          <View className="flex-row items-center mt-4 gap-4">
            <Text className="text-muted text-[12px]">
              <Text className="text-safe-light font-medium">{coverage.data?.coverage_percent ?? 0}%</Text> asset coverage
            </Text>
            <Text className="text-muted text-[12px]">
              <Text className="text-primary-light font-medium">{level.data.streak_days}d</Text> streak
            </Text>
          </View>
        </Card>
      ) : null}

      {s ? (
        <Card className="mb-4">
          <CardTitle>Case breakdown</CardTitle>
          <CaseDonut
            segments={[
              { label: "Resolved", value: s.resolved_incidents, color: colors.safe },
              { label: "Open", value: s.open_incidents, color: colors.emergency },
              { label: "False alarm", value: s.false_alarms, color: colors.muted },
            ]}
          />
        </Card>
      ) : null}

      <Card className="mb-4">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-foreground font-semibold">Incident activity</Text>
        </View>
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
        {trend.data?.length ? <ActivityTimeline data={trend.data} /> : <LoadingState />}
      </Card>

      <Card className="mb-4">
        <CardTitle>When do alerts happen?</CardTitle>
        {heatmap.data ? (
          <>
            <Heatmap cells={heatmap.data.cells} />
            <Text className="text-muted text-[12px] mt-3">
              {heatmap.data.peak_weekday != null && heatmap.data.peak_hour != null
                ? `Most alerts: ${WEEKDAYS[heatmap.data.peak_weekday]} around ${hourLabel(heatmap.data.peak_hour)}. An auto-arm schedule for that time would help.`
                : "No incidents in the last 30 days."}
            </Text>
          </>
        ) : (
          <LoadingState />
        )}
      </Card>

      <Card className="mb-4">
        <CardTitle>Device health</CardTitle>
        {devices.data?.length ? (
          <DeviceHealthBars devices={devices.data} />
        ) : (
          <EmptyState title="No devices paired" message="Pair a device to see its health." />
        )}
      </Card>

      {response.data ? (
        <Card className="mb-4">
          <CardTitle>Response times</CardTitle>
          <ResponseTimeBars
            avgDisarmSeconds={response.data.avg_disarm_seconds}
            disarmSampleSize={response.data.disarm_sample_size}
            avgResolutionSeconds={response.data.avg_resolution_seconds}
            resolvedSampleSize={response.data.resolved_sample_size}
          />
        </Card>
      ) : null}

      <Card className="mb-4">
        <CardTitle>Dual-sensor filtering (7 days)</CardTitle>
        <KeyValue label="Single-sensor events (movement / opening)" value={String(raw)} />
        <KeyValue label="Confirmed dual-verified triggers" value={String(verified)} isLast />
        <Text className="text-muted text-[12px] mt-2">
          Requiring both sensors together kept {Math.max(0, raw - verified)} single-sensor events from becoming alerts.
        </Text>
      </Card>

      {weekly.data ? (
        <Card className="mb-4">
          <CardTitle>This week</CardTitle>
          <StatRow>
            <StatTile label="XP gained" value={weekly.data.xp_gained} accent="text-primary-light" />
            <StatTile label="Streak" value={`${weekly.data.streak_days}d`} />
            <StatTile label="Alerts" value={weekly.data.alerts} accent="text-emergency-light" />
            <StatTile label="Resolved" value={weekly.data.resolved_cases} accent="text-safe-light" />
          </StatRow>
        </Card>
      ) : null}

      <Card className="mb-4">
        <CardTitle>Alert timeline</CardTitle>
        {timeline.data?.length === 0 ? <EmptyState title="No alerts yet" message="Triggered alerts will show up here." /> : null}
        {timeline.data?.map((entry, i) => (
          <View
            key={entry.id}
            className={`flex-row items-center justify-between py-2.5 ${i === timeline.data.length - 1 ? "" : "border-b border-hairline"}`}
          >
            <View className="flex-1 mr-2">
              <Text className="text-foreground text-[13px] font-medium">
                {entry.asset_name ?? entry.device_name} · <Text className="text-muted">{severityLabels[entry.severity]}</Text>
              </Text>
              <Text className="text-muted text-[12px] mt-0.5">{formatDateTime(entry.triggered_at)}</Text>
            </View>
            <Badge label={statusLabels[entry.status]} tone={statusTone[entry.status]} />
          </View>
        ))}
      </Card>

      <Button label="Export PDF report" onPress={onExport} loading={exporting} />
    </ScreenContainer>
  );
}
