import "../global.css";
import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { ErrorBoundary } from "@/src/components/ErrorBoundary";
import { OfflineBanner } from "@/src/components/OfflineBanner";
import { ApiError } from "@/src/lib/api/client";
import { AuthProvider, useAuth } from "@/src/lib/auth/AuthProvider";
import { setupOnlineManager } from "@/src/lib/offline/onlineManager";
import { PERSIST_MAX_AGE_MS, queryPersister } from "@/src/lib/offline/persister";
import { colors } from "@/src/theme";

function RootNavigator() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Protected guard={!!isSignedIn}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            gcTime: PERSIST_MAX_AGE_MS,
            staleTime: 15_000,
            // Don't hammer the API retrying requests that can't succeed.
            retry: (count, error) => !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 2,
          },
        },
      }),
  );

  useEffect(() => {
    setupOnlineManager();
  }, []);

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: queryPersister, maxAge: PERSIST_MAX_AGE_MS }}>
      <AuthProvider>
        <StatusBar style="light" />
        <ErrorBoundary>
          <OfflineBanner />
          <RootNavigator />
        </ErrorBoundary>
      </AuthProvider>
    </PersistQueryClientProvider>
  );
}
