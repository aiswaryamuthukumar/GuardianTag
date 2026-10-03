import { useMemo, useState } from "react";
import { Linking, Modal, Pressable, Text, View } from "react-native";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { LiveIndicator, SectionTitle, StatusDot } from "@/src/components/ui/Display";
import { Segmented } from "@/src/components/ui/Form";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { ScreenHeader } from "@/src/components/ui/ScreenHeader";
import { EmptyState, ErrorState, LoadingState } from "@/src/components/ui/StateViews";
import { deviceTone } from "@/src/features/devices/components/DeviceCard";
import { useRooms } from "@/src/features/warden/api";
import { timeAgo } from "@/src/lib/format";
import type { Room, RoomState } from "@/src/types/api";

const stateStyle: Record<RoomState, { cls: string; label: string }> = {
  alert: { cls: "bg-emergency/25 border-emergency", label: "Alert" },
  offline: { cls: "bg-warning/20 border-warning/60", label: "Device offline" },
  armed: { cls: "bg-safe/15 border-safe/50", label: "Armed" },
  idle: { cls: "bg-surface border-border", label: "Idle" },
};

function RoomSheet({ room, onClose }: { room: Room | null; onClose: () => void }) {
  return (
    <Modal visible={!!room} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/60" onPress={onClose} />
      {room ? (
        <View className="bg-background border-t border-border rounded-t-3xl p-5 pb-10">
          <Text className="text-white text-xl font-bold">
            Block {room.hostel_block ?? "?"} · Room {room.room_number ?? "?"}
          </Text>
          <Text className="text-muted mb-3">
            {stateStyle[room.state].label} · {room.armed_assets}/{room.total_assets} belongings armed · {room.open_incidents} open incident
            {room.open_incidents === 1 ? "" : "s"}
          </Text>
          <SectionTitle title="Students" />
          {room.students.map((s) => (
            <View key={s.id} className="flex-row items-center justify-between py-2">
              <Text className="text-white">{s.full_name}</Text>
              {s.phone ? <Button label="Call" size="sm" variant="secondary" onPress={() => Linking.openURL(`tel:${s.phone!.replace(/\s/g, "")}`)} /> : null}
            </View>
          ))}
          <SectionTitle title="Devices" />
          {room.devices.length ? (
            room.devices.map((d) => (
              <View key={d.id} className="flex-row items-center py-1.5">
                <StatusDot tone={deviceTone[d.status]} />
                <Text className="text-white ml-2 flex-1">{d.name}</Text>
                <Text className="text-muted text-xs">{timeAgo(d.last_seen_at)}</Text>
              </View>
            ))
          ) : (
            <Text className="text-muted">No devices paired.</Text>
          )}
          <View className="mt-5">
            <Button label="Close" variant="secondary" onPress={onClose} />
          </View>
        </View>
      ) : null}
    </Modal>
  );
}

/** Block / room overview: a colour-coded grid of every occupied room. */
export default function RoomsScreen() {
  const rooms = useRooms();
  const [selected, setSelected] = useState<Room | null>(null);
  const [block, setBlock] = useState("all");

  const blocks = useMemo(
    () => Array.from(new Set((rooms.data ?? []).map((r) => r.hostel_block ?? "—"))).sort(),
    [rooms.data],
  );
  const visible = (rooms.data ?? []).filter((r) => block === "all" || (r.hostel_block ?? "—") === block);
  const counts = (state: RoomState) => visible.filter((r) => r.state === state).length;

  return (
    <ScreenContainer onRefresh={rooms.refetch} refreshing={rooms.isRefetching}>
      <ScreenHeader title="Rooms" subtitle="Live status of every room" right={<LiveIndicator />} />
      {blocks.length > 1 ? (
        <Segmented options={[{ value: "all", label: "All blocks" }, ...blocks.map((b) => ({ value: b, label: `Block ${b}` }))]} value={block} onChange={setBlock} />
      ) : null}

      <View className="flex-row flex-wrap gap-2 mt-3">
        {(Object.keys(stateStyle) as RoomState[]).map((state) => (
          <View key={state} className={`flex-row items-center px-2.5 py-1 rounded-full border ${stateStyle[state].cls}`}>
            <Text className="text-white text-xs">
              {stateStyle[state].label}: {counts(state)}
            </Text>
          </View>
        ))}
      </View>

      <Card className="mt-3">
        {rooms.isLoading ? (
          <LoadingState />
        ) : rooms.error ? (
          <ErrorState message={rooms.error.message} onRetry={rooms.refetch} />
        ) : visible.length ? (
          <View className="flex-row flex-wrap gap-2">
            {visible.map((room) => (
              <Pressable
                key={`${room.hostel_block}-${room.room_number}`}
                onPress={() => setSelected(room)}
                accessibilityRole="button"
                accessibilityLabel={`Room ${room.room_number}, ${stateStyle[room.state].label}`}
                className={`w-[31%] aspect-square rounded-xl border items-center justify-center ${stateStyle[room.state].cls}`}
              >
                <Text className="text-white font-bold text-lg">{room.room_number ?? "?"}</Text>
                <Text className="text-muted text-[10px]">
                  {room.students.length} student{room.students.length === 1 ? "" : "s"}
                </Text>
                {room.open_incidents ? <Text className="text-emergency text-xs font-bold mt-0.5">🚨 {room.open_incidents}</Text> : null}
              </Pressable>
            ))}
          </View>
        ) : (
          <EmptyState title="No rooms yet" message="Rooms appear once students add their block and room number." />
        )}
      </Card>
      <RoomSheet room={selected} onClose={() => setSelected(null)} />
    </ScreenContainer>
  );
}
