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
    const handle = async () => {
      try {
        const params = new URLSearchParams(
          typeof window !== "undefined" ? window.location.search : ""
        );
        const hash = typeof window !== "undefined" ? window.location.hash : "";
        const hashParams = new URLSearchParams(hash.replace("#", ""));

        const code = params.get("code");
        const type = params.get("type") || hashParams.get("type");
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (code) {
          const res = await supabase.auth.exchangeCodeForSession(code);
          if (res.error) throw res.error;
        }

        if (accessToken && refreshToken) {
          const res = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (res.error) throw res.error;
        }

        await new Promise(function(r) { setTimeout(r, 600); });

        const sessionRes = await supabase.auth.getSession();
        const session = sessionRes.data.session;

        if (session) {
          if (type === "recovery") {
            router.replace("/login?mode=new-password" as any);
          } else {
            router.replace("/(tabs)" as any);
          }
        } else {
          await new Promise(function(r) { setTimeout(r, 1200); });
          const retryRes = await supabase.auth.getSession();
          const retry = retryRes.data.session;
          if (retry) {
            router.replace(type === "recovery" ? "/login?mode=new-password" as any : "/(tabs)" as any);
          } else {
            router.replace("/login" as any);
          }
        }
      } catch (err) {
        const e = err as any;
        console.error("[OAuthCallback] error:", e);
        setErrorMsg(e.message || "Error de autenticacion");
        setStatus("error");
        setTimeout(function() { router.replace("/login" as any); }, 3000);
      }
    };

    handle();
  }, [router]);

  if (status === "loading") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#09090B", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#14B8A6" />
        <Text style={{ color: "#71717A", fontSize: 14, marginTop: 16 }}>Verificando sesion...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#09090B", justifyContent: "center", alignItems: "center" }}>
      <Text style={{ color: "#ef4444", fontSize: 16, fontWeight: "600", textAlign: "center", paddingHorizontal: 32 }}>
        Error al autenticar
      </Text>
      <Text style={{ color: "#71717A", fontSize: 13, textAlign: "center", marginTop: 8, paddingHorizontal: 32 }}>{errorMsg}</Text>
      <Text style={{ color: "#52525B", fontSize: 12, marginTop: 8 }}>Redirigiendo al inicio...</Text>
    </SafeAreaView>
  );
}