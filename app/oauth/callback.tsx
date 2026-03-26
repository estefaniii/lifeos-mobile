import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";

export default function OAuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const check = async () => {
      // Small delay to let Supabase process URL tokens
      await new Promise(r => setTimeout(r, 500));
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace("/(tabs)");
      } else {
        // Retry once after a longer wait
        await new Promise(r => setTimeout(r, 1500));
        const { data: { session: retry } } = await supabase.auth.getSession();
        router.replace(retry ? "/(tabs)" : "/login");
      }
    };
    check();
  }, [router]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#09090B' }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#14B8A6" />
        <Text style={{ color: '#A1A1AA', fontSize: 14, marginTop: 16 }}>
          Completando autenticación...
        </Text>
      </View>
    </SafeAreaView>
  );
}
