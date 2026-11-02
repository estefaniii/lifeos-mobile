import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View, Pressable, RefreshControl, Modal, Platform, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { Titulo, Chispa, TINTA } from '@/components/decor';
import { useHistorial, useBorrarRegistro, useEspacio, useLiberarEspacio } from '@/hooks/use-registros';
import { agruparPorDia, horaCorta, duracion, type TipoRegistro } from '@/lib/registros';

// Historial: todo lo que hiciste, por día y con su hora.
const TIPO: Record<TipoRegistro, { emoji: string; color: string; nombre: string }> = {
  agua: { emoji: '💧', color: '#7CC4FF', nombre: 'Agua' },
  comida: { emoji: '🍽️', color: '#B6E36B', nombre: 'Comidas' },
  ejercicio: { emoji: '🏃‍♀️', color: '#FF7A6B', nombre: 'Ejercicio' },
  habito: { emoji: '✅', color: '#FFB547', nombre: 'Hábitos' },
  hobby: { emoji: '🎨', color: '#F49AC1', nombre: 'Hobbies' },
  meditacion: { emoji: '🧘‍♀️', color: '#C9A7FF', nombre: 'Meditación' },
  animo: { emoji: '🌤️', color: '#A39A90', nombre: 'Ánimo' },
};
const FILTROS: (TipoRegistro | null)[] = [null, 'agua', 'comida', 'ejercicio', 'habito', 'hobby', 'meditacion'];
const RANGOS = [7, 14, 30];

