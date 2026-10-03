import { useLocalSearchParams } from "expo-router";
import DeviceDetailScreen from "@/src/features/devices/screens/DeviceDetailScreen";

export default function DeviceRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DeviceDetailScreen id={id} />;
}
