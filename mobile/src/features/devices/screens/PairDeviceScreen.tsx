import { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { TextField } from "@/src/components/ui/Form";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { ScreenHeader } from "@/src/components/ui/ScreenHeader";
import { usePairDevice } from "@/src/features/devices/api";
import { ApiError } from "@/src/lib/api/client";

const UID = /^[A-Za-z0-9_-]{4,64}$/;

const STEPS = [
  "Power on the GuardianTag unit and let it join hostel Wi-Fi (the LED stops blinking).",
  "Read its Device UID from the sticker or the serial monitor (DEVICE_UID in secrets.h).",
  "Enter it below. Heartbeats start arriving within a minute.",
];

export default function PairDeviceScreen() {
  const pair = usePairDevice();
  const [name, setName] = useState("");
  const [uid, setUid] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onPair = () => {
    if (name.trim().length < 2) return setError("Give the device a name, e.g. 'Backpack tag'.");
    if (!UID.test(uid.trim())) return setError("Device UID should be 4-64 letters, numbers, - or _.");
    if (!/^\d{4,8}$/.test(code.trim())) return setError("Pairing code is 4-8 digits.");
    setError(null);
    pair.mutate(
      { name: name.trim(), device_uid: uid.trim(), pairing_code: code.trim() },
      {
        onSuccess: (device) => router.replace(`/devices/${device.id}`),
        onError: (e) =>
          setError(e instanceof ApiError && e.status === 409 ? "That device is already paired to an account." : e.message),
      },
    );
  };

  return (
    <ScreenContainer>
      <ScreenHeader title="Pair device" subtitle="Link an ESP32 GuardianTag unit" showBack />
      <Card className="mb-5">
        {STEPS.map((step, i) => (
          <View key={step} className="flex-row mb-2 last:mb-0">
            <View className="w-6 h-6 rounded-full bg-primary/25 items-center justify-center mr-3">
              <Text className="text-primary-light text-xs font-bold">{i + 1}</Text>
            </View>
            <Text className="text-muted flex-1">{step}</Text>
          </View>
        ))}
      </Card>
      <TextField label="Device name" placeholder="Backpack tag" value={name} onChangeText={setName} />
      <TextField label="Device UID" placeholder="guardiantag-01" autoCapitalize="none" value={uid} onChangeText={setUid} />
      <TextField
        label="Pairing code"
        placeholder="123456"
        keyboardType="number-pad"
        maxLength={8}
        value={code}
        onChangeText={setCode}
        hint="The PIN on the unit's label. The prototype firmware accepts any 4-8 digits."
      />
      {error ? <Text className="text-emergency mb-3">{error}</Text> : null}
      <Button label="Pair device" onPress={onPair} loading={pair.isPending} />
    </ScreenContainer>
  );
}
