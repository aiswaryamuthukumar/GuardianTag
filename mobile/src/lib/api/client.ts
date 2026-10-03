export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

/** The backend origin (no /api/v1), used for uploaded files and the WebSocket. */
export const API_ORIGIN = API_URL.replace(/\/api\/v\d+\/?$/, "");

export const WS_URL = process.env.EXPO_PUBLIC_WS_URL ?? `${API_ORIGIN.replace(/^http/, "ws")}/ws`;

const TIMEOUT_MS = 10_000;

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** FastAPI errors come back as {"detail": "..."} or {"detail": [{msg}]}; surface the human part. */
function extractMessage(text: string, fallback: string): string {
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed?.detail === "string") return parsed.detail;
    if (Array.isArray(parsed?.detail) && parsed.detail[0]?.msg) return parsed.detail[0].msg;
  } catch {
    // not JSON - use the raw text
  }
  return text || fallback;
}

type RequestOptions = { method: string; body?: unknown; formData?: FormData };

async function request<T>(path: string, { method, body, formData }: RequestOptions, token?: string): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        // fetch sets the multipart boundary itself for FormData
        ...(formData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
    });
  } catch (error) {
    const aborted = (error as Error)?.name === "AbortError";
    throw new ApiError(aborted ? "Request timed out - check your connection" : "Can't reach the server", 0);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    let text = "";
    try {
      text = await res.text();
    } catch {
      // unreadable body - fall back to statusText
    }
    throw new ApiError(extractMessage(text, res.statusText), res.status);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const apiClient = {
  get: <T>(path: string, token?: string) => request<T>(path, { method: "GET" }, token),
  post: <T>(path: string, body?: unknown, token?: string) => request<T>(path, { method: "POST", body }, token),
  patch: <T>(path: string, body?: unknown, token?: string) => request<T>(path, { method: "PATCH", body }, token),
  delete: <T>(path: string, token?: string) => request<T>(path, { method: "DELETE" }, token),
  upload: <T>(path: string, formData: FormData, token?: string) =>
    request<T>(path, { method: "POST", formData }, token),
};

/** Resolves a backend-relative upload path (e.g. /uploads/ab.jpg) to a full URL. */
export function fileUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  return /^https?:\/\//.test(path) ? path : `${API_ORIGIN}${path}`;
}
