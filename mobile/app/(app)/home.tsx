import { View, Text, Pressable } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useApi } from "@/hooks/useApi";
import { useAppUser } from "@/lib/auth/developmentMock";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { StatTile } from "@/components/ui/StatTile";
import { StatRow } from "@/components/ui/StatRow";
import { ListRow } from "@/components/ui/ListRow";
import { Card } from "@/components/ui/Card";
import { BrandHeader } from "@/components/ui/BrandHeader";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/StateViews";
import { colors } from "@/constants/theme";
import type { AnalyticsSummary, Device, Notification, SecurityScore } from "@/types/api";

const quickActions = [
  { key: "guard", label: "Guardian", icon: "shield" as const, href: "/(app)/guardian-mode" as const },
  { key: "pair", label: "Pair device", icon: "cpu" as const, href: "/(app)/device-pairing" as const },
  { key: "assets", label: "Assets", icon: "briefcase" as const, href: "/(app)/assets" as const },
  { key: "analytics", label: "Analytics", icon: "bar-chart-2" as const, href: "/(app)/analytics" as const },
];

export default function Home() {
  const api = useApi();
  const { user } = useAppUser();

  const devicesQuery = useQuery({
    queryKey: ["devices"],
    queryFn: () => api.get<Device[]>("/devices"),
  });
  const summaryQuery = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: () => api.get<AnalyticsSummary>("/analytics/summary"),
  });
  const scoreQuery = useQuery({
    queryKey: ["security-score"],
    queryFn: () => api.get<SecurityScore>("/gamification/security-score"),
  });
  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get<Notification[]>("/notifications"),
  });
  const unreadCount = (notificationsQuery.data ?? []).filter((n) => !n.is_read).length;

  const loading = devicesQuery.isLoading || summaryQuery.isLoading || scoreQuery.isLoading;
  const error = devicesQuery.error || summaryQuery.error || scoreQuery.error;
  const openIncidents = summaryQuery.data?.open_incidents ?? 0;
  const isProtected = openIncidents === 0;

  return (
    <ScreenContainer onRefresh={() => devicesQuery.refetch()} refreshing={devicesQuery.isRefetching}>
      <View className="flex-row items-center justify-between mt-2 mb-6">
        <BrandHeader size={34} />
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => router.push("/(app)/notifications")}
            className="w-10 h-10 rounded-full bg-surface dark:bg-[#15161C] border border-border dark:border-[#26282F] items-center justify-center"
          >
            <Feather name="bell" size={18} color={colors.text} />
            {unreadCount > 0 ? (
              <View
                className="absolute top-2 right-2 w-2 h-2 rounded-full"
                style={{ backgroundColor: colors.emergency }}
              />
            ) : null}
          </Pressable>
          <Pressable
            onPress={() => router.push("/(app)/profile")}
            className="w-10 h-10 rounded-full bg-surface dark:bg-[#15161C] border border-border dark:border-[#26282F] items-center justify-center"
          >
            <Text className="text-primary-light font-bold text-[14px]">
              {user?.firstName?.[0]?.toUpperCase() ?? "?"}
            </Text>
          </Pressable>
        </View>
      </View>

      <View className="mb-5">
        <Text className="text-muted dark:text-[#8A8D98] text-[15px]">Welcome back</Text>
        <Text className="text-[28px] font-bold text-foreground dark:text-white -mt-0.5">{user?.firstName ?? "Guardian"}</Text>
        <View className="flex-row items-center mt-2">
          <View
            className="w-2 h-2 rounded-full mr-2"
            style={{ backgroundColor: isProtected ? colors.safe : colors.warning }}
          />
          <Text className={`text-[13px] font-medium ${isProtected ? "text-safe-light" : "text-warning-light"}`}>
            {isProtected ? "All assets protected" : `${openIncidents} incident${openIncidents === 1 ? "" : "s"} need attention`}
          </Text>
        </View>
      </View>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={(error as Error).message} onRetry={() => devicesQuery.refetch()} /> : null}

      {!loading && !error ? (
        <>
          <StatRow className="mb-6">
            <StatTile label="Security score" value={scoreQuery.data?.score ?? 0} accent="text-primary-light" />
            <StatTile
              label="Open incidents"
              value={openIncidents}
              accent={openIncidents > 0 ? "text-emergency-light" : "text-safe-light"}
            />
          </StatRow>

          <View className="flex-row justify-between mb-6">
            {quickActions.map((action) => (
              <Pressable
                key={action.key}
                onPress={() => router.push(action.href)}
                className="items-center"
                style={{ width: 72 }}
              >
                <View className="w-14 h-14 rounded-full bg-surface dark:bg-[#15161C] border border-border dark:border-[#26282F] items-center justify-center mb-1.5">
                  <Feather name={action.icon} size={20} color={colors.text} />
                </View>
                <Text className="text-muted dark:text-[#8A8D98] text-[12px] text-center">{action.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text className="text-foreground dark:text-white font-semibold text-[17px] mb-1">Your devices</Text>
          {devicesQuery.data && devicesQuery.data.length === 0 ? (
            <EmptyState
              title="No devices paired yet"
              message="Pair a device to get started."
              actionLabel="Pair a device"
              onAction={() => router.push("/(app)/device-pairing")}
            />
          ) : (
            <Card className="mb-6">
              {devicesQuery.data?.map((device, i) => (
                <ListRow
                  key={device.id}
                  icon="cpu"
                  title={device.name}
                  subtitle={device.status === "online" ? "Online" : device.status === "degraded" ? "Degraded signal" : "Offline"}
                  onPress={() => router.push("/(app)/device-health")}
                  showChevron
                  isLast={i === (devicesQuery.data?.length ?? 0) - 1}
                  right={
                    <View
                      className="w-2 h-2 rounded-full mr-1"
                      style={{
                        backgroundColor:
                          device.status === "online" ? colors.safe : device.status === "degraded" ? colors.warning : colors.muted,
                      }}
                    />
                  }
                />
              ))}
            </Card>
          )}
        </>
      ) : null}
    </ScreenContainer>
  );
}
