// La navegación de la app, según el ancho:
// - Celular y tableta: una pastilla flotante abajo, separada del borde y encima de
//   la zona segura del iPhone, con las cinco secciones principales. El resto
//   (Notas, Historial, Sueño y agua, Perfil) está en el menú de arriba (menu-lateral.tsx).
// - Computadora: una columna fija a la izquierda con todas las secciones.
import { View, Text, Pressable, Platform, useWindowDimensions } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Titulo, TINTA } from '@/components/decor';
import { SECCIONES, seccion, ANCHO_ESCRITORIO } from '@/constants/tabs';
import { useAuth } from '@/hooks/use-auth';
import { useAjustes } from '@/hooks/use-ajustes';

export const TAB_BAR_HEIGHT = 62;

export function FloatingTabBar(props: BottomTabBarProps) {
  const { width } = useWindowDimensions();
  return width >= ANCHO_ESCRITORIO ? <MenuIzquierdo {...props} /> : <BarraAbajo {...props} />;
}

function useIr({ state, navigation }: BottomTabBarProps) {
  return (ruta: string) => {
    const route = state.routes.find((r) => r.name === ruta);
    if (!route) return;
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (state.routes[state.index].name !== ruta && !event.defaultPrevented) navigation.navigate(route.name, route.params);
  };
}

function BarraAbajo(props: BottomTabBarProps) {
  const { state } = props;
  const insets = useSafeAreaInsets();
  const ir = useIr(props);
  const actual = state.routes[state.index].name;
  const visibles = SECCIONES.filter((s) => s.abajo);

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 0, right: 0, bottom: Math.max(insets.bottom, 12), alignItems: 'center', paddingHorizontal: 12 }}
    >
      <View
        style={{
          flexDirection: 'row', width: '100%', maxWidth: 520, height: TAB_BAR_HEIGHT,
          backgroundColor: TINTA.tarjeta, borderRadius: 31, borderWidth: 1, borderColor: TINTA.borde,
          paddingHorizontal: 6, alignItems: 'center',
          // Sombra en capas, la luz viene de arriba
          ...(Platform.OS === 'web'
            ? ({ boxShadow: '0 1px 2px rgba(0,0,0,.4), 0 8px 24px rgba(0,0,0,.45)' } as object)
            : { shadowColor: '#000', shadowOpacity: 0.45, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 12 }),
        }}
      >
        {visibles.map((s) => {
          const activa = actual === s.ruta;
          return (
            <Pressable key={s.ruta} accessibilityRole="tab" accessibilityState={{ selected: activa }} accessibilityLabel={s.nombre}
              onPress={() => ir(s.ruta)} style={{ flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ alignItems: 'center', justifyContent: 'center', width: 48, height: 30, borderRadius: 15, backgroundColor: activa ? s.color + '2E' : 'transparent' }}>
                <IconSymbol name={s.icon} size={21} color={activa ? s.color : '#8C847B'} />
              </View>
              <Text numberOfLines={1} style={{ marginTop: 2, fontSize: 10.5, fontWeight: activa ? '800' : '600', color: activa ? TINTA.texto : '#8C847B' }}>
                {s.nombre}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function MenuIzquierdo(props: BottomTabBarProps) {
  const { state } = props;
  const ir = useIr(props);
  const actual = state.routes[state.index].name;
  const { user } = useAuth({ autoFetch: false });
  const { data: ajustes } = useAjustes();
  const principales = SECCIONES.filter((s) => s.abajo);
  const otras = SECCIONES.filter((s) => !s.abajo && s.ruta !== 'profile');

  const fila = (ruta: string) => {
    const s = seccion(ruta)!;
    const activa = actual === ruta;
    return (
      <Pressable key={ruta} onPress={() => ir(ruta)} accessibilityRole="link" accessibilityState={{ selected: activa }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44, paddingHorizontal: 12, borderRadius: 14, backgroundColor: activa ? '#2A2521' : 'transparent' }}>
        <IconSymbol name={s.icon} size={19} color={activa ? s.color : '#8C847B'} />
        <Text style={{ color: activa ? TINTA.texto : TINTA.suave, fontSize: 15, fontWeight: activa ? '800' : '600' }}>{s.nombre}</Text>
      </Pressable>
    );
  };

  return (
    <View style={{ width: 248, height: '100%', backgroundColor: '#0B0A09', borderRightWidth: 1, borderRightColor: TINTA.borde, paddingHorizontal: 14, paddingTop: 26, paddingBottom: 18 }}>
      <Titulo size={26} style={{ paddingHorizontal: 12, marginBottom: 22 }}>LifeOS</Titulo>
      <View style={{ gap: 2 }}>{principales.map((s) => fila(s.ruta))}</View>
      <View style={{ height: 1, backgroundColor: TINTA.borde, marginVertical: 14, marginHorizontal: 12 }} />
      <View style={{ gap: 2 }}>{otras.map((s) => fila(s.ruta))}</View>

      {/* Tú, abajo: lleva al Perfil */}
      <Pressable onPress={() => ir('profile')} accessibilityRole="link" accessibilityLabel="Perfil"
        style={{ marginTop: 'auto', flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 16, backgroundColor: actual === 'profile' ? '#2A2521' : 'transparent' }}>
        <Avatar url={ajustes?.avatarUrl} nombre={user?.name || user?.email || '?'} size={38} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: TINTA.texto, fontWeight: '800' }} numberOfLines={1}>{user?.name || 'Tu perfil'}</Text>
          <Text style={{ color: TINTA.suave, fontSize: 12 }}>Perfil y recordatorios</Text>
        </View>
      </Pressable>
    </View>
  );
}

export function Avatar({ url, nombre, size = 40 }: { url?: string | null; nombre: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: '#2A2521', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFB547' }}>
      {url
        ? <Image source={{ uri: url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        : <Text style={{ color: '#FFB547', fontWeight: '900', fontSize: size * 0.42 }}>{nombre.trim().charAt(0).toUpperCase()}</Text>}
    </View>
  );
}
