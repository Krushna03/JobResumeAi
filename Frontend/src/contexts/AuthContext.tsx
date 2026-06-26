import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  apiJson,
  clearCsrfToken,
  type ApiUser,
  type AuthPayload,
} from "@/lib/api";

type AuthContextValue = {
  user: ApiUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  loginWithGoogleIdToken: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applyAuthPayload = useCallback((payload: AuthPayload) => {
    const u = payload.data?.user;
    if (u) setUser(u);
  }, []);

  // Auth is cookie-based; ask the server who we are rather than trusting any
  // client-held token. A 401 simply means anonymous.
  const refreshUser = useCallback(async () => {
    try {
      const res = await apiJson<{ success: boolean; data: ApiUser }>("/api/v1/users/me");
      setUser(res.success && res.data ? res.data : null);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const payload = await apiJson<AuthPayload>("/api/v1/users/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    applyAuthPayload(payload);
  }, [applyAuthPayload]);

  const register = useCallback(async (username: string, email: string, password: string) => {
    const payload = await apiJson<AuthPayload>("/api/v1/users/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    });
    applyAuthPayload(payload);
  }, [applyAuthPayload]);

  const loginWithGoogleIdToken = useCallback(
    async (idToken: string) => {
      const payload = await apiJson<AuthPayload>("/api/v1/users/google", {
        method: "POST",
        body: JSON.stringify({ idToken }),
      });
      applyAuthPayload(payload);
    },
    [applyAuthPayload]
  );

  const logout = useCallback(async () => {
    try {
      await apiJson("/api/v1/users/logout", { method: "POST" });
    } catch {
      /* still clear client */
    }
    clearCsrfToken();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      login,
      register,
      loginWithGoogleIdToken,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, register, loginWithGoogleIdToken, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
