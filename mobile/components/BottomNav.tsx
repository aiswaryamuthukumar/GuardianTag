import { View } from "react-native";
import { Link } from "expo-router";
import { Pressable, Text } from "react-native";

const navItems = [
  { href: "/(app)/home", icon: "🏠", label: "Home" },
  { href: "/(app)/incidents", icon: "📋", label: "Incidents" },
  { href: "/(app)/gamification/xp", icon: "🎮", label: "XP" },
  { href: "/(app)/analytics", icon: "📊", label: "Analytics" },
  { href: "/(app)/profile", icon: "👤", label: "Profile" },
];

export function BottomNav() {
  return (
    <View className="flex-row bg-surface border-t border-border">
      {navItems.map(item => (
        <Link key={item.href} href={item.href} asChild>
          <Pressable className="flex-1 py-3 items-center">
            <Text className="text-lg">{item.icon}</Text>
            <Text className="text-white text-xs mt-1">{item.label}</Text>
          </Pressable>
        </Link>
      ))}
    </View>
  );
}

// import { View } from "react-native";
// import { Link } from "expo-router";
// import { Pressable, Text } from "react-native";

// export function BottomNav() {
//   return (
//     <View className="flex-row border-t border-border bg-surface">
//       <Link href="/(app)/home" asChild>
//         <Pressable className="flex-1 py-3 items-center">
//           <Text className="text-white">Home</Text>
//         </Pressable>
//       </Link>
      
//       <Link href="/(app)/incidents" asChild>
//         <Pressable className="flex-1 py-3 items-center">
//           <Text className="text-white">Incidents</Text>
//         </Pressable>
//       </Link>
      
//       <Link href="/(app)/gamification/xp" asChild>
//         <Pressable className="flex-1 py-3 items-center">
//           <Text className="text-white">XP</Text>
//         </Pressable>
//       </Link>
      
//       <Link href="/(app)/analytics" asChild>
//         <Pressable className="flex-1 py-3 items-center">
//           <Text className="text-white">Analytics</Text>
//         </Pressable>
//       </Link>
      
//       <Link href="/(app)/profile" asChild>
//         <Pressable className="flex-1 py-3 items-center">
//           <Text className="text-white">Profile</Text>
//         </Pressable>
//       </Link>
//     </View>
//   );
// }