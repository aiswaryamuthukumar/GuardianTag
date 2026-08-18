import { Text, View } from "react-native";
import { useIsOnline } from "@/hooks/useIsOnline";

export function OfflineBanner() {
  const isOnline = useIsOnline();
  if (isOnline) return null;

  return (
    <View className="bg-warning/20 border-b border-warning/30 px-4 py-2">
      <Text className="text-warning text-xs font-medium text-center">
        Offline. Showing your last synced data.
      </Text>
    </View>
  );
}
