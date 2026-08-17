import { useSyncExternalStore } from "react";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { DEMO_MODE } from "@/lib/demo/config";
import { demoSession } from "@/lib/demo/session";

// `__DEV__` is compiled as false in production builds, so Clerk remains the
// only authentication source outside local development. DEMO_MODE forces the
// bypass in any build so the frontend can be demoed without a backend.
const useDevelopmentMockAuth = DEMO_MODE || __DEV__;

export const developmentMockUser = {
  id: "demo-hostdost-user",
  firstName: "Aiswarya",
  lastName: "M",
  fullName: "Aiswarya M",
  primaryEmailAddress: { emailAddress: "aiswarya@hostdost.local" },
  publicMetadata: { role: "student" },
};

// DEMO_MODE is a build-time constant (never changes across renders), so
// calling hooks conditionally on it does not violate the rules of hooks —
// it also lets demo builds skip ClerkProvider/network entirely.
export function useAppAuth() {
  const session = useSyncExternalStore(demoSession.subscribe, demoSession.getSnapshot);

  if (DEMO_MODE) {
    return {
      isLoaded: session.hydrated,
      isSignedIn: session.signedIn,
      getToken: async () => null,
      signOut: async () => demoSession.signOut(),
    };
  }

  const clerkAuth = useAuth();
  if (!useDevelopmentMockAuth) return clerkAuth;

  return {
    ...clerkAuth,
    isLoaded: true,
    isSignedIn: true,
    getToken: async () => null,
    signOut: async () => undefined,
  };
}

export function useAppUser() {
  const session = useSyncExternalStore(demoSession.subscribe, demoSession.getSnapshot);

  if (DEMO_MODE) {
    return { isLoaded: session.hydrated, isSignedIn: session.signedIn, user: developmentMockUser };
  }

  const clerkUser = useUser();
  if (!useDevelopmentMockAuth) return clerkUser;

  return { ...clerkUser, isLoaded: true, isSignedIn: true, user: developmentMockUser };
}
