// El menú del celular: un botón ☰ arriba a la derecha que abre un
// panel desde la derecha con todas las secciones y tu perfil. En la computadora
// no se muestra: ahí el menú está fijo a la izquierda (floating-tab-bar.tsx).
import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { TINTA, acentoTexto } from '@/components/decor';
import { Avatar } from '@/components/floating-tab-bar';
import { SECCIONES, RUTA_URL, ANCHO_ESCRITORIO } from '@/constants/tabs';
import { useAuth } from '@/hooks/use-auth';
import { useAjustes } from '@/hooks/use-ajustes';

export function BotonMenu() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [abierto, setAbierto] = useState(false);
  if (width >= ANCHO_ESCRITORIO) return null;

  return (
    <>
      {/* Solo el ícono de menú: tu foto y tu nombre están dentro */}
      <Pressable
        onPress={() => setAbierto(true)}
        accessibilityRole="button"
        accessibilityLabel="Abrir el menú"
        style={{
          position: 'absolute', top: Math.max(insets.top, 12) + 10, right: 16, zIndex: 50,
          width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
          backgroundColor: TINTA.tarjeta, borderWidth: 1, borderColor: TINTA.borde,
        }}
      >
        <IconSymbol name="line.3.horizontal" size={22} color={TINTA.texto} />
      </Pressable>
      <PanelMenu abierto={abierto} onCerrar={() => setAbierto(false)} />
    </>
  );
}

function PanelMenu({ abierto, onCerrar }: { abierto: boolean; onCerrar: () => void }) {
  const router = useRouter();
  const ruta = usePathname();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user } = useAuth({ autoFetch: false });
  const { data: ajustes } = useAjustes();
  const ancho = Math.min(340, width * 0.86);
  const x = useRef(new Animated.Value(ancho)).current;

  // Entra desde la derecha en 260 ms; al cerrar sale más rápido
  useEffect(() => {
    if (abierto) Animated.timing(x, { toValue: 0, duration: 260, useNativeDriver: true }).start();
    else x.setValue(ancho);
  }, [abierto, ancho, x]);

  const ir = (r: string) => { onCerrar(); router.push(RUTA_URL(r) as never) };
  const actual = (r: string) => (r === 'index' ? ruta === '/' : ruta.startsWith(`/${r}`));
  const otras = SECCIONES.filter((s) => !s.abajo && s.ruta !== 'profile');
  const principales = SECCIONES.filter((s) => s.abajo);

  return (
    <Modal visible={abierto} transparent animationType="fade" onRequestClose={onCerrar}>
      <Pressable onPress={onCerrar} style={{ flex: 1, backgroundColor: TINTA.overlay }} accessibilityLabel="Cerrar el menú" />
      <Animated.View
        style={{
          position: 'absolute', top: 0, bottom: 0, right: 0, width: ancho, transform: [{ translateX: x }],
          backgroundColor: TINTA.menuFondo, borderLeftWidth: 1, borderLeftColor: TINTA.borde,
          paddingTop: Math.max(insets.top, 12) + 14, paddingBottom: Math.max(insets.bottom, 12) + 8,
        }}
      >
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}>
          {/* Tú: lleva al Perfil */}
          <Pressable onPress={() => ir('profile')} accessibilityRole="link"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 22, backgroundColor: TINTA.tarjeta, borderWidth: 1, borderColor: TINTA.borde, marginBottom: 14 }}>
            <Avatar url={ajustes?.avatarUrl} nombre={user?.name || user?.email || '?'} size={52} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: TINTA.texto, fontSize: 18, fontWeight: '900' }} numberOfLines={1}>{user?.name || 'Tu perfil'}</Text>
              <Text style={{ color: TINTA.suave, fontSize: 13 }}>Foto, recordatorios y tus datos</Text>
            </View>
            <Text style={{ color: TINTA.suave, fontSize: 20 }}>›</Text>
          </Pressable>

          {otras.map((s) => (
            <Pressable key={s.ruta} onPress={() => ir(s.ruta)} accessibilityRole="link"
              style={{ flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 60, paddingHorizontal: 12, borderRadius: 18, backgroundColor: actual(s.ruta) ? TINTA.elevada : 'transparent' }}>
              <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: s.color + '26', alignItems: 'center', justifyContent: 'center' }}>
                <IconSymbol name={s.icon} size={20} color={acentoTexto(s.color)} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: TINTA.texto, fontSize: 16, fontWeight: '800' }}>{s.nombre}</Text>
                {!!s.descripcion && <Text style={{ color: TINTA.suave, fontSize: 12.5 }}>{s.descripcion}</Text>}
              </View>
            </Pressable>
          ))}

          <View style={{ height: 1, backgroundColor: TINTA.borde, marginVertical: 10 }} />
          {principales.map((s) => (
            <Pressable key={s.ruta} onPress={() => ir(s.ruta)} accessibilityRole="link"
              style={{ flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 46, paddingHorizontal: 12, borderRadius: 16, backgroundColor: actual(s.ruta) ? TINTA.elevada : 'transparent' }}>
              <IconSymbol name={s.icon} size={19} color={actual(s.ruta) ? acentoTexto(s.color) : TINTA.tenue} />
              <Text style={{ color: actual(s.ruta) ? TINTA.texto : TINTA.suave, fontSize: 15, fontWeight: '700' }}>{s.nombre}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}
