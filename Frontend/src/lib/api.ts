export const AUTH_TOKEN_KEY = import.meta.env.AUTH_TOKEN_KEY || "";

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

// --- CSRF (double-submit) ------------------------------------------------
// Auth lives entirely in an httpOnly cookie, so the SPA holds no access
// token. To defend cookie-authenticated mutations against CSRF, we fetch a
// per-session token from /api/csrf, keep it in memory (never localStorage),
// and echo it back via the X-CSRF-Token header. The server compares it to
// the httpOnly csrf cookie that cross-site attackers cannot read or forge.
const CSRF_HEADER = "X-CSRF-Token";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

let csrfToken: string | null = null;
let csrfRequest: Promise<string | null> | null = null;

export async function ensureCsrfToken(force = false): Promise<string | null> {
  if (csrfToken && !force) return csrfToken;
  if (force) csrfToken = null;
  if (!csrfRequest) {
    csrfRequest = fetch(`${getApiBase()}/api/csrf`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = (await res.json().catch(() => ({}))) as { csrfToken?: string };
        csrfToken = data.csrfToken ?? null;
        return csrfToken;
      })
      .catch(() => null)
      .finally(() => {
        csrfRequest = null;
      });
  }
  return csrfRequest;
}

export function clearCsrfToken(): void {
  csrfToken = null;
}

/**
 * fetch wrapper that always sends cookies and attaches the CSRF header for
 * state-changing requests. On a 403 (stale/missing token) it refreshes the
 * token once and retries. Use this for non-JSON responses (PDF/blob streams).
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();
  const url = path.startsWith("http") ? path : `${getApiBase()}${path}`;

  const send = async (): Promise<Response> => {
    const headers = new Headers(init.headers);
    if (!SAFE_METHODS.has(method)) {
      const token = await ensureCsrfToken();
      if (token) headers.set(CSRF_HEADER, token);
    }
    return fetch(url, { ...init, headers, credentials: "include" });
  };

  let res = await send();
  if (res.status === 403 && !SAFE_METHODS.has(method)) {
    await ensureCsrfToken(true);
    res = await send();
  }
  return res;
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
  };
};

export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const body = init.body;
  if (body && typeof body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await apiFetch(path, { ...init, headers });

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
