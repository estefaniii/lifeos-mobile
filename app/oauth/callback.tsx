import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";

export default function OAuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "error">("loading");
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
        // ── 1. Leer parámetros de URL (código PKCE o tokens implícitos) ──────
        const params = new URLSearchParams(
          typeof window !== "undefined" ? window.location.search : ""
        );
        const hash = typeof window !== "undefined" ? window.location.hash : "";
        const hashParams = new URLSearchParams(hash.replace("#", ""));

        const code = params.get("code");
        const errorParam = params.get("error");
        const errorDesc = params.get("error_description");
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const hashType = hashParams.get("type");

        // ── 2. Manejar error explícito de OAuth ──────────────────────────────
        if (errorParam) {
          throw new Error(errorDesc ?? errorParam);
        }

        // ── 3. Intercambiar código (flujo PKCE) ──────────────────────────────
        if (code) {
          const res = await supabase.auth.exchangeCodeForSession(code);
          if (res.error) throw res.error;

        // ── 4. Establecer sesión con tokens del hash (flujo implícito) ───────
        } else if (accessToken && refreshToken) {
          const res = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (res.error) throw res.error;
        }

        // ── 5. Determinar destino de redirección ─────────────────────────────
        const type = hashType ?? params.get("type");

        // ── 6. Esperar confirmación del estado de auth (máx 10 s) ────────────
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(
            () => reject(new Error("Tiempo de espera agotado. Intenta de nuevo.")),
            10000
          );

          const { data } = supabase.auth.onAuthStateChange((event, session) => {
            if (
              (event === "SIGNED_IN" ||
                event === "TOKEN_REFRESHED" ||
                event === "INITIAL_SESSION") &&
              session
            ) {
              clearTimeout(timeout);
              data.subscription.unsubscribe();
              navigate(type === "recovery" ? "/login?mode=new-password" : "/(tabs)");
              resolve();
            }
          });

          unsubscribe = () => data.subscription.unsubscribe();

          // Fallback: verificar si la sesión ya existe en este momento
          supabase.auth.getSession().then(({ data: sd }) => {
            if (sd.session) {
              clearTimeout(timeout);
              data.subscription.unsubscribe();
              navigate(type === "recovery" ? "/login?mode=new-password" : "/(tabs)");
              resolve();
            }
          });
        });
      } catch (err) {
        const msg = (err as any)?.message ?? "Error de autenticación";
        console.error("[OAuthCallback] error:", msg);
        setErrorMsg(msg);
        setStatus("error");
        setTimeout(() => navigate("/login"), 3000);
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
          fontSize: 18,
          fontWeight: "600",
          textAlign: "center",
          paddingHorizontal: 32,
        }}
      >
        Error al autenticar
      </Text>
      <Text
        style={{
          color: "#71717A",
          fontSize: 14,
          textAlign: "center",
          marginTop: 12,
          paddingHorizontal: 32,
        }}
      >
        {errorMsg}
      </Text>
      <Text style={{ color: "#52525B", fontSize: 12, marginTop: 24 }}>
        Redirigiendo al inicio...
      </Text>
    </SafeAreaView>
  );
}
