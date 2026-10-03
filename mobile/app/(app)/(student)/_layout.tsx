import { Tabs } from "expo-router";
import { TabIcon, tabScreenOptions } from "@/src/components/TabIcon";
import { useIncidents } from "@/src/features/incidents/api";
import { useUnreadCount } from "@/src/features/notifications/api";

export default function StudentTabs() {
  const unread = useUnreadCount();
  const active = useIncidents({ active: true });

  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen name="home" options={{ title: "Home", tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} /> }} />
      <Tabs.Screen
        name="incidents"
        options={{ title: "Incidents", tabBarIcon: ({ focused }) => <TabIcon icon="🚨" focused={focused} badge={active.data?.length} /> }}
      />
      <Tabs.Screen name="guardian" options={{ title: "Guardian", tabBarIcon: ({ focused }) => <TabIcon icon="🛡️" focused={focused} /> }} />
      <Tabs.Screen
        name="alerts"
        options={{ title: "Alerts", tabBarIcon: ({ focused }) => <TabIcon icon="🔔" focused={focused} badge={unread.data} /> }}
      />
      <Tabs.Screen name="me" options={{ title: "Me", tabBarIcon: ({ focused }) => <TabIcon icon="👤" focused={focused} /> }} />
    </Tabs>
  );
}
