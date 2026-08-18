import { useEffect, useState } from "react";
import { View, Text, TextInput } from "react-native";
import { router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/hooks/useApi";
import { useAppAuth } from "@/lib/auth/developmentMock";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Card } from "@/components/ui/Card";
import { StatRow } from "@/components/ui/StatRow";
import { StatTile } from "@/components/ui/StatTile";
import { ListRow } from "@/components/ui/ListRow";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingState, ErrorState } from "@/components/ui/StateViews";
import type { Asset, Device, GuardianLevel, SecurityScore, User } from "@/types/api";

const levelLabels: Record<GuardianLevel, string> = {
  rookie: "Rookie",
  watchman: "Watchman",
  guardian: "Guardian",
  sentinel: "Sentinel",
  hostel_protector: "Hostel Protector",
};

export default function Profile() {
  const api = useApi();
  const queryClient = useQueryClient();
  const { signOut } = useAppAuth();

  const meQuery = useQuery({ queryKey: ["me"], queryFn: () => api.get<User>("/auth/me") });
  const scoreQuery = useQuery({
    queryKey: ["security-score"],
    queryFn: () => api.get<SecurityScore>("/gamification/security-score"),
  });
  const assetsQuery = useQuery({ queryKey: ["assets"], queryFn: () => api.get<Asset[]>("/assets") });
  const devicesQuery = useQuery({ queryKey: ["devices"], queryFn: () => api.get<Device[]>("/devices") });

  const [fullName, setFullName] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (meQuery.data) {
      setFullName(meQuery.data.full_name);
      setRoomNumber(meQuery.data.room_number ?? "");
      setPhone(meQuery.data.phone ?? "");
    }
  }, [meQuery.data]);

  const updateMutation = useMutation({
    mutationFn: () =>
      api.patch<User>("/auth/me", {
        full_name: fullName,
        room_number: roomNumber || null,
        phone: phone || null,
      }),
    onSuccess: (updated) => queryClient.setQueryData(["me"], updated),
  });

  if (meQuery.isLoading) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Profile" showBack />
        <LoadingState />
      </ScreenContainer>
    );
  }

  if (meQuery.error) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Profile" showBack />
        <ErrorState onRetry={() => meQuery.refetch()} />
      </ScreenContainer>
    );
  }

  const armedCount = (assetsQuery.data ?? []).filter((a) => a.is_armed).length;

  return (
    <ScreenContainer>
      <ScreenHeader title="Profile" showBack subtitle="Your account" />

      <View className="items-center mb-5">
        <View className="w-20 h-20 rounded-full bg-surface-alt border border-border items-center justify-center mb-3">
          <Text className="text-[26px] text-primary-light font-bold">
            {meQuery.data?.full_name?.[0]?.toUpperCase() ?? "?"}
          </Text>
        </View>
        <Text className="text-foreground font-bold text-[19px]">{meQuery.data?.full_name}</Text>
        <Text className="text-muted text-[13px] mt-0.5">{meQuery.data?.email}</Text>
        {scoreQuery.data ? (
          <View className="mt-2">
            <Badge label={levelLabels[scoreQuery.data.level]} tone="primary" />
          </View>
        ) : null}
      </View>

      <StatRow className="mb-6">
        <StatTile label="XP" value={scoreQuery.data?.score ?? 0} accent="text-primary-light" />
        <StatTile label="Protected assets" value={`${armedCount}/${assetsQuery.data?.length ?? 0}`} accent="text-safe-light" />
        <StatTile label="Devices" value={devicesQuery.data?.length ?? 0} accent="text-foreground" />
      </StatRow>

      <Text className="text-foreground font-semibold text-[16px] mb-2">Edit profile</Text>
      <Card className="mb-6">
        <Text className="text-muted text-[13px] mb-1.5">Full name</Text>
        <TextInput
          className="bg-surface-alt text-foreground rounded-xl px-4 py-3 border border-border mb-3 text-[15px]"
          value={fullName}
          onChangeText={setFullName}
          placeholderTextColor="#6B6E78"
        />
        <Text className="text-muted text-[13px] mb-1.5">Room number</Text>
        <TextInput
          className="bg-surface-alt text-foreground rounded-xl px-4 py-3 border border-border mb-3 text-[15px]"
          value={roomNumber}
          onChangeText={setRoomNumber}
          placeholder="e.g. A101"
          placeholderTextColor="#6B6E78"
        />
        <Text className="text-muted text-[13px] mb-1.5">Phone</Text>
        <TextInput
          className="bg-surface-alt text-foreground rounded-xl px-4 py-3 border border-border mb-4 text-[15px]"
          value={phone}
          onChangeText={setPhone}
          placeholder="Optional"
          placeholderTextColor="#6B6E78"
          keyboardType="phone-pad"
        />
        <Button label="Save changes" onPress={() => updateMutation.mutate()} loading={updateMutation.isPending} />
      </Card>

      <Text className="text-foreground font-semibold text-[16px] mb-2">Quick links</Text>
      <Card className="mb-6">
        <ListRow icon="bar-chart-2" title="Analytics" onPress={() => router.push("/(app)/analytics")} showChevron />
        <ListRow icon="briefcase" title="Assets" onPress={() => router.push("/(app)/assets")} showChevron />
        <ListRow icon="map-pin" title="Hostel map" onPress={() => router.push("/(app)/hostel-map")} showChevron />
        <ListRow icon="settings" title="Settings" onPress={() => router.push("/(app)/settings")} showChevron isLast />
      </Card>

      <Card>
        <ListRow icon="log-out" title="Sign out" onPress={() => signOut()} tone="emergency" isLast />
      </Card>
    </ScreenContainer>
  );
}
