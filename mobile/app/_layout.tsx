if (typeof window !== 'undefined') {
  const StyleSheet = require('react-native').StyleSheet as any;
  StyleSheet.setFlag?.('darkMode', 'class');
}

import "../global.css";
import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { useAuth } from "@clerk/clerk-expo";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { colors } from "@/constants/theme";
import { DeviceSocketsProvider } from "@/components/DeviceSocketsProvider";
import { OfflineBanner } from "@/components/OfflineBanner";
import { setupOnlineManager } from "@/lib/offline/onlineManager";
import { PERSIST_MAX_AGE_MS, queryPersister } from "@/lib/offline/persister";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY - set it in mobile/.env (see .env.example)",
  );
}

function RootLayoutNav() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      {isSignedIn ? (
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      ) : (
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      )}
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
          },
        },
      }),
  );

  useEffect(() => {
    setupOnlineManager();
  }, []);

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: queryPersister, maxAge: PERSIST_MAX_AGE_MS }}
      >
        <StatusBar style="light" />
        <ErrorBoundary>
          <DeviceSocketsProvider>
            <OfflineBanner />
            <RootLayoutNav />
          </DeviceSocketsProvider>
        </ErrorBoundary>
      </PersistQueryClientProvider>
    </ClerkProvider>
  );
}