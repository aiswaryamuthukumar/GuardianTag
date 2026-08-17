import { useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { StatTile } from "@/components/ui/StatTile";

export default function Analytics() {
  const [stats] = useState({
    total_incidents: 12,
    false_alarms: 3,
    true_positives: 9,
    avg_response_time: 45,
    devices_online: 2,
    devices_offline: 0,
  });

  const falseAlarmRate = (
    (stats.false_alarms / stats.total_incidents) *
    100
  ).toFixed(1);

  return (
    <ScreenContainer>
      <ScreenHeader title="Analytics" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="pb-8">
          <Text className="text-muted text-sm mb-4">
            How your guardians are doing
          </Text>

          {/* Stats Grid */}
          <View className="flex-row flex-wrap gap-3 mb-6">
            <StatTile
              label="Devices"
              value={stats.devices_online}
              // subtext="Online"
            />
            <StatTile label="Assets" value="12" />
            <StatTile
              label="Open incidents"
              value={stats.total_incidents - stats.false_alarms}
              // subtext="Active"
            />
            <StatTile label="Resolved" value={stats.false_alarms}/>
          </View>

          {/* False Alarms */}
          <View className="bg-surface rounded-lg p-4 mb-4">
            <Text className="text-white font-bold mb-2">False alarms</Text>
            <Text className="text-orange-400 text-2xl font-bold">
              {stats.false_alarms}
            </Text>
            <Text className="text-muted text-xs mt-2">
              {falseAlarmRate}% of total incidents
            </Text>
          </View>

          {/* Incident Trend */}
          <View className="bg-surface rounded-lg p-4 mb-4">
            <Text className="text-white font-bold mb-4">
              Incidents, last 7 days
            </Text>

            {/* Simple bar chart */}
            <View className="gap-2">
              {[
                { day: "Mon", count: 2 },
                { day: "Tue", count: 1 },
                { day: "Wed", count: 3 },
                { day: "Thu", count: 0 },
                { day: "Fri", count: 2 },
                { day: "Sat", count: 1 },
                { day: "Sun", count: 3 },
              ].map(d => (
                <View key={d.day} className="flex-row items-center">
                  <Text className="text-muted text-xs w-10">{d.day}</Text>
                  <View className="flex-1 bg-background rounded h-6 flex-row items-center">
                    <View
                      className="bg-purple-500 h-6 rounded"
                      style={{ width: `${(d.count / 3) * 100}%` }}
                    />
                  </View>
                  <Text className="text-white text-xs w-6 text-right">
                    {d.count}
                  </Text>
                </View>
              ))}
            </View>

            <Text className="text-muted text-xs mt-4">
              Peak: 3 in a day
            </Text>
          </View>

          {/* Response Times */}
          <View className="bg-surface rounded-lg p-4">
            <Text className="text-white font-bold mb-4">Response times</Text>

            <View className="mb-3">
              <View className="flex-row justify-between mb-1">
                <Text className="text-muted text-sm">Avg. quick disarm</Text>
                <Text className="text-white font-semibold">2.3 min</Text>
              </View>
            </View>

            <View>
              <View className="flex-row justify-between mb-1">
                <Text className="text-muted text-sm">
                  Avg. manual resolution
                </Text>
                <Text className="text-white font-semibold">15 min</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

// import { View, Text } from "react-native";
// import { useQuery } from "@tanstack/react-query";
// import { useApi } from "@/hooks/useApi";
// import { ScreenContainer } from "@/components/ui/ScreenContainer";
// import { ScreenHeader } from "@/components/ui/ScreenHeader";
// import { StatTile } from "@/components/ui/StatTile";
// import { Card } from "@/components/ui/Card";
// import { LoadingState, ErrorState } from "@/components/ui/StateViews";
// import { IncidentTrendChart } from "@/components/charts/IncidentTrendChart";
// import { formatDuration } from "@/lib/format";
// import type {
//   AnalyticsSummary,
//   AssetCoverage,
//   DailyIncidentCountApi,
//   ResponseTimes,
// } from "@/types/api";

// export default function Analytics() {
//   const api = useApi();

//   const summaryQuery = useQuery({
//     queryKey: ["analytics-summary"],
//     queryFn: () => api.get<AnalyticsSummary>("/analytics/summary"),
//   });
//   const trendQuery = useQuery({
//     queryKey: ["analytics-trend"],
//     queryFn: () => api.get<DailyIncidentCountApi[]>("/analytics/incidents-trend?days=14"),
//   });
//   const responseTimesQuery = useQuery({
//     queryKey: ["analytics-response-times"],
//     queryFn: () => api.get<ResponseTimes>("/analytics/response-times"),
//   });
//   const coverageQuery = useQuery({
//     queryKey: ["analytics-coverage"],
//     queryFn: () => api.get<AssetCoverage>("/analytics/asset-coverage"),
//   });

//   const loading = summaryQuery.isLoading || trendQuery.isLoading;
//   const error = summaryQuery.error || trendQuery.error;

//   return (
//     <ScreenContainer onRefresh={() => summaryQuery.refetch()} refreshing={summaryQuery.isRefetching}>
//       <ScreenHeader title="Analytics" showBack subtitle="How your guardians are doing" />

//       {loading ? <LoadingState /> : null}
//       {error ? (
//         <ErrorState message={(error as Error).message} onRetry={() => summaryQuery.refetch()} />
//       ) : null}

//       {summaryQuery.data ? (
//         <>
//           <View className="flex-row gap-3 mb-3">
//             <StatTile label="Devices" value={summaryQuery.data.total_devices} accent="text-primary-light" />
//             <StatTile label="Assets" value={summaryQuery.data.total_assets} accent="text-primary-light" />
//           </View>
//           <View className="flex-row gap-3 mb-3">
//             <StatTile
//               label="Open incidents"
//               value={summaryQuery.data.open_incidents}
//               accent={summaryQuery.data.open_incidents > 0 ? "text-emergency" : "text-safe"}
//             />
//             <StatTile label="Resolved" value={summaryQuery.data.resolved_incidents} accent="text-safe" />
//           </View>
//           <View className="flex-row gap-3 mb-4">
//             <StatTile label="False alarms" value={summaryQuery.data.false_alarms} accent="text-warning" />
//             {coverageQuery.data ? (
//               <StatTile
//                 label="Asset coverage"
//                 value={`${coverageQuery.data.coverage_percent}%`}
//                 accent="text-primary-light"
//               />
//             ) : null}
//           </View>
//         </>
//       ) : null}

//       {trendQuery.data && trendQuery.data.length > 0 ? (
//         <Card className="mb-4">
//           <Text className="text-white font-semibold mb-3">Incidents, last 14 days</Text>
//           <IncidentTrendChart data={trendQuery.data} />
//         </Card>
//       ) : null}

//       {responseTimesQuery.data ? (
//         <Card className="mb-4">
//           <Text className="text-white font-semibold mb-3">Response times</Text>
//           <View className="flex-row justify-between mb-2">
//             <Text className="text-muted">Avg. quick disarm</Text>
//             <Text className="text-white font-medium">
//               {formatDuration(responseTimesQuery.data.avg_disarm_seconds)}
//               {responseTimesQuery.data.disarm_sample_size > 0
//                 ? ` (${responseTimesQuery.data.disarm_sample_size})`
//                 : ""}
//             </Text>
//           </View>
//           <View className="flex-row justify-between">
//             <Text className="text-muted">Avg. manual resolution</Text>
//             <Text className="text-white font-medium">
//               {formatDuration(responseTimesQuery.data.avg_resolution_seconds)}
//               {responseTimesQuery.data.resolved_sample_size > 0
//                 ? ` (${responseTimesQuery.data.resolved_sample_size})`
//                 : ""}
//             </Text>
//           </View>
//         </Card>
//       ) : null}
//     </ScreenContainer>
//   );
// }
