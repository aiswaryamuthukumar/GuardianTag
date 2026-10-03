import { useEffect, useRef } from "react";
import { Animated, Linking, Text, Vibration, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Button } from "@/src/components/ui/Button";
import { useNow } from "@/src/components/ui/Display";
import { LoadingState } from "@/src/components/ui/StateViews";
import { useAcknowledge, useIncident, useResolve } from "@/src/features/incidents/api";
import { useMyWardens } from "@/src/features/profile/api";
import { timeAgo } from "@/src/lib/format";

/** Full-screen alarm raised by the realtime socket the moment an incident is created. */
export default function EmergencyScreen({ id }: { id: string }) {
  const incident = useIncident(id);
  const wardens = useMyWardens();
  const resolve = useResolve(id);
  const acknowledge = useAcknowledge(id);
  const now = useNow();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.15, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
      Vibration.cancel();
    };
  }, [pulse]);

  const i = incident.data;
  const closed = i && (i.status === "resolved" || i.status === "false_alarm");
  const warden = wardens.data?.find((w) => w.phone);

  const dismiss = () => (router.canGoBack() ? router.back() : router.replace("/"));

  return (
    <SafeAreaView className="flex-1 bg-emergency-dark">
      <View className="flex-1 px-6 justify-between py-8">
        <View className="items-center mt-8">
          <Animated.View
            style={{ transform: [{ scale: pulse }] }}
            className="w-32 h-32 rounded-full bg-emergency items-center justify-center mb-6"
          >
            <Text className="text-6xl">🚨</Text>
          </Animated.View>
          {!i ? (
            <LoadingState label="Loading alert…" />
          ) : (
            <>
              <Text className="text-white text-3xl font-extrabold text-center">{closed ? "Alert closed" : "Tamper alert!"}</Text>
              <Text className="text-white/90 text-lg text-center mt-2">{i.title}</Text>
              <Text className="text-white/70 text-center mt-1">Triggered {timeAgo(i.triggered_at, now)}</Text>
              <Text className="text-white/70 text-center mt-4 px-4">
                Motion and opening were detected together. If this wasn't you, check on your belonging now.
                {i.status === "open" ? " Your warden is alerted in 30s if nobody responds." : ""}
              </Text>
            </>
          )}
        </View>

        {i && !closed ? (
          <View className="gap-3">
            <Button
              label="It was me – false alarm"
              variant="secondary"
              size="lg"
              loading={resolve.isPending}
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                resolve.mutate(
                  { status: "false_alarm", resolution_notes: "Confirmed from the emergency screen: it was me." },
                  { onSuccess: dismiss },
                );
              }}
            />
            <Button
              label="I'm going to check"
              size="lg"
              loading={acknowledge.isPending}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                acknowledge.mutate(undefined, { onSuccess: () => router.replace(`/incidents/${id}`) });
              }}
            />
            {warden?.phone ? (
              <Button
                label={`Call warden (${warden.full_name})`}
                variant="danger"
                size="lg"
                onPress={() => Linking.openURL(`tel:${warden.phone!.replace(/\s/g, "")}`)}
              />
            ) : null}
            <Button label="Dismiss" variant="ghost" onPress={dismiss} />
          </View>
        ) : (
          <Button label="Close" variant="secondary" size="lg" onPress={dismiss} />
        )}
      </View>
    </SafeAreaView>
  );
}
