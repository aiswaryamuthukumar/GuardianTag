import { useLocalSearchParams } from "expo-router";
import IncidentDetailScreen from "@/src/features/incidents/screens/IncidentDetailScreen";

export default function IncidentRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <IncidentDetailScreen id={id} />;
}
