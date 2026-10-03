import { useState } from "react";
import { Image, Text, View } from "react-native";
import { router } from "expo-router";
import { Button } from "@/src/components/ui/Button";
import { ConfirmSheet } from "@/src/components/ui/ConfirmSheet";
import { Card } from "@/src/components/ui/Card";
import { KeyValue, SectionTitle } from "@/src/components/ui/Display";
import { ToggleRow } from "@/src/components/ui/Form";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { ScreenHeader } from "@/src/components/ui/ScreenHeader";
import { ErrorState, LoadingState } from "@/src/components/ui/StateViews";
import { EventRow } from "@/src/features/activity/EventRow";
import { useEvents } from "@/src/features/activity/api";
import { useAsset, useDeleteAsset, useSetArmed } from "@/src/features/assets/api";
import { useDevices } from "@/src/features/devices/api";
import { ScheduleRow } from "@/src/features/guardian/ScheduleRow";
import { useSchedules } from "@/src/features/guardian/api";
import { fileUrl } from "@/src/lib/api/client";
import { categoryLabels } from "@/src/lib/format";

export default function AssetDetailScreen({ id }: { id: string }) {
  const asset = useAsset(id);
  const devices = useDevices();
  const schedules = useSchedules();
  const events = useEvents({ asset_id: id, limit: 20 });
  const setArmed = useSetArmed();
  const [confirming, setConfirming] = useState(false);
  const remove = useDeleteAsset(id);

  if (asset.isLoading) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Belonging" showBack />
        <LoadingState />
      </ScreenContainer>
    );
  }
  if (!asset.data) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Belonging" showBack />
        <ErrorState message={asset.error?.message ?? "Not found"} onRetry={asset.refetch} />
      </ScreenContainer>
    );
  }

  const a = asset.data;
  const device = devices.data?.find((d) => d.id === a.device_id);
  const mySchedules = (schedules.data ?? []).filter((s) => s.asset_id === id);

  const confirmDelete = () => setConfirming(true);

  return (
    <ScreenContainer onRefresh={() => { asset.refetch(); events.refetch(); }} refreshing={asset.isRefetching}>
      <ScreenHeader
        title={a.name}
        subtitle={categoryLabels[a.category]}
        showBack
        right={<Button label="Edit" size="sm" variant="secondary" onPress={() => router.push({ pathname: "/belongings/new", params: { id } })} />}
      />

      {a.photo_url ? (
        <Image source={{ uri: fileUrl(a.photo_url) }} className="w-full h-48 rounded-2xl mb-3" resizeMode="cover" />
      ) : null}

      <Card className={a.is_armed ? "border-safe/50" : ""}>
        <ToggleRow
          label={a.is_armed ? "Armed" : "Disarmed"}
          description={
            a.is_armed
              ? "Movement + opening together will raise an alert."
              : "Triggers are logged but won't raise an alert."
          }
          value={a.is_armed}
          onChange={(armed) => setArmed.mutate({ id, armed })}
        />
      </Card>

      <SectionTitle title="Details" />
      <Card>
        <KeyValue label="Guarded by" value={device ? device.name : "No device linked"} />
        <KeyValue label="Location" value={a.location ?? "—"} />
        {a.description ? <Text className="text-muted mt-3">{a.description}</Text> : null}
      </Card>

      <SectionTitle
        title="Auto-arm schedules"
        action="Add"
        onAction={() => router.push({ pathname: "/schedules/new", params: { assetId: id } })}
      />
      {mySchedules.length ? (
        mySchedules.map((s) => <ScheduleRow key={s.id} schedule={s} />)
      ) : (
        <Card>
          <Text className="text-muted">No schedule. Add one to arm it automatically, e.g. during class hours.</Text>
        </Card>
      )}

      <SectionTitle title="Sensor history" />
      <Card>
        {events.data?.length ? (
          events.data.map((event) => <EventRow key={event.id} event={event} deviceName={device?.name} />)
        ) : (
          <Text className="text-muted text-center py-3">No events attributed to this belonging yet.</Text>
        )}
      </Card>

      <View className="mt-6">
        <Button label="Delete belonging" variant="danger" loading={remove.isPending} onPress={confirmDelete} />
      </View>
      <ConfirmSheet
        visible={confirming}
        title="Delete belonging?"
        message={`${a.name} and its schedules will be removed.`}
        confirmLabel="Delete"
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          remove.mutate(undefined, { onSuccess: () => router.back() });
        }}
      />
    </ScreenContainer>
  );
}
