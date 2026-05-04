import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";

export default function OAuthCallback() {
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'error'>('loading');
    const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
        const handle = async () => {
                try {
                          // Parse URL params (works on web)
                  const params = new URLSearchParams(
                              typeof window !== 'undefined' ? window.location.search : ''
                            );
                          const hash = typeof window !== 'undefined' ? window.location.hash : '';
                          const hashParams = new URLSearchParams(hash.replace('#', ''));

                  const code = params.get('code');
                          const type = params.get('type') || hashParams.get('type');
                          const accessToken = hashParams.get('access_token');
                          const refreshToken = hashParams.get('refresh_token');

                  // --- PKCE flow (code exchange) ---
                  if (code) {
                              const { error } = await supabase.auth.exchangeCodeForSession(code);
                              if (error) throw error;
                  }

                  // --- Implicit flow (hash tokens) ---
                  if (accessToken && refreshToken) {
                              const { error } = await supabase.auth.setSession({
                                            access_token: accessToken,
                                            refresh_token: refreshToken,
                              });
                              if (error) throw error;
                  }

                  // Small delay so Supabase finalizes the session
                  await new Promise(r => setTimeout(r, 600));

                  // Check if we got a session
                  const { data: { session } } = await supabase.auth.getSession();

                  if (session) {
                              // Recovery flow: redirect to login in new-password mode
                            if (type === 'recovery') {
                                          router.replace('/login?mode=new-password' as any);
                                          return;
                            }
                              // Normal flow: go to main app
                            router.replace('/(tabs)' as any);
                  } else {
                              // No session — retry once after a bit longer delay
                            await new Promise(r => setTimeout(r, 1200));
                              const { data: { session: retry } } = await supabase.auth.getSession();
                              if (retry) {
                                            router.replace(type === 'recovery' ? ('/login?mode=new-password' as any) : ('/(tabs)' as any));
                              } else {
                                            router.replace('/login' as any);
                              }
                  }
                } catch (err: any) {
                          console.error('[OAuthCallback] error:', err);
                          setErrorMsg(err.message || 'Error de autenticación');
                          setStatus('error');
                          setTimeout(() => router.replace('/login' as any), 3000);
                }
        };

                handle();
  }, [router]);

  return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#09090B', justifyContent: 'center', alignItems: 'center' }}>
          {status === 'loading' ? (
                  <View style={{ alignItems: 'center', gap: 16 }}>
                              <ActivityIndicator size="large" color="#14B8A6" />
                              <Text style={{ color: '#71717A', fontSize: 14 }}>Verificando sesión...</Text>Text>
                  </View>View>
                ) : (
                  <View style={{ alignItems: 'center', gap: 12, paddingHorizontal: 32 }}>
                              <Text style={{ color: '#ef4444', fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
                                            Error al autenticar
                              </Text>Text>
                              <Text style={{ color: '#71717A', fontSize: 13, textAlign: 'center' }}>{errorMsg}</Text>Text>
                              <Text style={{ color: '#52525B', fontSize: 12 }}>Redirigiendo al inicio...</Text>Text>
                  </View>View>
                )}
        </SafeAreaView>SafeAreaView>
      );
}
