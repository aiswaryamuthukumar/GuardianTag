import { Image, Switch, Text, View } from "react-native";
import { router } from "expo-router";
import { Ring } from "@/src/components/charts/Ring";
import { Button } from "@/src/components/ui/Button";
import { Card, PressableCard } from "@/src/components/ui/Card";
import { SectionTitle } from "@/src/components/ui/Display";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { ScreenHeader } from "@/src/components/ui/ScreenHeader";
import { EmptyState, LoadingState } from "@/src/components/ui/StateViews";
import { useArmAll, useAssets, useSetArmed } from "@/src/features/assets/api";
import { useDevices } from "@/src/features/devices/api";
import { ScheduleRow } from "@/src/features/guardian/ScheduleRow";
import { useSchedules } from "@/src/features/guardian/api";
import { fileUrl } from "@/src/lib/api/client";
import { categoryIcons } from "@/src/lib/format";
import { colors } from "@/src/theme";

/** Guardian Mode: the master switch, every belonging's armed state, and auto-arm schedules. */
export default function GuardianScreen() {
  const assets = useAssets();
  const devices = useDevices();
  const schedules = useSchedules();
  const setArmed = useSetArmed();
  const armAll = useArmAll();

  const list = assets.data ?? [];
  const armed = list.filter((a) => a.is_armed).length;
  const pct = list.length ? (armed / list.length) * 100 : 0;
  const deviceName = (id: string | null) => devices.data?.find((d) => d.id === id)?.name;
  const assetName = (id: string) => list.find((a) => a.id === id)?.name;

  return (
    <ScreenContainer onRefresh={() => { assets.refetch(); schedules.refetch(); }} refreshing={assets.isRefetching}>
      <ScreenHeader title="Guardian Mode" subtitle="Choose what's protected, and when" />

      <Card className="flex-row items-center">
        <Ring percent={pct} label="armed" color={armed ? colors.safe : colors.muted} />
        <View className="flex-1 ml-4">
          <Text className="text-white text-lg font-bold">
            {armed} of {list.length} armed
          </Text>
          <Text className="text-muted text-sm mb-3">
            The backend only raises alerts for armed belongings.
          </Text>
          <View className="flex-row gap-2">
            <Button label="Arm all" size="sm" variant="safe" className="flex-1" disabled={!list.length || armed === list.length} loading={armAll.isPending && armAll.variables === true} onPress={() => armAll.mutate(true)} />
            <Button label="Disarm all" size="sm" variant="secondary" className="flex-1" disabled={!armed} loading={armAll.isPending && armAll.variables === false} onPress={() => armAll.mutate(false)} />
          </View>
        </View>
      </Card>

      <SectionTitle title="Belongings" action="Add" onAction={() => router.push("/assets/new")} />
      {assets.isLoading ? (
        <LoadingState />
      ) : list.length ? (
        list.map((asset) => (
          <PressableCard key={asset.id} onPress={() => router.push(`/assets/${asset.id}`)} className={`mb-2 flex-row items-center ${asset.is_armed ? "border-safe/40" : ""}`}>
            {asset.photo_url ? (
              <Image source={{ uri: fileUrl(asset.photo_url) }} className="w-11 h-11 rounded-xl mr-3" />
            ) : (
              <View className="w-11 h-11 rounded-xl bg-surface-alt items-center justify-center mr-3">
                <Text className="text-xl">{categoryIcons[asset.category]}</Text>
              </View>
            )}
            <View className="flex-1">
              <Text className="text-white font-semibold">{asset.name}</Text>
              <Text className="text-muted text-xs">
                {deviceName(asset.device_id) ?? "No device linked"}
                {asset.location ? ` · ${asset.location}` : ""}
              </Text>
            </View>
            <Switch
              value={asset.is_armed}
              onValueChange={(value) => setArmed.mutate({ id: asset.id, armed: value })}
              trackColor={{ false: colors.border, true: colors.safe }}
              thumbColor="#fff"
              accessibilityLabel={`Arm ${asset.name}`}
            />
          </PressableCard>
        ))
      ) : (
        <EmptyState title="Nothing to guard yet" message="Add your bag, laptop or locker and link it to a device." actionLabel="Add belonging" onAction={() => router.push("/assets/new")} />
      )}

      <SectionTitle
        title="Auto-arm schedules"
        action={list.length ? "New schedule" : undefined}
        onAction={() => router.push("/schedules/new")}
      />
      {schedules.data?.length ? (
        <>
          {schedules.data.map((s) => (
            <ScheduleRow key={s.id} schedule={s} assetName={assetName(s.asset_id)} />
          ))}
          <Text className="text-muted text-xs mt-1">Tap to edit · long-press to delete</Text>
        </>
      ) : (
        <Card>
          <Text className="text-muted">
            Arm belongings automatically while you're away, e.g. weekdays 9:00–17:00 during classes, or overnight.
          </Text>
        </Card>
      )}
    </ScreenContainer>
  );
}
