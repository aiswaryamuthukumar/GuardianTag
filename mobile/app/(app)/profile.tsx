import { useEffect, useState } from "react";
import { View, Text, TextInput } from "react-native";
import { router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/hooks/useApi";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingState, ErrorState } from "@/components/ui/StateViews";
import type { GuardianLevel, SecurityScore, User } from "@/types/api";

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

  const meQuery = useQuery({ queryKey: ["me"], queryFn: () => api.get<User>("/auth/me") });
  const scoreQuery = useQuery({
    queryKey: ["security-score"],
    queryFn: () => api.get<SecurityScore>("/gamification/security-score"),
  });

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

  return (
    <ScreenContainer>
      <ScreenHeader title="Profile" showBack />

      <Card className="mb-4 items-center py-6">
        <View className="w-16 h-16 rounded-full bg-primary/20 items-center justify-center mb-3">
          <Text className="text-2xl text-primary-light font-bold">
            {meQuery.data?.full_name?.[0]?.toUpperCase() ?? "?"}
          </Text>
        </View>
        <Text className="text-white font-semibold text-lg">{meQuery.data?.full_name}</Text>
        <Text className="text-muted">{meQuery.data?.email}</Text>
        {scoreQuery.data ? (
          <View className="mt-2">
            <Badge label={levelLabels[scoreQuery.data.level]} tone="primary" />
          </View>
        ) : null}
      </Card>

      <Text className="text-white mb-1">Full name</Text>
      <TextInput
        className="bg-surface text-white rounded-xl px-4 py-3 border border-border mb-3"
        value={fullName}
        onChangeText={setFullName}
        placeholderTextColor="#8B8B9E"
      />
      <Text className="text-white mb-1">Room number</Text>
      <TextInput
        className="bg-surface text-white rounded-xl px-4 py-3 border border-border mb-3"
        value={roomNumber}
        onChangeText={setRoomNumber}
        placeholder="e.g. A101"
        placeholderTextColor="#8B8B9E"
      />
      <Text className="text-white mb-1">Phone</Text>
      <TextInput
        className="bg-surface text-white rounded-xl px-4 py-3 border border-border mb-4"
        value={phone}
        onChangeText={setPhone}
        placeholder="Optional"
        placeholderTextColor="#8B8B9E"
        keyboardType="phone-pad"
      />

      <Button label="Save Changes" onPress={() => updateMutation.mutate()} loading={updateMutation.isPending} />

      <View className="mt-3">
        <Button label="Settings" variant="secondary" onPress={() => router.push("/(app)/settings")} />
      </View>
    </ScreenContainer>
  );
}
