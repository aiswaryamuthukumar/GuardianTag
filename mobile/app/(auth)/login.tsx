import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { useSignIn } from "@clerk/clerk-expo";
import { Link } from "expo-router";
import { useApi } from "@/hooks/useApi";

export default function Login() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const api = useApi();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!isLoaded) return;
    setError(null);
    setLoading(true);
    try {
      const attempt = await signIn.create({ identifier: email, password });
      if (attempt.status === "complete") {
        await setActive({ session: attempt.createdSessionId });
        // Safety net in case the Clerk webhook hasn't synced this profile yet.
        // /auth/sync only creates when missing, so this never clobbers an existing profile.
        await api.post("/auth/sync", { email, full_name: email });
      } else {
        setError("Additional verification required. Please try again.");
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "errors" in err
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ((err as any).errors?.[0]?.message ?? "Sign in failed")
          : "Sign in failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-background px-6 justify-center">
      <Text className="text-3xl font-extrabold text-white mb-1">Welcome back</Text>
      <Text className="text-muted mb-8">Sign in to keep watch over your assets.</Text>

      <TextInput
        className="bg-surface text-white rounded-xl px-4 py-3 mb-3 border border-border"
        placeholder="Email"
        placeholderTextColor="#8B8B9E"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        className="bg-surface text-white rounded-xl px-4 py-3 mb-3 border border-border"
        placeholder="Password"
        placeholderTextColor="#8B8B9E"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text className="text-emergency mb-3">{error}</Text> : null}

      <Pressable
        className="bg-primary rounded-xl py-3 items-center mb-4"
        onPress={onSubmit}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-semibold">Sign In</Text>}
      </Pressable>

      <Link href="/(auth)/register" className="text-center text-primary-light">
        Don&apos;t have an account? Register
      </Link>
    </View>
  );
}
