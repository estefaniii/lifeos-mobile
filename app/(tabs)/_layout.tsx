import { useEffect, useRef } from "react";
import { Tabs, useRouter } from "expo-router";
import { View, Text, Pressable, Platform } from "react-native";
import { FloatingTabBar } from "@/components/floating-tab-bar";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { useOnlineStatus } from "@/hooks/use-offline";

export default function TabLayout() {
  const colors = useColors();
  const { user, loading } = useAuth();
  const router = useRouter();
  const { online, queueSize, syncNow } = useOnlineStatus();

  // Guard de autenticación
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (loading) {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
      return;
    }

    if (user) {
      if (redirectTimer.current) {
        clearTimeout(redirectTimer.current);
        redirectTimer.current = null;
      }
      return;
    }

    // 1.5 s de gracia tras OAuth de Google
    redirectTimer.current = setTimeout(() => {
      redirectTimer.current = null;
      router.replace("/login");
    }, 1500);

    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, [user, loading]);

  // Verificar onboarding
  useEffect(() => {
    if (loading) return;
    if (!user) return;

    if (Platform.OS === "web") {
      try {
        if (localStorage.getItem(`lifeos_onboarded_${user.id}`)) return;
      } catch (_) {}
    }

    (async () => {
      try {
        const { data } = await supabase
          .from("users")
          .select("onboarding_completed")
          .eq("id", user.id)
          .maybeSingle();
        if (!data?.onboarding_completed) {
          router.replace("/onboarding");
        } else if (Platform.OS === "web") {
          try {
            localStorage.setItem(`lifeos_onboarded_${user.id}`, "1");
          } catch (_) {}
        }
      } catch (_) {}
    })();
  }, [user, loading]);

  return (
    <View style={{ flex: 1 }}>
      {/* Banner Sin Conexión */}
      {!online && (
        <View
          style={{
            backgroundColor: "#f59e0b",
            paddingVertical: 6,
            paddingHorizontal: 16,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Text style={{ color: "#1c1917", fontSize: 13, fontWeight: "600" }}>
            Sin conexión
          </Text>
          {queueSize > 0 && (
            <Text style={{ color: "#1c1917", fontSize: 13 }}>
              · {queueSize} cambio{queueSize !== 1 ? "s" : ""} pendiente
              {queueSize !== 1 ? "s" : ""}
            </Text>
          )}
          <Pressable onPress={syncNow} style={{ marginLeft: 8 }}>
            <Text
              style={{
                color: "#1c1917",
                fontSize: 13,
                textDecorationLine: "underline",
              }}
            >
              Sincronizar
            </Text>
          </Pressable>
        </View>
      )}

      <Tabs
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          // El menú flota encima del contenido; cada pantalla deja su hueco abajo
          tabBarStyle: { position: "absolute" },
          sceneStyle: { backgroundColor: colors.background },
        }}
      >
        {/* ===== Menú inferior (el color y el icono están en constants/tabs.ts) ===== */}
        <Tabs.Screen name="index" options={{ title: "Inicio" }} />
        <Tabs.Screen name="exercise" options={{ title: "Ejercicio" }} />
        <Tabs.Screen name="food" options={{ title: "Comida" }} />
        <Tabs.Screen name="hobbies" options={{ title: "Hobbies" }} />
        <Tabs.Screen name="finances" options={{ title: "Finanzas" }} />
        <Tabs.Screen name="notes" options={{ title: "Notas" }} />
        {/* ===== Ocultas (accesibles desde los hubs) ===== */}
        <Tabs.Screen name="history" options={{ href: null }} />
        <Tabs.Screen name="health" options={{ href: null }} />
        <Tabs.Screen name="profile" options={{ href: null }} />
      </Tabs>
    </View>
  );
}
