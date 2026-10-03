import { Redirect } from "expo-router";
import { useAuth } from "@/src/lib/auth/AuthProvider";

// Entry point: signed-in users land on their home tab (the (app) layout
// switches wardens to the board), everyone else sees onboarding.
export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return null;
  return <Redirect href={isSignedIn ? "/home" : "/onboarding"} />;
}
