import { useState } from "react";
import { View, Text, TextInput } from "react-native";
import { router } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/hooks/useApi";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Button } from "@/components/ui/Button";
import type { Device } from "@/types/api";

export default function DevicePairing() {
  const api = useApi();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [deviceUid, setDeviceUid] = useState("");
  const [pairingCode, setPairingCode] = useState("");

  const pairMutation = useMutation({
    mutationFn: () =>
      api.post<Device>("/devices/pair", {
        name,
        device_uid: deviceUid,
        pairing_code: pairingCode,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      router.replace("/(app)/home");
    },
  });

  const canSubmit = name.trim().length > 0 && deviceUid.trim().length > 0 && pairingCode.trim().length > 0;

  return (
    <ScreenContainer>
      <ScreenHeader title="Pair a Device" showBack subtitle="Connect a new ESP32 sensor node" />

      <Text className="text-muted dark:text-[#8A8D98] mb-1">The pairing code is shown on the device's setup screen or printed on its label.</Text>

      <View className="mt-4">
        <Text className="text-foreground dark:text-white mb-1 mt-3">Device name</Text>
        <TextInput
          className="bg-surface dark:bg-[#15161C] text-foreground dark:text-white rounded-xl px-4 py-3 border border-border"
          placeholder="e.g. Room A101 Node"
          placeholderTextColor="#8B8B9E"
          value={name}
          onChangeText={setName}
        />

        <Text className="text-foreground dark:text-white mb-1 mt-3">Device ID</Text>
        <TextInput
          className="bg-surface dark:bg-[#15161C] text-foreground dark:text-white rounded-xl px-4 py-3 border border-border"
          placeholder="e.g. esp32-aa:bb:cc"
          placeholderTextColor="#8B8B9E"
          autoCapitalize="none"
          value={deviceUid}
          onChangeText={setDeviceUid}
        />

        <Text className="text-foreground dark:text-white mb-1 mt-3">Pairing code</Text>
        <TextInput
          className="bg-surface dark:bg-[#15161C] text-foreground dark:text-white rounded-xl px-4 py-3 border border-border"
          placeholder="6-digit code"
          placeholderTextColor="#8B8B9E"
          keyboardType="number-pad"
          value={pairingCode}
          onChangeText={setPairingCode}
        />

        {pairMutation.isError ? (
          <Text className="text-emergency mt-3">{(pairMutation.error as Error).message}</Text>
        ) : null}

        <View className="mt-6">
          <Button
            label="Pair Device"
            onPress={() => pairMutation.mutate()}
            loading={pairMutation.isPending}
            disabled={!canSubmit}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}
