export const AUTH_TOKEN_KEY = "jobresumeai_access_token";

export function getApiBase(): string {
  const raw = import.meta.env.VITE_API_URL;
  let base =
    typeof raw === "string" && raw.trim() !== ""
      ? raw.trim().replace(/\/$/, "")
      : "http://localhost:5000";
  // Common mistake: Vite runs on 8080; the API is on Backend PORT (often 5000).
  if (
    import.meta.env.DEV &&
    (/^https?:\/\/127\.0\.0\.1:8080\/?$/i.test(base) ||
      /^https?:\/\/localhost:8080\/?$/i.test(base))
  ) {
    console.warn(
      "[api] VITE_API_URL points at the Vite dev server. Using http://localhost:5000 for API requests."
    );
    base = "http://localhost:5000";
  }
  return base;
}

export function getStoredToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
  else localStorage.removeItem(AUTH_TOKEN_KEY);
}

export type ApiUser = {
  _id: string;
  username: string;
  email: string;
  authProvider?: string;
};

export type AuthPayload = {
  success: boolean;
  message?: string;
  data?: {
    user: ApiUser;
    accessToken: string;
  };
};

export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const body = init.body;
  if (body && typeof body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const token = getStoredToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${getApiBase()}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  let data: unknown = {};
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!res.ok) {
    const msg =
      typeof data === "object" && data !== null && "message" in data
        ? String((data as { message: unknown }).message)
        : res.statusText;
    throw new Error(msg || "Request failed");
  }

  return data as T;
}
