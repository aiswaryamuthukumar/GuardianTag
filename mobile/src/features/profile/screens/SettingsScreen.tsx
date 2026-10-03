import { useEffect, useState } from "react";
import { Linking, Text, View } from "react-native";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { GroupLabel } from "@/src/components/ui/Display";
import { TextField, ToggleRow } from "@/src/components/ui/Form";
import { ListRow } from "@/src/components/ui/ListRow";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { ScreenHeader } from "@/src/components/ui/ScreenHeader";
import { useChangePassword, useMe, useTelegramLink, useUpdateMe } from "@/src/features/profile/api";
import { toastBus } from "@/src/lib/toast";
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
      {
        full_name: name.trim(),
        hostel_block: block.trim().toUpperCase() || undefined,
        room_number: room.trim() || undefined,
        phone: phone.trim() || undefined,
      },
      { onSuccess: () => toastBus.show({ icon: "check-circle", title: "Profile saved", tone: "safe" }) },
    );
  };

  return (
    <>
      <GroupLabel label="Profile" />
      <Card>
        <TextField label="Full name" value={name} onChangeText={setName} />
        <View className="flex-row gap-3">
          <View className="flex-1">
            <TextField label={me?.role === "warden" ? "Block you manage" : "Hostel block"} autoCapitalize="characters" value={block} onChangeText={setBlock} />
          </View>
          {me?.role !== "warden" ? (
            <View className="flex-1">
              <TextField label="Room" value={room} onChangeText={setRoom} />
            </View>
          ) : null}
        </View>
        <TextField label="Phone" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
        {error || update.error ? <Text className="text-emergency text-[13px] mb-2">{error ?? update.error?.message}</Text> : null}
        <Button label="Save changes" onPress={save} disabled={!dirty} loading={update.isPending} />
      </Card>
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
  const quietChanged = quietStart !== (me.quiet_start ?? "") || quietEnd !== (me.quiet_end ?? "");

  return (
    <>
      <GroupLabel label="Notifications" />
      <Card className="py-1">
        <ToggleRow
          icon="bell"
          label="Push notifications"
          description={me.has_push_token ? "This phone is registered for push" : "Allow notifications to register this phone"}
          value={me.notify_push}
          onChange={(v) => update.mutate({ notify_push: v })}
        />
        <ToggleRow
          icon="send"
          label="Telegram alerts"
          description={me.telegram_chat_id ? "Sent to your linked Telegram" : "Link Telegram below to enable"}
          value={me.notify_telegram}
          disabled={!me.telegram_chat_id}
          onChange={(v) => update.mutate({ notify_telegram: v })}
          isLast
        />
      </Card>

      <GroupLabel label="Quiet hours" />
      <Card>
        <Text className="text-muted text-[13px] mb-3">
          Mutes device and reward notifications. Security alerts always come through.
        </Text>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <TextField label="From" placeholder="23:00" maxLength={5} value={quietStart} onChangeText={setQuietStart} />
          </View>
          <View className="flex-1">
            <TextField label="Until" placeholder="07:00" maxLength={5} value={quietEnd} onChangeText={setQuietEnd} />
          </View>
        </View>
        {!quietValid ? <Text className="text-emergency text-[12px] mb-2">Use 24-hour HH:MM for both, or leave both empty.</Text> : null}
        <Button
          label="Save quiet hours"
          variant="secondary"
          disabled={!quietValid || !quietChanged}
          loading={update.isPending}
          onPress={() =>
            update.mutate(
              { quiet_start: quietStart || null, quiet_end: quietEnd || null },
              { onSuccess: () => toastBus.show({ icon: "moon", title: "Quiet hours saved", tone: "primary" }) },
            )
          }
        />
      </Card>
    </>
  );
}

function TelegramSection() {
  const { data: me } = useMe();
  const link = useTelegramLink();
  const qc = useQueryClient();
  const linked = !!me?.telegram_chat_id;

  const onLink = () =>
    link.mutate(undefined, {
      onSuccess: async ({ deep_link }) => {
        if (deep_link && (await Linking.canOpenURL(deep_link))) await Linking.openURL(deep_link);
        // The bot webhook links the chat; pick it up when the user comes back.
        setTimeout(() => qc.invalidateQueries({ queryKey: ["me"] }), 8000);
      },
      onError: (e) => toastBus.show({ icon: "alert-circle", title: "Couldn't create a link", subtitle: e.message, tone: "warning" }),
    });

  return (
    <>
      <GroupLabel label="Emergency contacts" />
      <Card className="py-1">
        <ListRow
          icon="send"
          title="Telegram alerts"
          subtitle={linked ? "Linked to your account" : "A second channel that works even if app notifications are blocked"}
          right={<Badge label={linked ? "Linked" : "Not linked"} tone={linked ? "safe" : "muted"} />}
          onPress={onLink}
          showChevron
          isLast
        />
      </Card>
      {link.data ? (
        <Text className="text-muted text-[12px] mt-2 px-1">Opened Telegram. Or send /start {link.data.link_code} to the bot.</Text>
      ) : null}
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
          toastBus.show({ icon: "lock", title: "Password changed", tone: "safe" });
        },
        onError: (e) => setError(e.message),
      },
    );
  };

  return (
    <>
      <GroupLabel label="Security" />
      <Card>
        <TextField label="Current password" secureTextEntry value={current} onChangeText={setCurrent} />
        <TextField label="New password" secureTextEntry value={next} onChangeText={setNext} />
        {error ? <Text className="text-emergency text-[13px] mb-2">{error}</Text> : null}
        <Button label="Change password" variant="secondary" disabled={!current || !next} loading={change.isPending} onPress={save} />
      </Card>
    </>
  );
}

export default function SettingsScreen() {
  return (
    <ScreenContainer>
      <ScreenHeader title="Settings" showBack subtitle="Profile, alerts and security" />
      <ProfileSection />
      <AlertsSection />
      <TelegramSection />
      <PasswordSection />
      <GroupLabel label="Support" />
      <Card className="py-1">
        <ListRow icon="help-circle" title="Help & FAQ" onPress={() => router.push("/help")} showChevron />
        <ListRow icon="info" title="About GuardianTag" onPress={() => router.push("/about")} showChevron isLast />
      </Card>
    </ScreenContainer>
  );
}
