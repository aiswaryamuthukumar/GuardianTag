import { useLocalSearchParams } from "expo-router";
import AssetDetailScreen from "@/src/features/assets/screens/AssetDetailScreen";

export default function AssetRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <AssetDetailScreen id={id} />;
}
