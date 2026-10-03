import { Tabs } from "expo-router";
import { TabIcon, tabScreenOptions } from "@/src/components/TabIcon";
import { useIncidents } from "@/src/features/incidents/api";

export default function StudentTabs() {
  const active = useIncidents({ active: true });

  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen name="home" options={{ title: "Home", tabBarIcon: ({ color }) => <TabIcon icon="home" color={color} /> }} />
      <Tabs.Screen name="guardian" options={{ title: "Guard", tabBarIcon: ({ color }) => <TabIcon icon="shield" color={color} /> }} />
      <Tabs.Screen
        name="incidents"
        options={{ title: "Cases", tabBarIcon: ({ color }) => <TabIcon icon="search" color={color} badge={active.data?.length} /> }}
      />
      <Tabs.Screen name="rewards" options={{ title: "Rewards", tabBarIcon: ({ color }) => <TabIcon icon="award" color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color }) => <TabIcon icon="user" color={color} /> }} />
    </Tabs>
  );
}
