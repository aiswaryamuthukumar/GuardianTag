import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { useSignUp } from "@clerk/clerk-expo";
import { Link } from "expo-router";
import { useApi } from "@/hooks/useApi";

function errorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "errors" in err) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (err as any).errors?.[0]?.message ?? fallback;
  }
  return fallback;
}

export default function Register() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const api = useApi();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!isLoaded) return;
    setError(null);
    setLoading(true);
    try {
      const [firstName, ...rest] = fullName.trim().split(" ");
      await signUp.create({
        emailAddress: email,
        password,
        firstName,
        lastName: rest.join(" ") || undefined,
      });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: unknown) {
      setError(errorMessage(err, "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async () => {
    if (!isLoaded) return;
    setError(null);
    setLoading(true);
    try {
      const attempt = await signUp.attemptEmailAddressVerification({ code });
      if (attempt.status === "complete") {
        await setActive({ session: attempt.createdSessionId });
        await api.post("/auth/sync", { email, full_name: fullName });
      } else {
        setError("Verification incomplete. Please try again.");
      }
    } catch (err: unknown) {
      setError(errorMessage(err, "Verification failed"));
    } finally {
      setLoading(false);
    }
  };

  if (pendingVerification) {
    return (
      <View className="flex-1 bg-background px-6 justify-center">
        <Text className="text-3xl font-extrabold text-white mb-1">Check your email</Text>
        <Text className="text-muted mb-8">Enter the verification code we sent to {email}.</Text>

        <TextInput
          className="bg-surface text-white rounded-xl px-4 py-3 mb-3 border border-border"
          placeholder="Verification code"
          placeholderTextColor="#8B8B9E"
          keyboardType="number-pad"
          value={code}
          onChangeText={setCode}
        />

        {error ? <Text className="text-emergency mb-3">{error}</Text> : null}

        <Pressable
          className="bg-primary rounded-xl py-3 items-center"
          onPress={onVerify}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-semibold">Verify</Text>}
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background px-6 justify-center">
      <Text className="text-3xl font-extrabold text-white mb-1">Create account</Text>
      <Text className="text-muted mb-8">Guard your assets from day one.</Text>

      <TextInput
        className="bg-surface text-white rounded-xl px-4 py-3 mb-3 border border-border"
        placeholder="Full name"
        placeholderTextColor="#8B8B9E"
        value={fullName}
        onChangeText={setFullName}
      />
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
        {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-semibold">Create Account</Text>}
      </Pressable>

      <Link href="/(auth)/login" className="text-center text-primary-light">
        Already have an account? Sign in
      </Link>
    </View>
  );
}
