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
        options={{ title: "Board", tabBarIcon: ({ color }) => <TabIcon icon="alert-triangle" color={color} badge={unanswered} /> }}
      />
      <Tabs.Screen name="rooms" options={{ title: "Rooms", tabBarIcon: ({ color }) => <TabIcon icon="grid" color={color} /> }} />
      <Tabs.Screen name="notices" options={{ title: "Notices", tabBarIcon: ({ color }) => <TabIcon icon="send" color={color} /> }} />
      <Tabs.Screen name="stats" options={{ title: "Stats", tabBarIcon: ({ color }) => <TabIcon icon="bar-chart-2" color={color} /> }} />
      <Tabs.Screen name="account" options={{ title: "Account", tabBarIcon: ({ color }) => <TabIcon icon="user" color={color} /> }} />
    </Tabs>
  );
}
