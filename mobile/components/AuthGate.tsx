import { useEffect, useState } from "react";
import { useRouter, useSegments } from "expo-router";
import { useAppAuth } from "@/lib/auth/developmentMock";

const SPLASH_DELAY_MS = 900;

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAppAuth();
  const segments = useSegments();
  const router = useRouter();
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSplashDone(true), SPLASH_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    const segment: string | undefined = segments[0];
    const inAuthGroup = segment === "(auth)";
    const inAppGroup = segment === "(app)";
    const atRoot = segment === undefined;

    if (atRoot && !splashDone) return;

    if (!isSignedIn && inAppGroup) {
      router.replace("/(auth)/login");
    } else if (isSignedIn && (inAuthGroup || atRoot)) {
      router.replace("/(app)/home");
    } else if (!isSignedIn && atRoot) {
      router.replace("/(auth)/onboarding");
    }
  }, [isLoaded, isSignedIn, segments, router, splashDone]);

  return <>{children}</>;
}
