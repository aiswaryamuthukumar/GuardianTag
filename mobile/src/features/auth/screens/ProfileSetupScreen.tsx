import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { Button } from "@/src/components/ui/Button";
import { TextField } from "@/src/components/ui/Form";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { useMe, useUpdateMe } from "@/src/features/profile/api";
import { useAuth } from "@/src/lib/auth/AuthProvider";
import { PHONE } from "@/src/lib/validation";

/** Second onboarding step: where the student lives, so wardens can find them in an emergency. */
export default function ProfileSetupScreen() {
  const { data: me } = useMe();
  const updateMe = useUpdateMe();
  const { signOut } = useAuth();
  const [fullName, setFullName] = useState("");
  const [block, setBlock] = useState("");
  const [room, setRoom] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!me) return;
    setFullName((v) => v || me.full_name);
    setBlock((v) => v || me.hostel_block || "");
    setRoom((v) => v || me.room_number || "");
    setPhone((v) => v || me.phone || "");
  }, [me]);

  const onSave = () => {
    if (fullName.trim().length < 2) return setError("Enter your name.");
    if (!block.trim()) return setError("Enter your hostel block (e.g. A).");
    if (!room.trim()) return setError("Enter your room number.");
    if (phone && !PHONE.test(phone.trim())) return setError("Enter a valid phone number.");
    setError(null);
    updateMe.mutate(
      {
        full_name: fullName.trim(),
        hostel_block: block.trim().toUpperCase(),
        room_number: room.trim(),
        phone: phone.trim() || undefined,
      },
      { onSuccess: () => router.replace("/") },
    );
  };

  return (
    <ScreenContainer>
      <View className="pt-10 pb-6">
        <Text className="text-primary-light font-semibold mb-2">One more step</Text>
        <Text className="text-3xl font-extrabold text-foreground mb-1">Where do you stay?</Text>
        <Text className="text-muted">Your block and room let your warden find you fast if an alert goes unanswered.</Text>
      </View>
      <TextField label="Full name" value={fullName} onChangeText={setFullName} />
      <View className="flex-row gap-3">
        <View className="flex-1">
          <TextField label="Hostel block" placeholder="A" autoCapitalize="characters" value={block} onChangeText={setBlock} />
        </View>
        <View className="flex-1">
          <TextField label="Room" placeholder="214" value={room} onChangeText={setRoom} />
        </View>
      </View>
      <TextField
        label="Phone (optional)"
        placeholder="+91 98765 43210"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        hint="Shown only to your hostel wardens."
      />
      {error || updateMe.error ? <Text className="text-emergency mb-3">{error ?? updateMe.error?.message}</Text> : null}
      <Button label="Continue" onPress={onSave} loading={updateMe.isPending} />
      <Button label="Not you? Sign out" variant="ghost" onPress={() => signOut()} className="mt-2" />
    </ScreenContainer>
  );
}
