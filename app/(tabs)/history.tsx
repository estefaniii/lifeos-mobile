import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { Titulo, Chispa, TINTA } from '@/components/decor';
import { useHistorial, useBorrarRegistro } from '@/hooks/use-registros';
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
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const Resumen = ({ color, texto }: { color: string; texto: string }) => (
  <View style={{ borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: color + '24', borderWidth: 1, borderColor: color + '55' }}>
    <Text style={{ color: TINTA.texto, fontSize: 13, fontWeight: '700' }}>{texto}</Text>
  </View>
);
