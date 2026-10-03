import { useLocalSearchParams } from "expo-router";
import EmergencyScreen from "@/src/features/alerts/EmergencyScreen";

export default function EmergencyRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EmergencyScreen id={id} />;
}
