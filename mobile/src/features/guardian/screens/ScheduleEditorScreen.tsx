import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Button } from "@/src/components/ui/Button";
import { SectionTitle } from "@/src/components/ui/Display";
import { Segmented, TextField } from "@/src/components/ui/Form";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { ScreenHeader } from "@/src/components/ui/ScreenHeader";
import { useAssets } from "@/src/features/assets/api";
import { useSaveSchedule, useSchedules } from "@/src/features/guardian/api";
import { WEEKDAYS, hhmm } from "@/src/lib/format";
import { HHMM } from "@/src/lib/validation";

const PRESETS = [
  { label: "Class hours", start: "09:00", end: "17:00", mask: 0b0011111 },
  { label: "Overnight", start: "23:00", end: "07:00", mask: 0b1111111 },
  { label: "Weekend trip", start: "08:00", end: "22:00", mask: 0b1100000 },
];

export default function ScheduleEditorScreen({ id, assetId }: { id?: string; assetId?: string }) {
  const assets = useAssets();
  const schedules = useSchedules();
  const save = useSaveSchedule(id);
  const existing = schedules.data?.find((s) => s.id === id);

  const [asset, setAsset] = useState(assetId ?? "");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");
  const [mask, setMask] = useState(0b0011111);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!existing) return;
    setAsset(existing.asset_id);
    setStart(hhmm(existing.start_time));
    setEnd(hhmm(existing.end_time));
    setMask(existing.days_mask);
  }, [existing]);

  useEffect(() => {
    if (!asset && assets.data?.[0]) setAsset(assets.data[0].id);
  }, [asset, assets.data]);

  const onSave = () => {
    if (!asset) return setError("Pick a belonging.");
    if (!HHMM.test(start) || !HHMM.test(end)) return setError("Times must be 24-hour HH:MM, e.g. 09:00.");
    if (start === end) return setError("Start and end must differ.");
    if (!mask) return setError("Pick at least one day.");
    setError(null);
    save.mutate(
      { asset_id: asset, start_time: start, end_time: end, days_mask: mask, enabled: true },
      { onSuccess: () => router.back() },
    );
  };

  return (
    <ScreenContainer>
      <ScreenHeader title={id ? "Edit schedule" : "New schedule"} subtitle="Auto-arm on a weekly timetable" showBack />

      {!id ? (
        <>
          <Text className="text-muted text-xs font-medium mb-1.5 uppercase tracking-wide">Belonging</Text>
          <Segmented options={(assets.data ?? []).map((a) => ({ value: a.id, label: a.name }))} value={asset} onChange={setAsset} />
          <SectionTitle title="Quick presets" />
          <View className="flex-row flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Pressable
                key={p.label}
                onPress={() => { setStart(p.start); setEnd(p.end); setMask(p.mask); }}
                className="bg-surface-alt border border-border rounded-xl px-3 py-2"
              >
                <Text className="text-white text-sm">{p.label}</Text>
                <Text className="text-muted text-xs">{p.start}–{p.end}</Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}

      <SectionTitle title="Time window" />
      <View className="flex-row gap-3">
        <View className="flex-1">
          <TextField label="Arm at" value={start} onChangeText={setStart} placeholder="09:00" maxLength={5} keyboardType="numbers-and-punctuation" />
        </View>
        <View className="flex-1">
          <TextField label="Disarm at" value={end} onChangeText={setEnd} placeholder="17:00" maxLength={5} keyboardType="numbers-and-punctuation" />
        </View>
      </View>
      {end < start && HHMM.test(end) ? (
        <Text className="text-muted text-xs -mt-1 mb-2">Runs overnight into the next day.</Text>
      ) : null}

      <SectionTitle title="Days" />
      <View className="flex-row justify-between">
        {WEEKDAYS.map((day, i) => {
          const on = !!(mask & (1 << i));
          return (
            <Pressable
              key={day}
              onPress={() => setMask(mask ^ (1 << i))}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              className={`w-11 h-11 rounded-full items-center justify-center border ${on ? "bg-primary border-primary" : "bg-surface border-border"}`}
            >
              <Text className={`text-xs font-semibold ${on ? "text-white" : "text-muted"}`}>{day.slice(0, 2)}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text className="text-muted text-xs mt-4 mb-5">
        Times are hostel local time. A manual arm/disarm in between is respected until the next window change.
      </Text>
      {error || save.error ? <Text className="text-emergency mb-3">{error ?? save.error?.message}</Text> : null}
      <Button label="Save schedule" onPress={onSave} loading={save.isPending} />
    </ScreenContainer>
  );
}
