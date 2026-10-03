import { Pressable, Switch, Text, View } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { SectionTitle } from "@/src/components/ui/Display";
import { ListRow } from "@/src/components/ui/ListRow";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { ScreenHeader } from "@/src/components/ui/ScreenHeader";
import { ShieldScanner } from "@/src/components/ui/ShieldScanner";
import { EmptyState, ErrorState, LoadingState } from "@/src/components/ui/StateViews";
import { useArmAll, useAssets, useSetArmed } from "@/src/features/assets/api";
import { useDemoAction } from "@/src/features/demo/api";
import { useDevices } from "@/src/features/devices/api";
import { ScheduleRow } from "@/src/features/guardian/ScheduleRow";
import { useSchedules } from "@/src/features/guardian/api";
import { categoryIcons } from "@/src/lib/format";
import { toastBus } from "@/src/lib/toast";
import { colors } from "@/src/theme";

/** Guardian Mode: the master switch, every belonging's armed state, and auto-arm schedules. */
export default function GuardianScreen() {
  const assets = useAssets();
  const devices = useDevices();
  const schedules = useSchedules();
  const setArmed = useSetArmed();
  const armAll = useArmAll();
  const demo = useDemoAction();

  const list = assets.data ?? [];
  const armed = list.filter((a) => a.is_armed).length;
  const isActive = armed > 0;
  const deviceName = (id: string | null) => devices.data?.find((d) => d.id === id)?.name;
  const assetName = (id: string) => list.find((a) => a.id === id)?.name;

  const toggle = (id: string, name: string, value: boolean) =>
    setArmed.mutate(
      { id, armed: value },
      {
        onSuccess: () =>
          toastBus.show(
            value
              ? { icon: "shield", title: "Guardian protected", subtitle: name, tone: "primary" }
              : { icon: "shield-off", title: "Guardian disarmed", subtitle: name, tone: "warning" },
          ),
      },
    );

  const testAlert = () =>
    demo.simulate.mutate(undefined, {
      onSuccess: (result) => {
        if (result.ignored) {
          toastBus.show({ icon: "shield-off", title: "Trigger ignored", subtitle: "Nothing on that device is armed", tone: "warning" });
        }
        // A real incident opens the emergency screen by itself, over the live socket.
      },
      onError: (e) => toastBus.show({ icon: "alert-circle", title: e.message, tone: "warning" }),
    });

  return (
    <ScreenContainer onRefresh={() => { assets.refetch(); schedules.refetch(); }} refreshing={assets.isRefetching}>
      <ScreenHeader
        title="Guardian"
        right={
          <Pressable onPress={() => router.push("/belongings/new")} accessibilityRole="button">
            <Text className="text-primary-light text-[14px] font-medium">Add item</Text>
          </Pressable>
        }
      />

      {assets.isLoading ? <LoadingState /> : null}
      {assets.error ? <ErrorState message={assets.error.message} onRetry={assets.refetch} /> : null}

      {!assets.isLoading && !assets.error ? (
        <>
          <View className="items-center py-6 mb-2">
            <ShieldScanner active={isActive} tone={isActive ? "primary" : "muted"} size={128} />
            <Text className="text-foreground font-semibold text-[18px] mt-4">
              {isActive ? "Guardian Mode is active" : "Nothing is armed"}
            </Text>
            <Text className="text-muted text-center mt-1 text-[14px]">
              {armed} of {list.length} belongings are being monitored
            </Text>
            {list.length ? (
              <View className="flex-row gap-3 mt-4 w-full">
                <Button
                  label="Arm all"
                  className="flex-1"
                  disabled={armed === list.length}
                  loading={armAll.isPending && armAll.variables === true}
                  onPress={() => armAll.mutate(true)}
                />
                <Button
                  label="Disarm all"
                  variant="secondary"
                  className="flex-1"
                  disabled={!armed}
                  loading={armAll.isPending && armAll.variables === false}
                  onPress={() => armAll.mutate(false)}
                />
              </View>
            ) : null}
          </View>

          {list.length === 0 ? (
            <EmptyState
              title="No belongings to guard"
              message="Add your bag, laptop or locker and link it to a device."
              actionLabel="Add belonging"
              onAction={() => router.push("/belongings/new")}
            />
          ) : (
            <Card className="py-1">
              {list.map((asset, i) => (
                <ListRow
                  key={asset.id}
                  icon={categoryIcons[asset.category]}
                  title={asset.name}
                  subtitle={`${asset.is_armed ? "Armed · monitoring" : "Not monitored"} · ${deviceName(asset.device_id) ?? "no device"}`}
                  onPress={() => router.push(`/belongings/${asset.id}`)}
                  isLast={i === list.length - 1}
                  right={
                    <Switch
                      value={asset.is_armed}
                      disabled={setArmed.isPending && setArmed.variables?.id === asset.id}
                      onValueChange={(value) => toggle(asset.id, asset.name, value)}
                      trackColor={{ false: colors.surfaceAlt, true: colors.primary }}
                      thumbColor="#FFFFFF"
                      accessibilityLabel={`Arm ${asset.name}`}
                    />
                  }
                />
              ))}
            </Card>
          )}

          <SectionTitle title="Auto-arm schedules" action={list.length ? "New" : undefined} onAction={() => router.push("/schedules/new")} />
          {schedules.data?.length ? (
            <>
              {schedules.data.map((s) => (
                <ScheduleRow key={s.id} schedule={s} assetName={assetName(s.asset_id)} />
              ))}
              <Text className="text-muted text-[12px] mt-1">Tap to edit · long-press to delete</Text>
            </>
          ) : (
            <Card>
              <Text className="text-muted text-[14px]">
                Arm belongings automatically while you&apos;re away, e.g. weekdays 09:00–17:00 during classes, or overnight.
              </Text>
            </Card>
          )}

          <Pressable
            onPress={testAlert}
            disabled={!devices.data?.length || demo.simulate.isPending}
            accessibilityRole="button"
            className={`flex-row items-center justify-center py-3 border border-border rounded-xl mt-6 ${!devices.data?.length ? "opacity-40" : ""}`}
          >
            <Feather name="zap" size={16} color={colors.mutedLight} style={{ marginRight: 8 }} />
            <Text className="text-muted-light text-[14px] font-medium">
              {demo.simulate.isPending ? "Sending trigger…" : "Send a test alert through the system"}
            </Text>
          </Pressable>
        </>
      ) : null}
    </ScreenContainer>
  );
}
