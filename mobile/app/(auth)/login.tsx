import { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Logo } from "@/components/ui/Logo";
import { colors } from "@/constants/theme";
import { demoSession } from "@/lib/demo/session";

const DEMO_EMAIL = "demo@hosdost.app";
const DEMO_PASSWORD = "HosDost@123";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const onSignIn = () => {
    if (email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD) {
      setError("");
      demoSession.signIn();
    } else {
      setError("Wrong email or password.");
    }
  };

  return (
    <View className="flex-1 bg-background px-6 justify-center">
      <View className="items-center mb-8">
        <Logo size={84} />
        <Text className="text-foreground text-[22px] font-bold mt-4">Welcome to HosDost</Text>
        <Text className="text-muted text-[14px] mt-1.5 text-center">Sign in to continue</Text>
      </View>

      <TextInput
        className="bg-surface-alt text-foreground rounded-xl px-4 py-3 border border-border mb-3 text-[15px]"
        placeholder="Email"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <View className="flex-row items-center bg-surface-alt border border-border rounded-xl mb-2">
        <TextInput
          className="flex-1 text-foreground px-4 py-3 text-[15px]"
          placeholder="Password"
          placeholderTextColor={colors.muted}
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <Pressable onPress={() => setShowPassword((v) => !v)} className="px-3">
          <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={colors.muted} />
        </Pressable>
      </View>

      {error ? <Text className="text-emergency text-[13px] mb-2">{error}</Text> : null}

      <Pressable className="bg-primary rounded-xl py-4 items-center mt-2" onPress={onSignIn}>
        <Text className="text-foreground font-semibold text-[15px]">Sign In</Text>
      </Pressable>

      <Text className="text-muted text-[12px] text-center mt-3">
        Demo login: {DEMO_EMAIL} / {DEMO_PASSWORD}
      </Text>

      <View className="flex-row items-center my-5">
        <View className="flex-1 h-px bg-border" />
        <Text className="text-muted text-[12px] mx-3">or</Text>
        <View className="flex-1 h-px bg-border" />
      </View>

      <Pressable className="bg-surface-alt border border-border rounded-xl py-4 items-center" onPress={() => demoSession.signIn()}>
        <Text className="text-foreground font-semibold text-[15px]">Continue as Guest</Text>
      </Pressable>
    </View>
  );
}
