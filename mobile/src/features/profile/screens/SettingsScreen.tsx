import { useEffect, useState } from "react";
import { Alert, Linking, Text, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { SectionTitle } from "@/src/components/ui/Display";
import { TextField, ToggleRow } from "@/src/components/ui/Form";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { ScreenHeader } from "@/src/components/ui/ScreenHeader";
import { useChangePassword, useMe, useTelegramLink, useUpdateMe } from "@/src/features/profile/api";
import { useAuth } from "@/src/lib/auth/AuthProvider";
import { HHMM, PHONE } from "@/src/lib/validation";

function ProfileSection() {
  const { data: me } = useMe();
  const update = useUpdateMe();
  const [name, setName] = useState("");
  const [block, setBlock] = useState("");
  const [room, setRoom] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!me) return;
    setName(me.full_name);
    setBlock(me.hostel_block ?? "");
    setRoom(me.room_number ?? "");
    setPhone(me.phone ?? "");
  }, [me]);

  const dirty =
    !!me && (name !== me.full_name || block !== (me.hostel_block ?? "") || room !== (me.room_number ?? "") || phone !== (me.phone ?? ""));

  const save = () => {
    if (name.trim().length < 2) return setError("Name is too short.");
    if (phone && !PHONE.test(phone.trim())) return setError("Enter a valid phone number.");
    setError(null);
    update.mutate(
      { full_name: name.trim(), hostel_block: block.trim().toUpperCase() || undefined, room_number: room.trim() || undefined, phone: phone.trim() || undefined },
      { onSuccess: () => Alert.alert("Saved", "Your profile is up to date.") },
    );
  };

  return (
    <>
      <SectionTitle title="Profile" />
      <TextField label="Full name" value={name} onChangeText={setName} />
      <View className="flex-row gap-3">
        <View className="flex-1">
          <TextField label="Block" autoCapitalize="characters" value={block} onChangeText={setBlock} />
        </View>
        <View className="flex-1">
          <TextField label="Room" value={room} onChangeText={setRoom} />
        </View>
      </View>
      <TextField label="Phone" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
      {error || update.error ? <Text className="text-emergency mb-2">{error ?? update.error?.message}</Text> : null}
      <Button label="Save profile" onPress={save} disabled={!dirty} loading={update.isPending} />
    </>
  );
}

function AlertsSection() {
  const { data: me } = useMe();
  const update = useUpdateMe();
  const [quietStart, setQuietStart] = useState("");
  const [quietEnd, setQuietEnd] = useState("");

  useEffect(() => {
    setQuietStart(me?.quiet_start ?? "");
    setQuietEnd(me?.quiet_end ?? "");
  }, [me?.quiet_start, me?.quiet_end]);

  if (!me) return null;
  const quietValid = (!quietStart && !quietEnd) || (HHMM.test(quietStart) && HHMM.test(quietEnd));

  return (
    <>
      <SectionTitle title="Alert delivery" />
      <Card className="py-1">
        <ToggleRow
          label="Push notifications"
          description={me.has_push_token ? "This phone is registered for push." : "Allow notifications to register this phone."}
          value={me.notify_push}
          onChange={(v) => update.mutate({ notify_push: v })}
        />
        <ToggleRow
          label="Telegram alerts"
          description={me.telegram_chat_id ? "Linked to your Telegram." : "Link Telegram below to enable."}
          value={me.notify_telegram}
          disabled={!me.telegram_chat_id}
          onChange={(v) => update.mutate({ notify_telegram: v })}
        />
      </Card>
      <Text className="text-muted text-xs mt-3 mb-2">
        Quiet hours mute device and reward notifications. Security alerts always come through.
      </Text>
      <View className="flex-row gap-3">
        <View className="flex-1">
          <TextField label="Quiet from" placeholder="23:00" maxLength={5} value={quietStart} onChangeText={setQuietStart} />
        </View>
        <View className="flex-1">
          <TextField label="Until" placeholder="07:00" maxLength={5} value={quietEnd} onChangeText={setQuietEnd} />
        </View>
      </View>
      {!quietValid ? <Text className="text-emergency text-xs mb-2">Use 24-hour HH:MM for both, or leave both empty.</Text> : null}
      <Button
        label="Save quiet hours"
        variant="secondary"
        disabled={!quietValid || (quietStart === (me.quiet_start ?? "") && quietEnd === (me.quiet_end ?? ""))}
        loading={update.isPending}
        onPress={() => update.mutate({ quiet_start: quietStart || null, quiet_end: quietEnd || null })}
      />
    </>
  );
}

function TelegramSection() {
  const { data: me } = useMe();
  const link = useTelegramLink();
  const qc = useQueryClient();

  const onLink = () =>
    link.mutate(undefined, {
      onSuccess: async ({ deep_link, link_code }) => {
        if (deep_link && (await Linking.canOpenURL(deep_link))) {
          await Linking.openURL(deep_link);
        } else {
          Alert.alert("Link Telegram", `Send this to the GuardianTag bot:\n\n/start ${link_code}`);
        }
        // The bot webhook links the chat; pick it up when the user comes back.
        setTimeout(() => qc.invalidateQueries({ queryKey: ["me"] }), 8000);
      },
      onError: (e) => Alert.alert("Couldn't create a link", e.message),
    });

  return (
    <>
      <SectionTitle title="Telegram" />
      <Card>
        <Text className="text-white font-medium">{me?.telegram_chat_id ? "✅ Telegram linked" : "Get alerts on Telegram too"}</Text>
        <Text className="text-muted text-sm mt-1 mb-3">
          A second channel that works even if app notifications are blocked.
        </Text>
        <Button label={me?.telegram_chat_id ? "Re-link Telegram" : "Link Telegram"} variant="secondary" loading={link.isPending} onPress={onLink} />
      </Card>
    </>
  );
}

function PasswordSection() {
  const change = useChangePassword();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    if (next.length < 8) return setError("New password must be at least 8 characters.");
    setError(null);
    change.mutate(
      { current_password: current, new_password: next },
      {
        onSuccess: () => {
          setCurrent("");
          setNext("");
          Alert.alert("Password changed");
        },
        onError: (e) => setError(e.message),
      },
    );
  };

  return (
    <>
      <SectionTitle title="Password" />
      <TextField label="Current password" secureTextEntry value={current} onChangeText={setCurrent} />
      <TextField label="New password" secureTextEntry value={next} onChangeText={setNext} />
      {error ? <Text className="text-emergency mb-2">{error}</Text> : null}
      <Button label="Change password" variant="secondary" disabled={!current || !next} loading={change.isPending} onPress={save} />
    </>
  );
}

export default function SettingsScreen() {
  const { signOut } = useAuth();

  const onSignOut = () =>
    Alert.alert("Sign out?", "You'll stop receiving live alerts on this phone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => signOut(),
      },
    ]);

  return (
    <ScreenContainer>
      <ScreenHeader title="Settings" showBack />
      <ProfileSection />
      <AlertsSection />
      <TelegramSection />
      <PasswordSection />
      <View className="mt-8">
        <Button label="Sign out" variant="danger" onPress={onSignOut} />
      </View>
      <Text className="text-muted text-xs text-center mt-4">GuardianTag · CS4504 PBL</Text>
    </ScreenContainer>
  );
}
