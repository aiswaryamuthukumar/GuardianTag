import { useEffect } from "react";
import { View } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter, useSegments } from "expo-router";
import { colors } from "@/constants/theme";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const segment: string | undefined = segments[0];
    const inAuthGroup = segment === "(auth)";
    const inAppGroup = segment === "(app)";
    const atRoot = segment === undefined;

    if (!isSignedIn && inAppGroup) {
      router.replace("/(auth)/login");
    } else if (isSignedIn && (inAuthGroup || atRoot)) {
      router.replace("/(app)/home");
    } else if (!isSignedIn && atRoot) {
      router.replace("/(auth)/onboarding");
    }
  }, [isLoaded, isSignedIn, segments, router]);

  if (!isLoaded) {
    return <View className="flex-1 bg-background" />;
  }

  return <>{children}</>;
}
