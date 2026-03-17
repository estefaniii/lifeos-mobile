import { useEffect, useState } from "react";
import { Tabs, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;
  const { user, loading } = useAuth();
  const router = useRouter();

  // Check onboarding status
  useEffect(() => {
    if (loading || !user?.id) return;

    // Quick check localStorage first (web)
    if (Platform.OS === "web") {
      try {
        if (localStorage.getItem("lifeos_onboarded") === "true") return;
      } catch {}
    }

    // Check Supabase
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
          try { localStorage.setItem("lifeos_onboarded", "true"); } catch {}
        }
      } catch {}
    })();
  }, [user?.id, loading]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          marginBottom: Platform.OS === "ios" ? 0 : 4,
        },
        tabBarStyle: {
          paddingTop: 12,
          paddingBottom: bottomPadding,
          height: tabBarHeight + 10,
          backgroundColor: colors.background,
          borderTopWidth: 0,
          elevation: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="finances"
        options={{
          title: "Finanzas",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="dollarsign.circle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          title: "Salud",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="heart.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="ai-coach"
        options={{
          title: "IA Coach",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="brain.head.profile" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
      {/* Ocultar pestañas secundarias para limpiar el Navbar */}
      <Tabs.Screen
        name="productivity"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="mind"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
