import { useMemo } from "react";
import { Platform } from "react-native";
import { ApiError, apiClient } from "@/src/lib/api/client";
import { useAuth } from "@/src/lib/auth/AuthProvider";

/** apiClient bound to the signed-in user's token. A 401 means the login expired: sign out. */
export function useApi() {
  const { getToken, signOut } = useAuth();

  return useMemo(() => {
    const call = async <T>(fn: (token?: string) => Promise<T>): Promise<T> => {
      const token = (await getToken()) ?? undefined;
      try {
        return await fn(token);
      } catch (error) {
        if (token && error instanceof ApiError && error.status === 401) await signOut();
        throw error;
      }
    };
    return {
      get: <T>(path: string) => call((t) => apiClient.get<T>(path, t)),
      post: <T>(path: string, body?: unknown) => call((t) => apiClient.post<T>(path, body, t)),
      patch: <T>(path: string, body?: unknown) => call((t) => apiClient.patch<T>(path, body, t)),
      delete: <T>(path: string) => call((t) => apiClient.delete<T>(path, t)),
      /** Uploads a local image (camera/gallery URI) and returns its served path. */
      uploadImage: async (uri: string) => {
        const form = new FormData();
        if (Platform.OS === "web") {
          // The web picker gives a blob:/data: URL; browsers need the actual file.
          const blob = await (await fetch(uri)).blob();
          const ext = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
          form.append("file", blob, `photo.${ext}`);
        } else {
          const name = uri.split("/").pop() || "photo.jpg";
          const type = name.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
          // React Native's FormData accepts this {uri,name,type} file shape.
          form.append("file", { uri, name, type } as unknown as Blob);
        }
        return call((t) => apiClient.upload<{ url: string }>("/uploads", form, t));
      },
    };
  }, [getToken, signOut]);
}

export type Api = ReturnType<typeof useApi>;
