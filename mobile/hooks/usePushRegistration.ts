import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { useApi } from "@/hooks/useApi";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Requests notification permissions, registers this device's Expo push token
 * with the backend, and routes to the Emergency Alert screen when the user
 * taps an incident push (covers the app being backgrounded/killed, which the
 * WebSocket-driven in-app alert in DeviceSocketsProvider can't reach).
 */
export function usePushRegistration() {
  const { isSignedIn } = useAuth();
  const api = useApi();
  const registeredTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isSignedIn || !Device.isDevice) return;

    (async () => {
      const existing = await Notifications.getPermissionsAsync();
      let status = existing.status;
      if (status !== "granted") {
        const requested = await Notifications.requestPermissionsAsync();
        status = requested.status;
      }
      if (status !== "granted") return;

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.HIGH,
        });
      }

      const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync();
      if (registeredTokenRef.current === expoPushToken) return;
      registeredTokenRef.current = expoPushToken;

      await api.patch("/auth/me", { expo_push_token: expoPushToken });
    })();
  }, [isSignedIn, api]);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { incident_id?: string } | undefined;
      if (data?.incident_id) {
        router.push("/(app)/emergency-alert");
      }
    });
    return () => subscription.remove();
  }, []);
}
