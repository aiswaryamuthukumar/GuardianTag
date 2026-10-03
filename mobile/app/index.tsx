import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { useMe } from "@/src/features/profile/api";
import { useAuth } from "@/src/lib/auth/AuthProvider";
import { hasSeenOnboarding } from "@/src/lib/onboarding";

// Entry point: signed-in users go straight to their role's first tab (students:
// Home, hostel staff: Board). Signed-out users see the intro slides only the
// first time; after that they go straight to sign in.
export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();
  const me = useMe();
  const [seen, setSeen] = useState<boolean | null>(null);

  useEffect(() => {
    hasSeenOnboarding().then(setSeen);
  }, []);

  if (!isLoaded) return null;
  if (isSignedIn) {
    if (!me.data) return me.isError ? <Redirect href="/home" /> : null;
    return <Redirect href={me.data.role === "warden" ? "/board" : "/home"} />;
  }
  if (seen === null) return null;
  return <Redirect href={seen ? "/login" : "/onboarding"} />;
}
