import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import { useAppAuth } from "@/lib/auth/developmentMock";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAppAuth();
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

  return <>{children}</>;
}
