import { useState } from "react";
import { View, Text, ScrollView, Button } from "react-native";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";

export default function XPScreen() {
  const [xpData] = useState({
    currentLevel: 3,
    currentXP: 450,
    nextLevelXP: 500,
    totalXP: 1250,
    levelName: "Guardian",
    progressPercent: 90,
  });

  const [challenges] = useState([
    {
      id: "1",
      title: "Daily Guardian",
      description: "Keep all devices armed for 24 hours",
      progress: 18,
      goal: 24,
      reward: 50,
      active: true,
    },
    {
      id: "2",
      title: "Fast Response",
      description: "Disarm 3 alerts today",
      progress: 1,
      goal: 3,
      reward: 100,
      active: true,
    },
    {
      id: "3",
      title: "Perfect Week",
      description: "No false alarms for 7 days",
      progress: 3,
      goal: 7,
      reward: 200,
      active: true,
    },
  ]);

  return (
    <ScreenContainer>
      <ScreenHeader title="Guardian XP" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="pb-8">
          {/* Level Card */}
          <View className="bg-gradient-to-r from-purple-900 to-purple-700 rounded-lg p-6 mb-6">
            <Text className="text-purple-200 text-sm mb-2">Current Level</Text>
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-white text-4xl font-bold">
                  {xpData.currentLevel}
                </Text>
                <Text className="text-purple-200">{xpData.levelName}</Text>
              </View>
              <Text className="text-white text-2xl">👑</Text>
            </View>

            {/* Progress Bar */}
            <View className="bg-purple-800 rounded-full h-2 mb-2">
              <View
                className="bg-yellow-400 rounded-full h-2"
                style={{ width: `${xpData.progressPercent}%` }}
              />
            </View>
            <Text className="text-purple-200 text-xs">
              {xpData.currentXP} / {xpData.nextLevelXP} XP
            </Text>
          </View>

          {/* Challenges */}
          <Text className="text-white text-lg font-bold mb-3">Active Challenges</Text>

          {challenges.map(challenge => (
            <View key={challenge.id} className="bg-surface rounded-lg p-4 mb-3">
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1">
                  <Text className="text-white font-semibold">
                    {challenge.title}
                  </Text>
                  <Text className="text-muted text-sm mt-1">
                    {challenge.description}
                  </Text>
                </View>
                <View className="bg-yellow-900 px-2 py-1 rounded">
                  <Text className="text-yellow-200 text-xs font-bold">
                    +{challenge.reward} XP
                  </Text>
                </View>
              </View>

              {/* Challenge Progress */}
              <View className="bg-background rounded-full h-2 mt-3">
                <View
                  className="bg-green-500 rounded-full h-2"
                  style={{
                    width: `${(challenge.progress / challenge.goal) * 100}%`,
                  }}
                />
              </View>
              <Text className="text-muted text-xs mt-2">
                {challenge.progress} / {challenge.goal}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

// import { View, Text } from "react-native";
// import { useQuery } from "@tanstack/react-query";
// import { useApi } from "@/hooks/useApi";
// import { ScreenContainer } from "@/components/ui/ScreenContainer";
// import { ScreenHeader } from "@/components/ui/ScreenHeader";
// import { Card } from "@/components/ui/Card";
// import { LoadingState, ErrorState, EmptyState } from "@/components/ui/StateViews";
// import { guardianLevels, type GuardianLevelLabel } from "@/constants/theme";
// import type { GuardianLevel, SecurityScore, XPTransaction } from "@/types/api";

// const levelLabels: Record<GuardianLevel, GuardianLevelLabel> = {
//   rookie: "Rookie",
//   watchman: "Watchman",
//   guardian: "Guardian",
//   sentinel: "Sentinel",
//   hostel_protector: "Hostel Protector",
// };

// export default function GuardianXP() {
//   const api = useApi();

//   const scoreQuery = useQuery({
//     queryKey: ["security-score"],
//     queryFn: () => api.get<SecurityScore>("/gamification/security-score"),
//   });
//   const xpQuery = useQuery({
//     queryKey: ["xp-transactions"],
//     queryFn: () => api.get<XPTransaction[]>("/gamification/xp"),
//   });

//   const levelIndex = scoreQuery.data
//     ? guardianLevels.indexOf(levelLabels[scoreQuery.data.level])
//     : -1;

//   return (
//     <ScreenContainer onRefresh={() => xpQuery.refetch()} refreshing={xpQuery.isRefetching}>
//       <ScreenHeader title="Guardian XP" showBack />

//       {scoreQuery.isLoading ? <LoadingState /> : null}
//       {scoreQuery.error ? <ErrorState onRetry={() => scoreQuery.refetch()} /> : null}

//       {scoreQuery.data ? (
//         <Card className="mb-4 items-center py-6">
//           <Text className="text-3xl font-extrabold text-primary-light">{scoreQuery.data.score} XP</Text>
//           <Text className="text-white font-semibold mt-1">{levelLabels[scoreQuery.data.level]}</Text>
//           <Text className="text-muted mt-1">{scoreQuery.data.streak_days} day streak</Text>

//           <View className="flex-row mt-4 w-full gap-1">
//             {guardianLevels.map((level, index) => (
//               <View
//                 key={level}
//                 className={`flex-1 h-1.5 rounded-full ${index <= levelIndex ? "bg-primary" : "bg-surface-alt"}`}
//               />
//             ))}
//           </View>
//         </Card>
//       ) : null}

//       <Text className="text-white font-semibold text-lg mb-2">Recent XP</Text>
//       {xpQuery.data && xpQuery.data.length === 0 ? (
//         <EmptyState title="No XP yet" message="Complete challenges and keep your assets guarded to earn XP." />
//       ) : null}
//       {xpQuery.data?.map((tx) => (
//         <Card key={tx.id} className="mb-2 flex-row items-center justify-between">
//           <View className="flex-1 mr-2">
//             <Text className="text-white">{tx.reason}</Text>
//             <Text className="text-muted text-xs mt-0.5">{new Date(tx.created_at).toLocaleString()}</Text>
//           </View>
//           <Text className={tx.amount >= 0 ? "text-safe font-semibold" : "text-emergency font-semibold"}>
//             {tx.amount >= 0 ? "+" : ""}
//             {tx.amount}
//           </Text>
//         </Card>
//       ))}
//     </ScreenContainer>
//   );
// }
