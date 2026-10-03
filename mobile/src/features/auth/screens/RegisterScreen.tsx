import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { Link, useLocalSearchParams } from "expo-router";
import { Button } from "@/src/components/ui/Button";
import { TextField } from "@/src/components/ui/Form";
import { RoleTabs } from "@/src/features/auth/RoleTabs";
import { useAuth } from "@/src/lib/auth/AuthProvider";
import { EMAIL, PHONE } from "@/src/lib/validation";
import type { UserRole } from "@/src/types/api";

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const params = useLocalSearchParams<{ role?: UserRole }>();
  const [role, setRole] = useState<UserRole>(params.role === "warden" ? "warden" : "student");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [block, setBlock] = useState("");
  const [room, setRoom] = useState("");
  const [phone, setPhone] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const staff = role === "warden";

  const onSubmit = async () => {
    if (fullName.trim().length < 2) return setError("Enter your full name.");
    if (!EMAIL.test(email.trim())) return setError("Enter a valid email address.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords don't match.");
    if (staff && !inviteCode.trim()) return setError("Enter the staff invite code from hostel administration.");
    if (!staff && (!block.trim() || !room.trim())) return setError("Enter your hostel block and room.");
    if (phone && !PHONE.test(phone.trim())) return setError("Enter a valid phone number.");
    setError(null);
    setLoading(true);
    try {
      await signUp({
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        role,
        invite_code: staff ? inviteCode.trim() : undefined,
        hostel_block: block.trim() || undefined,
        room_number: staff ? undefined : room.trim(),
        phone: phone.trim() || undefined,
      });
    } catch (err) {
      setError((err as Error).message || "Registration failed");
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-background">
      <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-10" keyboardShouldPersistTaps="handled">
        <Text className="text-3xl font-extrabold text-white mb-1">Create account</Text>
        <Text className="text-muted mb-6">
          {staff ? "Hostel staff get the live board, room overview and notices." : "Guard your belongings from day one."}
        </Text>

        <RoleTabs value={role} onChange={(r) => { setRole(r); setError(null); }} />

        <TextField label="Full name" placeholder="Your name" value={fullName} onChangeText={setFullName} />
        <TextField
          label="Email"
          placeholder={staff ? "warden@college.edu" : "you@college.edu"}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <View className="flex-row gap-3">
          <View className="flex-1">
            <TextField label="Password" placeholder="8+ characters" secureTextEntry value={password} onChangeText={setPassword} />
          </View>
          <View className="flex-1">
            <TextField label="Confirm" placeholder="Repeat" secureTextEntry value={confirm} onChangeText={setConfirm} />
          </View>
        </View>

        {staff ? (
          <>
            <TextField
              label="Staff invite code"
              placeholder="From hostel administration"
              autoCapitalize="none"
              secureTextEntry
              value={inviteCode}
              onChangeText={setInviteCode}
            />
            <TextField
              label="Block you manage (optional)"
              placeholder="Blank = whole hostel"
              autoCapitalize="characters"
              value={block}
              onChangeText={setBlock}
            />
          </>
        ) : (
          <View className="flex-row gap-3">
            <View className="flex-1">
              <TextField label="Hostel block" placeholder="A" autoCapitalize="characters" value={block} onChangeText={setBlock} />
            </View>
            <View className="flex-1">
              <TextField label="Room" placeholder="214" value={room} onChangeText={setRoom} />
            </View>
          </View>
        )}
        <TextField
          label="Phone (optional)"
          placeholder="+91 98765 43210"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          hint={staff ? "Students can call you from their emergency screen." : "Shown only to your hostel wardens."}
        />

        {error ? <Text className="text-emergency mb-3">{error}</Text> : null}
        <Button label={staff ? "Create staff account" : "Create account"} onPress={onSubmit} loading={loading} />

        <Link href={{ pathname: "/(auth)/login", params: { role } }} className="text-center text-primary-light mt-5">
          Already have an account? Sign in
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
