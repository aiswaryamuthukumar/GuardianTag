import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text } from "react-native";
import { Link, useLocalSearchParams } from "expo-router";
import { Button } from "@/src/components/ui/Button";
import { TextField } from "@/src/components/ui/Form";
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

  const staff = role === "warden";
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-background">
      <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-10" keyboardShouldPersistTaps="handled">
        <Text className="text-3xl font-extrabold text-white mb-1">Welcome back</Text>
        <Text className="text-muted mb-6">
          {staff ? "Sign in to the hostel security console." : "Sign in to keep watch over your belongings."}
        </Text>

        <RoleTabs value={role} onChange={(r) => { setRole(r); setError(null); }} />

        <TextField
          label={staff ? "Staff email" : "Email"}
          placeholder={staff ? "warden@college.edu" : "you@college.edu"}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextField
          label="Password"
          placeholder="••••••••"
          secureTextEntry
          autoComplete="password"
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={onSubmit}
        />

        {error ? <Text className="text-emergency mb-3">{error}</Text> : null}
        <Button label={staff ? "Sign in as staff" : "Sign in"} onPress={onSubmit} loading={loading} />

        <Link href={{ pathname: "/(auth)/register", params: { role } }} className="text-center text-primary-light mt-5">
          {staff ? "New staff member? Register with invite code" : "Don't have an account? Register"}
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
