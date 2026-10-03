import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { BackButton } from "@/src/components/ui/BackButton";
import { Button } from "@/src/components/ui/Button";
import { TextField } from "@/src/components/ui/Form";
import { Logo } from "@/src/components/ui/Logo";
import { RoleTabs } from "@/src/features/auth/RoleTabs";
import { useAuth } from "@/src/lib/auth/AuthProvider";
import { EMAIL } from "@/src/lib/validation";
import type { UserRole } from "@/src/types/api";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const params = useLocalSearchParams<{ role?: UserRole }>();
  const [role, setRole] = useState<UserRole>(params.role === "warden" ? "warden" : "student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const staff = role === "warden";

  const onSubmit = async () => {
    if (!EMAIL.test(email.trim())) return setError("Enter a valid email address.");
    if (!password) return setError("Enter your password.");
    setError(null);
    setLoading(true);
    try {
      // On success the root layout switches to the app; the role picks the tabs.
      await signIn(email.trim(), password, role);
    } catch (err) {
      setError((err as Error).message || "Sign in failed");
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-background">
      {router.canGoBack() ? (
        <View className="px-4 pt-12">
          <BackButton />
        </View>
      ) : null}
      <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-6" keyboardShouldPersistTaps="handled">
        <View className="items-center mb-7">
          <Logo size={72} showWordmark={false} />
          <Text className="text-foreground text-[22px] font-bold mt-4">Welcome to GuardianTag</Text>
          <Text className="text-muted text-[14px] mt-1.5 text-center">
            {staff ? "Sign in to the hostel security console" : "Sign in to keep watch over your belongings"}
          </Text>
        </View>

        <RoleTabs value={role} onChange={(r) => { setRole(r); setError(null); }} />

        <TextField
          placeholder={staff ? "Staff email" : "Email"}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextField
          placeholder="Password"
          secureTextEntry
          autoComplete="password"
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={onSubmit}
        />

        {error ? <Text className="text-emergency text-[13px] mb-2">{error}</Text> : null}
        <View className="mt-1">
          <Button label={staff ? "Sign in as staff" : "Sign in"} size="lg" onPress={onSubmit} loading={loading} />
        </View>

        <View className="flex-row items-center my-5">
          <View className="flex-1 h-px bg-border" />
          <Text className="text-muted text-[12px] mx-3">or</Text>
          <View className="flex-1 h-px bg-border" />
        </View>

        <Button
          label={staff ? "Register with a staff invite code" : "Create a student account"}
          variant="secondary"
          size="lg"
          onPress={() => router.push({ pathname: "/(auth)/register", params: { role } })}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
