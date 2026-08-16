import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { getExpoPushTokenAsync } from "expo-notifications";
import { apiClient } from "@/lib/api/client";

export function usePushRegistration() {
  const { user } = useUser();
  const registeredTokenRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

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
        const { data: expoPushToken } = await getExpoPushTokenAsync();

        // Skip if already registered this token
        if (registeredTokenRef.current === expoPushToken) {
          return;
        }

        registeredTokenRef.current = expoPushToken;

        // Send to backend only once
        const response = await apiClient.post("/notifications/register-token", {
          push_token: expoPushToken,
        });

        console.log("Push token registered successfully");
      } catch (error) {
        console.error("Push registration failed:", error);
        // Don't crash - push notifications are optional
        // Just log the error
      }
    };

    register();

    return () => {
      isMountedRef.current = false;
    };
  }, [user?.id]); // Only re-run if user ID changes
}