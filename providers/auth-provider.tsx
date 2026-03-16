import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import * as Api from "@/lib/_core/api";
import * as Auth from "@/lib/_core/auth";
import { supabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_PWA_USER_ID = "pwa-user-1";

// ---------------------------------------------------------------------------
// Supabase helpers (moved from hooks/use-auth.ts)
// ---------------------------------------------------------------------------

async function fetchProfileFromSupabase(
  userId: string,
): Promise<{ name?: string | null; gender?: string | null; email?: string | null } | null> {
  try {
    const { data } = await supabase
      .from("users")
      .select("name, gender, email")
      .eq("id", userId)
      .maybeSingle();
    return data as any;
  } catch {
    return null;
  }
}

async function ensurePwaUser(userId: string): Promise<Auth.User> {
  const profile = await fetchProfileFromSupabase(userId);
  if (profile) {
    return {
      id: userId,
      openId: userId,
      name: profile.name ?? null,
      email: profile.email ?? null,
      loginMethod: "pwa",
      lastSignedIn: new Date(),
      gender: (profile.gender as any) ?? null,
    };
  }
  // Create user row if it doesn't exist
  await supabase.from("users").upsert(
    {
      id: userId,
      name: null,
      email: null,
      last_active: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  return {
    id: userId,
    openId: userId,
    name: null,
    email: null,
    loginMethod: "pwa",
    lastSignedIn: new Date(),
    gender: null,
  };
}

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface AuthContextValue {
  user: Auth.User | null;
  loading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Auth.User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Web platform: try cookie-based auth first, fallback to PWA standalone mode
      if (Platform.OS === "web") {
        let apiUser: any = null;
        try {
          apiUser = await Api.getMe();
        } catch (err) {
          console.warn("[useAuth] API server not available, using PWA standalone mode");
        }

        if (apiUser) {
          // Manus API server is available -- use it
          const baseUser: Auth.User = {
            id: String(apiUser.id),
            openId: apiUser.openId,
            name: apiUser.name,
            email: apiUser.email,
            loginMethod: apiUser.loginMethod,
            lastSignedIn: new Date(apiUser.lastSignedIn),
          };
          const profile = await fetchProfileFromSupabase(String(apiUser.id));
          const userInfo: Auth.User = {
            ...baseUser,
            name: profile?.name ?? baseUser.name,
            gender: (profile?.gender as any) ?? null,
          };
          setUser(userInfo);
          await Auth.setUserInfo(userInfo);
        } else {
          // API server not available -- PWA standalone mode
          const cachedUser = await Auth.getUserInfo();
          const userId = cachedUser?.id || DEFAULT_PWA_USER_ID;

          const pwaUser = await ensurePwaUser(userId);
          setUser(pwaUser);
          await Auth.setUserInfo(pwaUser);
        }
        return;
      }

      // Native platform: token-based auth
      const sessionToken = await Auth.getSessionToken();
      if (!sessionToken) {
        setUser(null);
        return;
      }

      // 1. Show cached user immediately for responsiveness
      const cachedUser = await Auth.getUserInfo();
      if (cachedUser) {
        setUser(cachedUser);
      }

      // 2. Fetch fresh name/gender from Supabase
      if (cachedUser?.id) {
        const profile = await fetchProfileFromSupabase(String(cachedUser.id));
        if (profile) {
          const updatedUser: Auth.User = {
            ...cachedUser,
            name: profile.name ?? cachedUser.name,
            gender: (profile.gender as any) ?? (cachedUser as any).gender ?? null,
          };
          setUser(updatedUser);
          await Auth.setUserInfo(updatedUser);
        }
      }
    } catch (err) {
      const e = err instanceof Error ? err : new Error("Failed to fetch user");
      console.error("[useAuth] fetchUser error:", e);
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await Api.logout();
    } catch (err) {
      console.error("[Auth] Logout API call failed:", err);
    } finally {
      await Auth.removeSessionToken();
      await Auth.clearUserInfo();
      await supabase.auth.signOut().catch(() => {});
      setUser(null);
      setError(null);
    }
  }, []);

  const isAuthenticated = useMemo(() => Boolean(user), [user]);

  // Auto-fetch on mount
  useEffect(() => {
    if (Platform.OS === "web") {
      fetchUser();
    } else {
      Auth.getUserInfo().then((cachedUser) => {
        if (cachedUser) {
          setUser(cachedUser);
          setLoading(false);
          fetchUser();
        } else {
          fetchUser();
        }
      });
    }
  }, [fetchUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      error,
      isAuthenticated,
      refresh: fetchUser,
      logout,
    }),
    [user, loading, error, isAuthenticated, fetchUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return ctx;
}
