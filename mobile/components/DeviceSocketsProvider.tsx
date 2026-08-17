import { useEffect } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/hooks/useApi";
import { usePushRegistration } from "@/hooks/usePushRegistration";
import { useAppAuth } from "@/lib/auth/developmentMock";
import { openDeviceSocket, type DeviceSocketMessage } from "@/lib/ws/deviceSocket";
import type { Device } from "@/types/api";

/**
 * Keeps one live WebSocket per paired device for the lifetime of the signed-in
 * session, so incident/device-health changes reach the UI without the user
 * needing to pull-to-refresh. Mount once, near the root, alongside AuthGate.
 */
export function DeviceSocketsProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, getToken } = useAppAuth();
  const api = useApi();
  const queryClient = useQueryClient();
  usePushRegistration();

  const devicesQuery = useQuery({
    queryKey: ["devices"],
    queryFn: () => api.get<Device[]>("/devices"),
    enabled: !!isSignedIn,
  });

  useEffect(() => {
    if (!isSignedIn || !devicesQuery.data) return;

    const handleMessage = (message: DeviceSocketMessage) => {
      switch (message.type) {
        case "sensor_event":
          queryClient.invalidateQueries({ queryKey: ["devices"] });
          break;
        case "device_health":
          queryClient.invalidateQueries({ queryKey: ["devices"] });
          break;
        case "incident_created":
          queryClient.invalidateQueries({ queryKey: ["incidents"] });
          Alert.alert(
            "HostDost Alert",
            (message.incident.title as string) ?? "Unverified movement detected",
            [
              { text: "Dismiss", style: "cancel" },
              { text: "View", onPress: () => router.push("/(app)/emergency-alert") },
            ],
          );
          break;
        case "incident_updated":
          queryClient.invalidateQueries({ queryKey: ["incidents"] });
          break;
      }
    };

    const cleanups = devicesQuery.data.map((device) =>
      openDeviceSocket(device.id, () => getToken(), handleMessage),
    );

    return () => cleanups.forEach((cleanup) => cleanup());
  }, [isSignedIn, devicesQuery.data, getToken, queryClient]);

  return <>{children}</>;
}
