import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";

export default function OAuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // On web, Supabase client auto-detects tokens in URL hash/params
        // Just check if we have a session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (session) {
          setStatus("success");
          setTimeout(() => router.replace("/(tabs)"), 500);
        } else {
          // Try to extract from URL hash (Supabase PKCE flow)
          if (typeof window !== "undefined" && window.location.hash) {
            // Supabase JS client should handle this automatically
            // Wait a moment for the client to process
            await new Promise(resolve => setTimeout(resolve, 1000));
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            if (retrySession) {
              setStatus("success");
              setTimeout(() => router.replace("/(tabs)"), 500);
              return;
            }
          }
          setStatus("error");
          setErrorMessage("No se pudo completar la autenticación");
        }
      } catch (err: any) {
        console.error("[OAuth] Callback error:", err);
        setStatus("error");
        setErrorMessage(err.message || "Error de autenticación");
      }
    };

    handleCallback();
  }, [router]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#09090B' }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        {status === "processing" && (
          <>
            <ActivityIndicator size="large" color="#14B8A6" />
            <Text style={{ color: '#FAFAFA', fontSize: 16, marginTop: 16 }}>
              Completando autenticación...
            </Text>
          </>
        )}
        {status === "success" && (
          <Text style={{ color: '#14B8A6', fontSize: 16 }}>
            ¡Listo! Redirigiendo...
          </Text>
        )}
        {status === "error" && (
          <>
            <Text style={{ color: '#ef4444', fontSize: 18, fontWeight: '700', marginBottom: 8 }}>
              Error de autenticación
            </Text>
            <Text style={{ color: '#A1A1AA', fontSize: 14, textAlign: 'center' }}>
              {errorMessage}
            </Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
