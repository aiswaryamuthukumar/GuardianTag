import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/src/lib/api/client";
import { qk } from "@/src/lib/api/keys";
import type { User, UserRole } from "@/src/types/api";

const TOKEN_KEY = "guardiantag.access_token";

export type RegisterInput = {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  invite_code?: string;
  hostel_block?: string;
  room_number?: string;
  phone?: string;
};

type TokenResponse = { access_token: string; token_type: string; user: User };

type AuthContextValue = {
  isLoaded: boolean;
  isSignedIn: boolean;
  getToken: () => Promise<string | null>;
  signIn: (email: string, password: string, role: UserRole) => Promise<User>;
  signUp: (input: RegisterInput) => Promise<User>;
  signOut: () => Promise<void>;
};

// SecureStore is the phone's encrypted keychain/keystore. It doesn't exist on web,
// where we fall back to localStorage (fine for a dev preview).
const storage = {
  get: async () =>
    Platform.OS === "web" ? globalThis.localStorage?.getItem(TOKEN_KEY) ?? null : SecureStore.getItemAsync(TOKEN_KEY),
  set: async (token: string) =>
    Platform.OS === "web" ? globalThis.localStorage?.setItem(TOKEN_KEY, token) : SecureStore.setItemAsync(TOKEN_KEY, token),
  clear: async () =>
    Platform.OS === "web" ? globalThis.localStorage?.removeItem(TOKEN_KEY) : SecureStore.deleteItemAsync(TOKEN_KEY),
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>");
  return value;
}

/**
 * GuardianTag's own sign-in: the backend checks the bcrypt-hashed password in
 * PostgreSQL and returns a signed JWT carrying the user's role. We keep that
 * token in secure storage so the user stays signed in across restarts until it
 * expires (the API then answers 401 and useApi signs out).
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const [token, setToken] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    storage
      .get()
      .catch(() => null)
      .then((stored) => {
        tokenRef.current = stored ?? null;
        setToken(stored ?? null);
        setIsLoaded(true);
      });
  }, []);

  const accept = useCallback(
    async ({ access_token, user }: TokenResponse) => {
      // A different account may have used this phone; never show its cached data.
      qc.clear();
      await storage.set(access_token);
      tokenRef.current = access_token;
      qc.setQueryData(qk.me, user);
      setToken(access_token);
      return user;
    },
    [qc],
  );

  const signOut = useCallback(async () => {
    tokenRef.current = null;
    setToken(null);
    await storage.clear().catch(() => undefined);
    qc.clear();
  }, [qc]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoaded,
      isSignedIn: !!token,
      getToken: async () => tokenRef.current,
      signIn: async (email, password, role) =>
        accept(await apiClient.post<TokenResponse>("/auth/login", { email, password, role })),
      signUp: async (input) => accept(await apiClient.post<TokenResponse>("/auth/register", input)),
      signOut,
    }),
    [isLoaded, token, accept, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
