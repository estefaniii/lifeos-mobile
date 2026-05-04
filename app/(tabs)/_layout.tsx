import { useEffect } from "react";
import { Tabs, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View, Text, Pressable } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { useOnlineStatus } from "@/hooks/use-offline";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;
  const { user, loading } = useAuth();
  const router = useRouter();
  const { online, queueSize, syncNow } = useOnlineStatus();

  // Auth gate: redirect to login if not authenticated
  // We use a two-stage check: wait for loading to finish, then give a
  // short grace period in case the auth-provider is still processing
  // the onAuthStateChange event (e.g. right after Google OAuth callback).
  useEffect(() => {
    if (loading) return;
    if (user?.id) return; // authenticated — do nothing

    // Give the auth provider 800ms to process any pending auth state change
    // before concluding the user is truly logged out.
    const timer = setTimeout(() => {
      router.replace("/login");
    }, 800);
    return () => clearTimeout(timer);
  }, [user?.id, loading]);

  // Check onboarding status
  useEffect(() => {
    if (loading) return;
    if (!user?.id) return;

    if (Platform.OS === "web") {
      try {
        if (localStorage.getItem(`lifeos_onboarded_${user.id}`)) return;
      } catch {}
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
          try { localStorage.setItem(`lifeos_onboarded_${user.id}`, "1"); }
          catch {}
        }
      } catch {}
    })();
  }, [user?.id, loading]);

  return (
    <View style={{ flex: 1 }}>
      {/* Offline Banner */}
      {!online && (
        <View style={{
          backgroundColor: '#f59e0b',
          paddingVertical: 6,
          paddingHorizontal: 16,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 8,
        }}>
          <Text style={{ color: '#1c1917', fontSize: 12, fontWeight: '600' }}>
            Sin conexión
          </Text>
          {queueSize > 0 && (
            <Text style={{ color: '#1c1917', fontSize: 12 }}>
              · {queueSize} cambio{queueSize !== 1 ? 's' : ''} pendiente{queueSize !== 1 ? 's' : ''}
            </Text>
          )}
          {queueSize > 0 && (
            <Pressable onPress={syncNow} style={{ marginLeft: 8 }}>
              <Text style={{ color: '#1c1917', fontSize: 12, textDecorationLine: 'underline' }}>
                Sincronizar
              </Text>
            </Pressable>
          )}
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
            paddingTop: 4,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Inicio",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={26} name="house.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="habits"
          options={{
            title: "Hábitos",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={26} name="checkmark.circle.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="health"
          options={{
            title: "Salud",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={26} name="heart.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="finance"
          options={{
            title: "Finanzas",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={26} name="dollarsign.circle.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Perfil",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={26} name="person.fill" color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
