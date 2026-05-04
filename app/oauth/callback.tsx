import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";

export default function OAuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let didNavigate = false;

    const navigate = (path: string) => {
      if (didNavigate) return;
      didNavigate = true;
      if (unsubscribe) unsubscribe();
      router.replace(path as any);
    };

    const handle = async () => {
      try {
        // ── 1. Parse URL params (PKCE code or implicit tokens) ──────────────
        const params = new URLSearchParams(
          typeof window !== "undefined" ? window.location.search : ""
        );
        const hash =
          typeof window !== "undefined" ? window.location.hash : "";
        const hashParams = new URLSearchParams(hash.replace("#", ""));

        const code = params.get("code");
        const errorParam = params.get("error");
        const errorDesc = params.get("error_description");
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const hashType = hashParams.get("type");

        // ── 2. Handle explicit OAuth error ───────────────────────────────────
        if (errorParam) {
          throw new Error(errorDesc || errorParam);
        }

        // ── 3. Exchange code (PKCE flow) ─────────────────────────────────────
        if (code) {
          const res = await supabase.auth.exchangeCodeForSession(code);
          if (res.error) throw res.error;
        }
        // ── 4. Set session from hash tokens (implicit flow) ──────────────────
        else if (accessToken && refreshToken) {
          const res = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (res.error) throw res.error;
        }

        // ── 5. Wait for onAuthStateChange to fire with the real session ──────
        // This is the KEY fix: instead of immediately checking getSession()
        // (which may not be ready yet), we listen for the auth state change.
        // The auth-provider also listens, so by the time we navigate to (tabs),
        // the provider will already have the user object.
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Tiempo de espera agotado. Intenta de nuevo."));
          }, 10000);

          const { data } = supabase.auth.onAuthStateChange((event, session) => {
            if (
              event === "SIGNED_IN" ||
              event === "TOKEN_REFRESHED" ||
              event === "INITIAL_SESSION"
            ) {
              if (session) {
                clearTimeout(timeout);
                data.subscription.unsubscribe();
                const type = hashType || params.get("type");
                if (type === "recovery") {
                  navigate("/login?mode=new-password");
                } else {
                  navigate("/(tabs)");
                }
                resolve();
              }
            }
          });

          // Also do a fallback check immediately in case session is already set
          supabase.auth.getSession().then(({ data: sd }) => {
            if (sd.session) {
              clearTimeout(timeout);
              data.subscription.unsubscribe();
              const type = hashType || params.get("type");
              if (type === "recovery") {
                navigate("/login?mode=new-password");
              } else {
                navigate("/(tabs)");
              }
              resolve();
            }
          });
        });
      } catch (err) {
        const e = err as any;
        console.error("[OAuthCallback] error:", e);
        setErrorMsg(e?.message || "Error de autenticación");
        setStatus("error");
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      }
    };

    handle();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [router]);

  if (status === "loading") {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#09090B",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#14B8A6" />
        <Text style={{ color: "#71717A", fontSize: 14, marginTop: 16 }}>
          Verificando sesión...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#09090B",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text
        style={{
          color: "#ef4444",
          fontSize: 16,
          fontWeight: "600",
          textAlign: "center",
          paddingHorizontal: 24,
        }}
      >
        Error al autenticar
      </Text>
      <Text
        style={{
          color: "#71717A",
          fontSize: 13,
          textAlign: "center",
          marginTop: 8,
          paddingHorizontal: 24,
        }}
      >
        {errorMsg}
      </Text>
      <Text
        style={{ color: "#52525B", fontSize: 12, marginTop: 16 }}
      >
        Redirigiendo al inicio...
      </Text>
    </SafeAreaView>
  );
}
