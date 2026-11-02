// Menú inferior flotante: una pastilla separada del borde, encima de la zona segura
// del iPhone (la raya de inicio no se come los iconos). Cada pestaña tiene su color,
// que solo se enciende en la activa.
import { View, Text, Pressable, Platform } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { TAB_COLOR } from '@/constants/tabs';

export const TAB_BAR_HEIGHT = 62;

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const visibles = state.routes.filter((r) => TAB_COLOR[r.name]);

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        // 12 px sobre la zona segura; sin zona segura (escritorio), 12 px del borde
        bottom: Math.max(insets.bottom, 12),
        alignItems: 'center',
        paddingHorizontal: 12,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          width: '100%',
          maxWidth: 520,
          height: TAB_BAR_HEIGHT,
          backgroundColor: '#1A1714',
          borderRadius: 31,
          borderWidth: 1,
          borderColor: '#2E2924',
          paddingHorizontal: 6,
          alignItems: 'center',
          // Sombra en capas, la luz viene de arriba
          ...(Platform.OS === 'web'
            ? ({ boxShadow: '0 1px 2px rgba(0,0,0,.4), 0 8px 24px rgba(0,0,0,.45)' } as object)
            : { shadowColor: '#000', shadowOpacity: 0.45, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 12 }),
        }}
      >
        {visibles.map((route) => {
          const { options } = descriptors[route.key];
          const index = state.routes.indexOf(route);
          const activa = state.index === index;
          const { color, icon } = TAB_COLOR[route.name];
          const label = (options.title ?? route.name) as string;

          const onPress = () => {
            if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!activa && !event.defaultPrevented) navigation.navigate(route.name, route.params);
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: activa }}
              accessibilityLabel={label}
              onPress={onPress}
              style={{ flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center' }}
            >
              <View
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 46,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: activa ? color + '2E' : 'transparent',
                }}
              >
                <IconSymbol name={icon} size={21} color={activa ? color : '#8C847B'} />
              </View>
              <Text
                numberOfLines={1}
                style={{
                  marginTop: 2,
                  fontSize: 10,
                  fontWeight: activa ? '800' : '600',
                  color: activa ? '#F5EFE8' : '#8C847B',
                }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
