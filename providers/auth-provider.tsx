import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import { supabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type User = {
  id: string;
  name: string | null;
  email: string | null;
  gender?: 'femenino' | 'masculino' | 'otro' | null;
};

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchProfile(userId: string): Promise<User> {
  const { data } = await supabase
    .from("users")
    .select("id, name, email, gender")
    .eq("id", userId)
    .maybeSingle();

  if (data) {
    return {
      id: data.id,
      name: data.name ?? null,
      email: data.email ?? null,
      gender: data.gender ?? null,
    };
  }

  return { id: userId, name: null, email: null, gender: null };
}

async function ensureUserRow(userId: string, email?: string | null) {
  await supabase.from("users").upsert(
    {
      id: userId,
      email: email ?? null,
      last_active: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load user from Supabase Auth session
  const loadUser = useCallback(async () => {
    try {
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        setUser(null);
        setLoading(false);
        return;
      }

      const authUser = session.user;
      await ensureUserRow(authUser.id, authUser.email);
      const profile = await fetchProfile(authUser.id);
      // Use auth email if profile doesn't have one
      profile.email = profile.email || authUser.email || null;
      // Use auth name if profile doesn't have one
      if (!profile.name && authUser.user_metadata?.full_name) {
        profile.name = authUser.user_metadata.full_name;
      }

      setUser(profile);
    } catch (err) {
      console.error("[Auth] loadUser error:", err);
      setError(err instanceof Error ? err : new Error("Failed to load user"));
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("[Auth] signOut error:", err);
    }
    setUser(null);
    setError(null);
    // Clear localStorage caches
    if (Platform.OS === "web") {
      try {
        // Clear all user-specific onboarding keys
        const keys = Object.keys(localStorage);
        keys.forEach(k => {
          if (k.startsWith("lifeos_onboarded_")) localStorage.removeItem(k);
        });
        localStorage.removeItem("lifeos_gender");
        localStorage.removeItem("manus-runtime-user-info");
      } catch {}
    }
  }, []);

  // Listen for auth state changes (login, logout, token refresh)
  useEffect(() => {
    // Initial load
    loadUser();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("[Auth] State change:", event);
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          if (session?.user) {
            await ensureUserRow(session.user.id, session.user.email);
            const profile = await fetchProfile(session.user.id);
            profile.email = profile.email || session.user.email || null;
            if (!profile.name && session.user.user_metadata?.full_name) {
              profile.name = session.user.user_metadata.full_name;
            }
            setUser(profile);
            setLoading(false);
          }
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setLoading(false);
        }
      },
    );

    return () => subscription.unsubscribe();
  }, [loadUser]);

  const isAuthenticated = useMemo(() => Boolean(user), [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      error,
      isAuthenticated,
      refresh: loadUser,
      logout,
    }),
    [user, loading, error, isAuthenticated, loadUser, logout],
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
