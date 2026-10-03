import { Tabs } from "expo-router";
import { TabIcon, tabScreenOptions } from "@/src/components/TabIcon";
import { useBoard } from "@/src/features/warden/api";

export default function WardenTabs() {
  const board = useBoard("active");
  const unanswered = board.data?.filter((i) => i.status === "open").length;

  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen
        name="board"
        options={{ title: "Board", tabBarIcon: ({ focused }) => <TabIcon icon="🚨" focused={focused} badge={unanswered} /> }}
      />
      <Tabs.Screen name="rooms" options={{ title: "Rooms", tabBarIcon: ({ focused }) => <TabIcon icon="🏢" focused={focused} /> }} />
      <Tabs.Screen name="notices" options={{ title: "Notices", tabBarIcon: ({ focused }) => <TabIcon icon="📢" focused={focused} /> }} />
      <Tabs.Screen name="stats" options={{ title: "Stats", tabBarIcon: ({ focused }) => <TabIcon icon="📊" focused={focused} /> }} />
      <Tabs.Screen name="account" options={{ title: "Account", tabBarIcon: ({ focused }) => <TabIcon icon="👤" focused={focused} /> }} />
    </Tabs>
  );
}
