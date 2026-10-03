import { useEffect } from "react";
import { Linking, Text, Vibration, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { BackButton } from "@/src/components/ui/BackButton";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { useNow } from "@/src/components/ui/Display";
import { ShieldScanner } from "@/src/components/ui/ShieldScanner";
import { LoadingState } from "@/src/components/ui/StateViews";
import { useAcknowledge, useIncident, useResolve } from "@/src/features/incidents/api";
import { useMyWardens } from "@/src/features/profile/api";
import { severityLabels, timeAgo } from "@/src/lib/format";
import { toastBus } from "@/src/lib/toast";
import { colors, tint } from "@/src/theme";

/** Full-screen alarm raised by the realtime socket the moment an incident is created. */
export default function EmergencyScreen({ id }: { id: string }) {
  const incident = useIncident(id);
  const wardens = useMyWardens();
  const resolve = useResolve(id);
  const acknowledge = useAcknowledge(id);
  const now = useNow();

  useEffect(() => () => Vibration.cancel(), []);

  const i = incident.data;
  const closed = i && (i.status === "resolved" || i.status === "false_alarm");
  const warden = wardens.data?.find((w) => w.phone);
  const dismiss = () => (router.canGoBack() ? router.back() : router.replace("/"));

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: closed ? colors.background : tint(colors.emergency, 0.12) }}>
      <View className="flex-1 px-6 justify-between py-6">
        <View className="flex-row justify-end">
          <BackButton icon="x" onPress={dismiss} />
        </View>
        <View className="items-center">
          <ShieldScanner
            active={!closed}
            tone={closed ? "primary" : "emergency"}
            icon={closed ? "check" : "alert-triangle"}
            size={120}
            fast
          />
          {!i ? (
            <LoadingState label="Loading alert…" />
          ) : (
            <>
              <Text className={`text-[26px] font-bold mt-4 ${closed ? "text-safe-light" : "text-emergency-light"}`}>
                {closed ? "Alert closed" : "Tamper alert!"}
              </Text>
              <Text className="text-muted mt-1">Triggered {timeAgo(i.triggered_at, now)}</Text>
              <Card className="mt-5 w-full">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-foreground font-semibold text-[16px] flex-1 mr-2">{i.title}</Text>
                  <Badge label={severityLabels[i.severity]} tone={i.severity === "high" ? "emergency" : "warning"} />
                </View>
                <Text className="text-muted text-[14px]">
                  Motion and opening were detected together. If this wasn&apos;t you, check on your belonging now.
                  {i.status === "open" ? " Your warden is alerted in 30 seconds if nobody responds." : ""}
                </Text>
              </Card>
            </>
          )}
        </View>

        {i && !closed ? (
          <View className="gap-3">
            <Button
              label="I'm going to check"
              variant="danger"
              size="lg"
              loading={acknowledge.isPending}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                acknowledge.mutate(undefined, { onSuccess: () => router.replace(`/incidents/${id}`) });
              }}
            />
            <Button
              label="It was me – false alarm"
              variant="secondary"
              size="lg"
              loading={resolve.isPending}
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                resolve.mutate(
                  { status: "false_alarm", resolution_notes: "Confirmed from the emergency screen: it was me." },
                  {
                    onSuccess: () => {
                      toastBus.show({ icon: "shield", title: "Marked false alarm", subtitle: "+5 XP", tone: "warning" });
                      dismiss();
                    },
                  },
                );
              }}
            />
            {warden?.phone ? (
              <Button
                label={`Call warden · ${warden.full_name}`}
                variant="secondary"
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
