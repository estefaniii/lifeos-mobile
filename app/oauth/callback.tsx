import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Platform, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";

export default function OAuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      // If this is a password recovery link, send the user back to /login,
      // which has the "reset" form for setting a new password.
      if (Platform.OS === "web" && typeof window !== "undefined") {
        const hash = window.location.hash || "";
        const search = window.location.search || "";
        if (hash.includes("type=recovery") || search.includes("type=recovery")) {
          router.replace(`/login${hash || ""}`);
          return;
        }

        // PKCE OAuth: Supabase returns ?code=... and we exchange it for a session.
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        if (code) {
          try {
            await supabase.auth.exchangeCodeForSession(window.location.href);
          } catch {}
        }
      }

      // Wait briefly for storage write, then check session.
      await new Promise((r) => setTimeout(r, 300));
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace("/(tabs)");
        return;
      }

      // Retry once in case of a slow storage write
      await new Promise((r) => setTimeout(r, 1200));
      const { data: { session: retry } } = await supabase.auth.getSession();
      router.replace(retry ? "/(tabs)" : "/login");
    };
    run();
  }, [router]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#09090B" }}>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 14 }}>
        <ActivityIndicator size="large" color="#14B8A6" />
        <Text style={{ color: "#A1A1AA", fontSize: 14 }}>
          Completando autenticación…
        </Text>
      </View>
    </SafeAreaView>
  );
}
