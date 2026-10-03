import { useLocalSearchParams } from "expo-router";
import AssetFormScreen from "@/src/features/assets/screens/AssetFormScreen";

/** /assets/new creates; /assets/new?id=... edits; ?deviceId= pre-links a device. */
export default function AssetFormRoute() {
  const { id, deviceId } = useLocalSearchParams<{ id?: string; deviceId?: string }>();
  return <AssetFormScreen id={id} deviceId={deviceId} />;
}
