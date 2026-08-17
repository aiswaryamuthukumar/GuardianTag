import { useCallback } from "react";
import { apiClient } from "@/lib/api/client";
import { useAppAuth } from "@/lib/auth/developmentMock";

export function useApi() {
  const { getToken } = useAppAuth();

  const withAuth = useCallback(
    <T,>(fn: (token: string | undefined) => Promise<T>) => async () => fn((await getToken()) ?? undefined),
    [getToken],
  );

  return {
    get: <T,>(path: string) => withAuth<T>((token) => apiClient.get<T>(path, token))(),
    post: <T,>(path: string, body?: unknown) =>
      withAuth<T>((token) => apiClient.post<T>(path, body, token))(),
    patch: <T,>(path: string, body?: unknown) =>
      withAuth<T>((token) => apiClient.patch<T>(path, body, token))(),
    delete: <T,>(path: string) => withAuth<T>((token) => apiClient.delete<T>(path, token))(),
  };
}
