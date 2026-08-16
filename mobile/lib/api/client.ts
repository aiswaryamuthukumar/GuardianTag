const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown };

async function request<T>(path: string, options: RequestOptions = {}, token?: string): Promise<T> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      let errorText = res.statusText;
      try {
        errorText = await res.text();
      } catch (e) {
        // Response is unreadable - use statusText
      }
      throw new ApiError(errorText || res.statusText, res.status);
    }

    if (res.status === 204) return undefined as T;

    let text = "";
    try {
      text = await res.text();
    } catch (e) {
      throw new ApiError("Failed to read response", res.status);
    }

    if (!text) return undefined as T;

    try {
      return JSON.parse(text) as T;
    } catch (e) {
      throw new ApiError("Failed to parse JSON response", res.status);
    }
  } catch (error) {
    // Handle different error types
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof TypeError) {
      // Network error or fetch failed
      if (error.message.includes("abort")) {
        throw new ApiError("Request timeout - check your connection", 0);
      }
      throw new ApiError("Network error - check your internet connection", 0);
    }

    if (error instanceof SyntaxError) {
      throw new ApiError("Invalid server response", 0);
    }

    // Unknown error
    throw new ApiError((error as Error).message || "Unknown error", 0);
  }
}

export const apiClient = {
  get: <T>(path: string, token?: string) => request<T>(path, { method: "GET" }, token),
  post: <T>(path: string, body?: unknown, token?: string) =>
    request<T>(path, { method: "POST", body }, token),
  patch: <T>(path: string, body?: unknown, token?: string) =>
    request<T>(path, { method: "PATCH", body }, token),
  delete: <T>(path: string, token?: string) => request<T>(path, { method: "DELETE" }, token),
};