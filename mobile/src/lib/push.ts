import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { useUpdateMe } from "@/src/features/profile/api";
import type { User } from "@/src/types/api";

/**
 * Asks for notification permission once signed in and stores the Expo push
 * token on the profile (PATCH /auth/me), so alerts reach a locked phone.
 */
export function usePushRegistration(me: User | undefined) {
  const updateMe = useUpdateMe();
  const done = useRef(false);

  useEffect(() => {
    if (!me || done.current || Platform.OS === "web") return;
    done.current = true;

    (async () => {
      try {
        const Notifications = await import("expo-notifications");
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });

        let { status } = await Notifications.getPermissionsAsync();
        if (status !== "granted") status = (await Notifications.requestPermissionsAsync()).status;
        if (status !== "granted") return;

        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("alerts", {
            name: "Security alerts",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 600, 250, 600],
          });
        }

        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        const { data: token } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
        if (token) updateMe.mutate({ expo_push_token: token });
      } catch (error) {
        // Push is an extra channel; the in-app socket and inbox still work without it.
        console.warn("Push registration skipped:", error);
      }
    })();
  }, [me, updateMe]);
}
