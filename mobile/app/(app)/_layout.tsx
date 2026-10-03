import { useEffect } from "react";
import { router, Stack, useSegments } from "expo-router";
import { useMe } from "@/src/features/profile/api";
import { usePushRegistration } from "@/src/lib/push";
import { RealtimeProvider } from "@/src/lib/realtime/RealtimeProvider";
import { colors } from "@/src/theme";

/**
 * Signed-in shell: one live socket for the whole app, push registration, and
 * role routing (students get the (student) tabs, wardens the (warden) tabs;
 * students without a room are sent to profile setup first).
 */
export default function AppLayout() {
  const { data: me } = useMe();
  const segments = useSegments() as string[];
  usePushRegistration(me);

  useEffect(() => {
    if (!me) return;
    const group = segments[1];
    if (me.role === "warden" && group === "(student)") router.replace("/board");
    else if (me.role === "student" && group === "(warden)") router.replace("/home");
    else if (me.role === "student" && !me.room_number && group === "(student)") router.replace("/profile-setup");
  }, [me, segments]);

  return (
    <RealtimeProvider me={me}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(student)" />
        <Stack.Screen name="(warden)" />
        <Stack.Screen name="emergency" options={{ presentation: "fullScreenModal", animation: "fade", gestureEnabled: false }} />
        <Stack.Screen name="profile-setup" options={{ gestureEnabled: false }} />
      </Stack>
    </RealtimeProvider>
  );
}
