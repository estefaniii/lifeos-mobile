import { useEffect, useRef } from "react";
import { Tabs, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View, Text, Pressable, Platform } from "react-native";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { useOnlineStatus } from "@/hooks/use-offline";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 8 : Math.max(insets.bottom, 8);
  const tabBarHeight = bottomPadding + 56;

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
        screenOptions={{
          tabBarActiveTintColor: colors.tint,
          tabBarInactiveTintColor: colors.tabIconDefault,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            height: tabBarHeight,
            paddingBottom: bottomPadding,
            paddingTop: 8,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Inicio",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={24} name="house.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="productivity"
          options={{
            title: "Tareas",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={24} name="checkmark.circle.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="health"
          options={{
            title: "Salud",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={24} name="heart.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="finances"
          options={{
            title: "Finanzas",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={24} name="dollarsign.circle.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="mind"
          options={{
            title: "Mente",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={24} name="brain.head.profile" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Perfil",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={24} name="person.fill" color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
