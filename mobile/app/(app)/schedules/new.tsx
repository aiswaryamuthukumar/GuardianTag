import { useLocalSearchParams } from "expo-router";
import ScheduleEditorScreen from "@/src/features/guardian/screens/ScheduleEditorScreen";

export default function ScheduleRoute() {
  const { id, assetId } = useLocalSearchParams<{ id?: string; assetId?: string }>();
  return <ScheduleEditorScreen id={id} assetId={assetId} />;
}
