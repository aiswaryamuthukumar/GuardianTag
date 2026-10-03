import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/src/lib/api/keys";
import { useApi } from "@/src/lib/api/useApi";
import { useAuth } from "@/src/lib/auth/AuthProvider";
import type { TelegramLinkCode, User, UserUpdate, WardenContact } from "@/src/types/api";

/** The signed-in user's GuardianTag profile (role, hostel block, room, alert preferences). */
export function useMe() {
  const api = useApi();
  const { isSignedIn } = useAuth();
  return useQuery({
    queryKey: qk.me,
    queryFn: () => api.get<User>("/auth/me"),
    enabled: isSignedIn,
    staleTime: 60_000,
  });
}

export function useUpdateMe() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UserUpdate) => api.patch<User>("/auth/me", body),
    onSuccess: (user) => qc.setQueryData(qk.me, user),
  });
}

export function useMyWardens() {
  const api = useApi();
  return useQuery({ queryKey: qk.myWardens, queryFn: () => api.get<WardenContact[]>("/auth/wardens") });
}

export function useTelegramLink() {
  const api = useApi();
  return useMutation({ mutationFn: () => api.post<TelegramLinkCode>("/auth/telegram/link-code") });
}

export function useChangePassword() {
  const api = useApi();
  return useMutation({
    mutationFn: (body: { current_password: string; new_password: string }) => api.post<void>("/auth/change-password", body),
  });
}
