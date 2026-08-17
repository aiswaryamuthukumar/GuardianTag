import { useEffect, useState } from "react";
import { View, Text, ScrollView, Button } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";

export default function IncidentDetails() {
  const params = useLocalSearchParams();
  const incidentId = params.id as string || "660e8400-e29b-41d4-a716-446655440000";

  const [incident] = useState({
    id: incidentId,
    device_id: "550e8400-e29b-41d4-a716-446655440000",
    title: "Unverified movement detected",
    description: "Both motion and hall sensors triggered",
    status: "open",
    triggered_at: new Date(Date.now() - 5 * 60000).toISOString(),
    created_at: new Date(Date.now() - 5 * 60000).toISOString(),
    resolved_at: null,
  });

  const getStatusColor = (status: string) => {
    if (status === "open") return "text-red-400";
    if (status === "false_alarm") return "text-yellow-400";
    return "text-green-400";
  };

  const getStatusBgColor = (status: string) => {
    if (status === "open") return "bg-red-900";
    if (status === "false_alarm") return "bg-yellow-900";
    return "bg-green-900";
  };

  return (
    <ScreenContainer>
      <ScreenHeader title="Incident Details" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="pb-8">
          <View className={`${getStatusBgColor(incident.status)} rounded-lg p-4 mb-6`}>
            <Text className={`${getStatusColor(incident.status)} font-bold text-lg mb-2`}>
              {incident.status.toUpperCase()}
            </Text>
            <Text className="text-white text-xl font-bold mb-2">
              {incident.title}
            </Text>
            <Text className="text-gray-300">
              {incident.description}
            </Text>
          </View>

          <View className="bg-surface rounded-lg p-4 mb-4">
            <Text className="text-muted text-sm mb-1">Device</Text>
            <Text className="text-white font-semibold">My Backpack</Text>
          </View>

          <View className="bg-surface rounded-lg p-4 mb-4">
            <Text className="text-muted text-sm mb-1">Triggered</Text>
            <Text className="text-white font-semibold">
              {new Date(incident.triggered_at).toLocaleString()}
            </Text>
          </View>

          {incident.resolved_at && (
            <View className="bg-surface rounded-lg p-4 mb-4">
              <Text className="text-muted text-sm mb-1">Resolved</Text>
              <Text className="text-white font-semibold">
                {new Date(incident.resolved_at).toLocaleString()}
              </Text>
            </View>
          )}

          <View className="gap-2">
            <Button title="View Timeline" onPress={() => {}} color="#7c3aed" />
            <Button title="View Evidence" onPress={() => {}} color="#7c3aed" />
            {incident.status === "open" && (
              <Button title="Mark as Resolved" onPress={() => {}} color="#10b981" />
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

// import { View, Text } from "react-native";
// import { router, useLocalSearchParams } from "expo-router";
// import { useQuery } from "@tanstack/react-query";
// import { useApi } from "@/hooks/useApi";
// import { ScreenContainer } from "@/components/ui/ScreenContainer";
// import { ScreenHeader } from "@/components/ui/ScreenHeader";
// import { Card, PressableCard } from "@/components/ui/Card";
// import { Badge, type BadgeTone } from "@/components/ui/Badge";
// import { LoadingState, ErrorState } from "@/components/ui/StateViews";
// import type { IncidentDetail, IncidentStatus } from "@/types/api";

// const statusTone: Record<IncidentStatus, BadgeTone> = {
//   open: "emergency",
//   investigating: "warning",
//   resolved: "safe",
//   false_alarm: "muted",
// };

// export default function IncidentDetails() {
//   const { id } = useLocalSearchParams<{ id: string }>();
//   const api = useApi();

//   const incidentQuery = useQuery({
//     queryKey: ["incidents", id],
//     queryFn: () => api.get<IncidentDetail>(`/incidents/${id}`),
//   });

//   if (incidentQuery.isLoading) {
//     return (
//       <ScreenContainer>
//         <ScreenHeader title="Incident" showBack />
//         <LoadingState />
//       </ScreenContainer>
//     );
//   }

//   if (incidentQuery.error || !incidentQuery.data) {
//     return (
//       <ScreenContainer>
//         <ScreenHeader title="Incident" showBack />
//         <ErrorState onRetry={() => incidentQuery.refetch()} />
//       </ScreenContainer>
//     );
//   }

//   const incident = incidentQuery.data;
//   const isOpen = incident.status === "open" || incident.status === "investigating";

//   return (
//     <ScreenContainer>
//       <ScreenHeader title={incident.title} showBack />

//       <Card className="mb-4">
//         <View className="flex-row items-center justify-between mb-2">
//           <Badge label={incident.status.replace("_", " ")} tone={statusTone[incident.status]} />
//           <Badge label={incident.severity} tone="warning" />
//         </View>
//         {incident.description ? <Text className="text-muted mb-2">{incident.description}</Text> : null}
//         <Text className="text-muted text-xs">
//           Triggered {new Date(incident.triggered_at).toLocaleString()}
//         </Text>
//         {incident.resolved_at ? (
//           <Text className="text-muted text-xs mt-1">
//             Resolved {new Date(incident.resolved_at).toLocaleString()}
//           </Text>
//         ) : null}
//       </Card>

//       <PressableCard onPress={() => router.push(`/(app)/incidents/${id}/timeline`)} className="mb-2">
//         <Text className="text-white font-medium">Timeline</Text>
//         <Text className="text-muted text-xs mt-0.5">
//           {incident.timeline_events.length} event{incident.timeline_events.length === 1 ? "" : "s"}
//         </Text>
//       </PressableCard>

//       <PressableCard onPress={() => router.push(`/(app)/incidents/${id}/evidence`)} className="mb-2">
//         <Text className="text-white font-medium">Evidence Board</Text>
//         <Text className="text-muted text-xs mt-0.5">
//           {incident.evidence_items.length} item{incident.evidence_items.length === 1 ? "" : "s"}
//         </Text>
//       </PressableCard>

//       {isOpen ? (
//         <PressableCard onPress={() => router.push(`/(app)/incidents/${id}/resolution`)} className="mb-2">
//           <Text className="text-white font-medium">Resolve Case</Text>
//           <Text className="text-muted text-xs mt-0.5">Close this incident out</Text>
//         </PressableCard>
//       ) : null}
//     </ScreenContainer>
//   );
// }
