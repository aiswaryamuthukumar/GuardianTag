import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { apiClient } from "@/lib/api/client";

export function usePushRegistration() {
  const { user } = useUser();
  const registeredTokenRef = useRef<string | null>(null);

  useEffect(() => {
    // Skip on web - push notifications not supported
    if (Platform.OS === "web") {
      return;
    }

    // Skip if no user logged in
    if (!user?.id) {
      return;
    }

    const register = async () => {
      try {
        // Import AFTER platform check
        const { getExpoPushTokenAsync } = await import("expo-notifications");
        const { data: expoPushToken } = await getExpoPushTokenAsync();

        // Skip if already registered this token
        if (registeredTokenRef.current === expoPushToken) {
          return;
        }

        registeredTokenRef.current = expoPushToken;

        // Send to backend only once
        await apiClient.post("/notifications/register-token", {
          push_token: expoPushToken,
        });

        console.log("Push token registered successfully");
      } catch (error) {
        console.error("Push registration failed:", error);
        // Don't crash - push notifications are optional
      }
    };

    register();
  }, [user?.id]);
}