export default function HistoryScreen() {
  const router = useRouter();
  const [dias, setDias] = useState(14);
  const [filtro, setFiltro] = useState<TipoRegistro | null>(null);
  const { data, isLoading, refetch, isRefetching } = useHistorial(dias);
  const borrar = useBorrarRegistro();
  const [espacio, setEspacio] = useState(false);

  const porDia = useMemo(() => {
    const regs = (data?.registros ?? []).filter((r) => !filtro || r.tipo === filtro);
    return agruparPorDia(regs);
  }, [data, filtro]);

  return (
    <ScreenContainer className="p-0" containerClassName="bg-[#110F0D]">
      <ScrollView contentContainerStyle={{ paddingBottom: 150 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={TINTA.suave} />}>
        <View style={{ paddingHorizontal: 20, paddingTop: 24, maxWidth: 640, width: '100%', alignSelf: 'center', gap: 16 }}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Volver" style={{ minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' }}>
            <Text style={{ color: TINTA.suave, fontWeight: '700', fontSize: 15 }}>← Volver</Text>
          </Pressable>
          <View>
            <Titulo>Historial</Titulo>
            <Text style={{ color: TINTA.suave, fontSize: 15, marginTop: 6 }}>Lo que has hecho, día por día y con su hora.</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {FILTROS.map((f) => {
              const on = filtro === f, t = f ? TIPO[f] : null;
              return (
                <Pressable key={f ?? 'todo'} onPress={() => setFiltro(f)} accessibilityRole="button" accessibilityState={{ selected: on }}
                  style={{ minHeight: 44, paddingHorizontal: 14, borderRadius: 22, justifyContent: 'center', borderWidth: 1.5,
                    borderColor: on ? (t?.color ?? TINTA.texto) : TINTA.borde, backgroundColor: on ? (t?.color ?? TINTA.texto) : 'transparent' }}>
                  <Text style={{ color: on ? TINTA.fondo : TINTA.texto, fontWeight: '700' }}>{t ? `${t.emoji} ${t.nombre}` : 'Todo'}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {data?.faltaTabla && (
            <Text style={{ color: '#FFB547', fontSize: 13.5, lineHeight: 19 }}>
              Faltan las tablas de registros y hobbies en Supabase: por ahora solo salen ejercicio, hábitos y meditación.
            </Text>
          )}

          {!isLoading && porDia.length === 0 && (
            <View style={{ backgroundColor: TINTA.tarjeta, borderRadius: 28, padding: 22, borderWidth: 1, borderColor: TINTA.borde }}>
              <Chispa size={24} style={{ position: 'absolute', top: -10, right: 30 }} />
              <Text style={{ color: TINTA.texto, fontSize: 18, fontWeight: '800' }}>Aún no hay nada en estos días</Text>
              <Text style={{ color: TINTA.suave, marginTop: 6, lineHeight: 20 }}>Cada vaso de agua, comida, rutina, hábito o rato de hobby que anotes aparece aquí.</Text>
            </View>
          )}

          {porDia.map((d) => (
            <View key={d.clave}>
              {/* Día: el nombre grande y debajo las cuentas, solo las que no son cero */}
              <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
                <Titulo size={22} style={{ textTransform: d.titulo === 'Hoy' || d.titulo === 'Ayer' ? 'none' : 'capitalize' }}>{d.titulo}</Titulo>
                <Text style={{ color: TINTA.suave, fontSize: 13 }}>{d.registros.length} {d.registros.length === 1 ? 'registro' : 'registros'}</Text>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {d.resumen.vasos > 0 && <Resumen color={TIPO.agua.color} texto={`💧 ${d.resumen.vasos} vasos`} />}
                {d.resumen.minutosEjercicio > 0 && <Resumen color={TIPO.ejercicio.color} texto={`🏃‍♀️ ${duracion(d.resumen.minutosEjercicio)}`} />}
                {d.resumen.comidas > 0 && <Resumen color={TIPO.comida.color} texto={`🍽️ ${d.resumen.comidas}`} />}
                {d.resumen.habitos > 0 && <Resumen color={TIPO.habito.color} texto={`✅ ${d.resumen.habitos}`} />}
                {d.resumen.minutosHobby > 0 && <Resumen color={TIPO.hobby.color} texto={`🎨 ${duracion(d.resumen.minutosHobby)}`} />}
              </View>

              <View style={{ backgroundColor: TINTA.tarjeta, borderRadius: 24, borderWidth: 1, borderColor: TINTA.borde, paddingHorizontal: 14 }}>
                {d.registros.map((r, k) => {
                  const t = TIPO[r.tipo];
                  return (
                    <View key={`${r.tipo}-${r.id}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingVertical: 8, borderTopWidth: k ? 1 : 0, borderTopColor: TINTA.borde }}>
                      <Text style={{ color: TINTA.suave, fontSize: 13, width: 70, fontVariant: ['tabular-nums'] }}>{horaCorta(r.at)}</Text>
                      <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: t.color + '26', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 17 }}>{t.emoji}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: TINTA.texto, fontSize: 15, fontWeight: '700' }} numberOfLines={2}>{r.titulo}</Text>
                        {!!r.detalle && <Text style={{ color: TINTA.suave, fontSize: 13 }} numberOfLines={1}>{r.detalle}</Text>}
                      </View>
                      {r.borrable && (
                        <Pressable onPress={() => borrar.mutate(r)} accessibilityLabel={`Quitar ${r.titulo} de las ${horaCorta(r.at)}`}
                          style={{ width: 40, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ color: TINTA.suave, fontSize: 20 }}>×</Text>
                        </Pressable>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          ))}

          <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
            {RANGOS.map((n) => (
              <Pressable key={n} onPress={() => setDias(n)} style={{ minHeight: 44, paddingHorizontal: 16, borderRadius: 22, justifyContent: 'center', borderWidth: 1.5, borderColor: dias === n ? TINTA.texto : TINTA.borde }}>
                <Text style={{ color: TINTA.texto, fontWeight: dias === n ? '800' : '600' }}>{n} días</Text>
              </Pressable>
            ))}
          </View>

          <Pressable onPress={() => setEspacio(true)} accessibilityRole="button"
            style={{ minHeight: 52, borderRadius: 20, borderWidth: 1.5, borderColor: TINTA.borde, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}>
            <Text style={{ fontSize: 16 }}>🧹</Text>
            <Text style={{ color: TINTA.texto, fontWeight: '800', fontSize: 15 }}>Liberar espacio</Text>
          </Pressable>
        </View>
      </ScrollView>
      <LiberarEspacio visible={espacio} onClose={() => setEspacio(false)} />
    </ScreenContainer>
  );
}

// Borrar lo antiguo del historial para que la app no crezca sin fin. Pregunta antes.
function LiberarEspacio({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [meses, setMeses] = useState(12);
  const { data: filas = [], isLoading } = useEspacio(meses);
  const liberar = useLiberarEspacio();
  const total = filas.reduce((a, f) => a + f.cuantas, 0);
  const [hecho, setHecho] = useState('');

  const confirmar = () => {
    const msg = `¿Borrar ${total} registros de hace más de ${meses} meses? No se puede deshacer. Tus hábitos, hobbies, recetas, notas y finanzas no se tocan.`;
    const si = () => liberar.mutate(meses, {
      onSuccess: () => setHecho(`Listo: borré ${total} registros antiguos.`),
      onError: (e) => setHecho(`No se pudo: ${(e as Error).message}`),
    });
    if (Platform.OS === 'web') { if (window.confirm(msg)) si() }
    else Alert.alert('Liberar espacio', msg, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Borrar', style: 'destructive', onPress: si }]);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} accessibilityLabel="Cerrar" />
      <View style={{ backgroundColor: TINTA.tarjeta, borderTopLeftRadius: 32, borderTopRightRadius: 32, borderWidth: 1, borderColor: TINTA.borde, padding: 24, paddingBottom: 40, gap: 14 }}>
        <Titulo size={24}>Liberar espacio</Titulo>
        <Text style={{ color: TINTA.suave, fontSize: 14.5, lineHeight: 20 }}>Borra los registros antiguos del día a día. Lo que creaste (hábitos, hobbies, obras, recetas, notas y dinero) se queda.</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[3, 6, 12].map((m) => (
            <Pressable key={m} onPress={() => { setMeses(m); setHecho('') }} accessibilityState={{ selected: meses === m }}
              style={{ flex: 1, minHeight: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5,
                borderColor: meses === m ? TINTA.texto : TINTA.borde, backgroundColor: meses === m ? TINTA.texto : 'transparent' }}>
              <Text style={{ color: meses === m ? TINTA.fondo : TINTA.texto, fontWeight: '800' }}>+ de {m} meses</Text>
            </Pressable>
          ))}
        </View>
        {isLoading ? <ActivityIndicator color={TINTA.suave} /> : filas.map((f) => (
          <View key={f.tabla} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: TINTA.texto, fontSize: 14.5 }}>{f.nombre}</Text>
            <Text style={{ color: f.cuantas ? TINTA.texto : TINTA.suave, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{f.cuantas}</Text>
          </View>
        ))}
        {!!hecho && <Text style={{ color: '#5FD3A8', fontWeight: '700' }}>{hecho}</Text>}
        <Pressable onPress={confirmar} disabled={!total || liberar.isPending} accessibilityRole="button"
          style={{ minHeight: 52, borderRadius: 20, backgroundColor: total ? '#FF7A6B' : '#2A2521', alignItems: 'center', justifyContent: 'center' }}>
          {liberar.isPending ? <ActivityIndicator color={TINTA.fondo} /> :
            <Text style={{ color: total ? TINTA.fondo : TINTA.suave, fontWeight: '900', fontSize: 16 }}>{total ? `Borrar ${total} registros` : 'No hay nada tan antiguo'}</Text>}
        </Pressable>
      </View>
    </Modal>
  );
}

const Resumen = ({ color, texto }: { color: string; texto: string }) => (
  <View style={{ borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: color + '24', borderWidth: 1, borderColor: color + '55' }}>
    <Text style={{ color: TINTA.texto, fontSize: 13, fontWeight: '700' }}>{texto}</Text>
  </View>
);
