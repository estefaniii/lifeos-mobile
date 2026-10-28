import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, Text, View, Pressable, Alert, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { ZONAS, AVISO_EJERCICIO, type Rutina, type Zona } from '@/constants/ejercicios';
import { useExerciseSessions, useLogExercise } from '@/hooks/use-vida';

// Ejercicio: elige una zona, una rutina y síguela paso a paso con temporizador de descanso.
export default function ExerciseScreen() {
  const c = useColors();
  const [zona, setZona] = useState<Zona | null>(null);
  const [rutina, setRutina] = useState<Rutina | null>(null);
  const { data: sesiones = [], error } = useExerciseSessions(30);

  const semana = useMemo(() => {
    const hace7 = new Date(); hace7.setDate(hace7.getDate() - 6);
    const desde = hace7.toISOString().slice(0, 10);
    const s = sesiones.filter((x) => x.done_on >= desde);
    return { veces: s.length, minutos: s.reduce((t, x) => t + x.minutes, 0) };
  }, [sesiones]);

  if (rutina && zona) return <Reproductor rutina={rutina} zona={zona} alSalir={() => setRutina(null)} />;

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 24, maxWidth: 640, width: '100%', alignSelf: 'center' }}>
          <Text style={{ color: c.foreground, fontSize: 30, fontWeight: '800' }}>{zona ? zona.nombre : 'Ejercicio'}</Text>
          <Text style={{ color: c.muted, fontSize: 14, marginTop: 4, marginBottom: 18 }}>
            {zona ? 'Elige una rutina y te guío ejercicio por ejercicio.' : 'Planes por zona, en casa y a tu ritmo.'}
          </Text>

          {!zona && (
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
              <Dato c={c} valor={semana.veces} texto="rutinas esta semana" />
              <Dato c={c} valor={semana.minutos} texto="minutos esta semana" />
            </View>
          )}
          {error && (
            <Text style={{ color: c.warning, fontSize: 13, marginBottom: 12 }}>
              Aún no puedo guardar tus rutinas: falta crear la tabla de ejercicio en la base de datos.
            </Text>
          )}

          {!zona ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {ZONAS.map((z) => (
                <Pressable key={z.id} onPress={() => setZona(z)} accessibilityRole="button"
                  style={({ pressed }) => ({ width: '48%', flexGrow: 1, backgroundColor: c.surface, borderRadius: 22, padding: 16,
                    borderWidth: 1, borderColor: c.border, opacity: pressed ? 0.8 : 1, minHeight: 104 })}>
                  <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: z.color, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                    <IconSymbol name="figure.run" size={20} color={c.background} />
                  </View>
                  <Text style={{ color: c.foreground, fontSize: 17, fontWeight: '700' }}>{z.nombre}</Text>
                  <Text style={{ color: c.muted, fontSize: 12.5 }}>{z.rutinas.length} rutinas</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {zona.rutinas.map((r) => (
                <Pressable key={r.id} onPress={() => setRutina(r)} accessibilityRole="button"
                  style={({ pressed }) => ({ backgroundColor: c.surface, borderRadius: 22, padding: 18, borderWidth: 1, borderColor: c.border, opacity: pressed ? 0.85 : 1 })}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: c.foreground, fontSize: 18, fontWeight: '700', flex: 1 }}>{r.nombre}</Text>
                    <Text style={{ color: zona.color, fontSize: 12, fontWeight: '800' }}>{r.nivel} · {r.minutos} min</Text>
                  </View>
                  <Text style={{ color: c.muted, fontSize: 13.5, marginTop: 8 }}>{r.ejercicios.map((e) => e.nombre).join(' · ')}</Text>
                </Pressable>
              ))}
              <Pressable onPress={() => setZona(null)} style={{ paddingVertical: 14, alignItems: 'center' }}>
                <Text style={{ color: c.primary, fontWeight: '700' }}>← Todas las zonas</Text>
              </Pressable>
            </View>
          )}
          <Text style={{ color: c.muted, fontSize: 12, marginTop: 20 }}>{AVISO_EJERCICIO}</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function Dato({ c, valor, texto }: { c: ReturnType<typeof useColors>; valor: number; texto: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: c.surface, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: c.border }}>
      <Text style={{ color: c.foreground, fontSize: 26, fontWeight: '800' }}>{valor}</Text>
      <Text style={{ color: c.muted, fontSize: 12.5 }}>{texto}</Text>
    </View>
  );
}

// ---------- rutina paso a paso ----------
function Reproductor({ rutina, zona, alSalir }: { rutina: Rutina; zona: Zona; alSalir: () => void }) {
  const c = useColors();
  const guardar = useLogExercise();
  const [i, setI] = useState(0);            // ejercicio
  const [serie, setSerie] = useState(1);
  const [cuenta, setCuenta] = useState(0);  // segundos que quedan (descanso o ejercicio por tiempo)
  const [modo, setModo] = useState<'listo' | 'trabajo' | 'descanso' | 'fin'>('listo');
  const inicio = useRef(Date.now());
  const e = rutina.ejercicios[i];

  useEffect(() => {
    if (cuenta <= 0 || (modo !== 'descanso' && modo !== 'trabajo')) return;
    const t = setTimeout(() => setCuenta((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [cuenta, modo]);

  useEffect(() => {
    if (cuenta !== 0) return;
    if (modo === 'descanso') { vibrar(); setModo('listo') }
    if (modo === 'trabajo') { vibrar(); terminarSerie() }
  }, [cuenta, modo]);

  function vibrar() { if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success) }

  function terminarSerie() {
    if (serie < e.series) { setSerie(serie + 1); setCuenta(e.descanso); setModo(e.descanso ? 'descanso' : 'listo'); return }
    if (i < rutina.ejercicios.length - 1) { setI(i + 1); setSerie(1); setCuenta(e.descanso); setModo(e.descanso ? 'descanso' : 'listo'); return }
    setModo('fin')
    const minutos = Math.max(1, Math.round((Date.now() - inicio.current) / 60000));
    guardar.mutate({ zone: zona.id, routine: rutina.nombre, minutes: minutos, exercises: rutina.ejercicios.map((x) => x.nombre) },
      { onError: () => Alert.alert('No se guardó', 'Tu rutina terminó, pero no pude guardarla en tu historial.') });
  }

  const empezar = () => { if (e.segundos) { setCuenta(e.segundos); setModo('trabajo') } else terminarSerie() };
  const progreso = (i + (serie - 1) / e.series) / rutina.ejercicios.length;

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 24, maxWidth: 640, width: '100%', alignSelf: 'center' }}>
          <Pressable onPress={alSalir} style={{ paddingVertical: 8 }}><Text style={{ color: c.primary, fontWeight: '700' }}>← {zona.nombre}</Text></Pressable>
          <Text style={{ color: c.foreground, fontSize: 26, fontWeight: '800', marginTop: 4 }}>{rutina.nombre}</Text>
          <View style={{ height: 6, backgroundColor: c.border, borderRadius: 6, marginVertical: 16, overflow: 'hidden' }}>
            <View style={{ width: `${(modo === 'fin' ? 1 : progreso) * 100}%`, height: '100%', backgroundColor: zona.color }} />
          </View>

          {modo === 'fin' ? (
            <View style={{ backgroundColor: c.surface, borderRadius: 26, padding: 24, borderWidth: 1, borderColor: c.border, alignItems: 'center' }}>
              <Text style={{ color: c.foreground, fontSize: 24, fontWeight: '800', marginBottom: 6 }}>¡Rutina completa!</Text>
              <Text style={{ color: c.muted, textAlign: 'center', marginBottom: 18 }}>
                {guardar.isSuccess ? 'Quedó guardada en tu semana.' : guardar.isPending ? 'Guardando…' : 'Bien hecho. Toma agua y respira.'}
              </Text>
              <Boton c={c} texto="Volver" onPress={alSalir} />
            </View>
          ) : (
            <View style={{ backgroundColor: c.surface, borderRadius: 26, padding: 22, borderWidth: 1, borderColor: c.border }}>
              <Text style={{ color: c.muted, fontSize: 13, fontWeight: '700' }}>Ejercicio {i + 1} de {rutina.ejercicios.length} · Serie {serie} de {e.series}</Text>
              <Text style={{ color: c.foreground, fontSize: 28, fontWeight: '800', marginTop: 6 }}>{e.nombre}</Text>
              <Text style={{ color: zona.color, fontSize: 40, fontWeight: '800', marginVertical: 10 }}>
                {modo === 'descanso' || modo === 'trabajo' ? `${cuenta}s` : e.reps ? `${e.reps} reps` : `${e.segundos}s`}
              </Text>
              <Text style={{ color: c.muted, fontSize: 15, marginBottom: 18 }}>
                {modo === 'descanso' ? `Descansa. Sigue: ${e.nombre}` : e.consejo}
              </Text>
              {modo === 'listo' && <Boton c={c} texto={e.reps ? 'Hecha esta serie' : 'Empezar'} onPress={empezar} />}
              {modo === 'trabajo' && <Boton c={c} texto="Terminar antes" onPress={() => setCuenta(0)} sec />}
              {modo === 'descanso' && <Boton c={c} texto="Saltar descanso" onPress={() => setCuenta(0)} sec />}
            </View>
          )}

          {modo !== 'fin' && (
            <View style={{ marginTop: 18, gap: 8 }}>
              {rutina.ejercicios.map((x, k) => (
                <View key={x.nombre} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.border, opacity: k < i ? 0.45 : 1 }}>
                  <Text style={{ color: k === i ? c.foreground : c.muted, fontWeight: k === i ? '700' : '400' }}>{k < i ? '✓ ' : ''}{x.nombre}</Text>
                  <Text style={{ color: c.muted, fontSize: 13 }}>{x.series} × {x.reps ? `${x.reps}` : `${x.segundos}s`}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function Boton({ c, texto, onPress, sec }: { c: ReturnType<typeof useColors>; texto: string; onPress: () => void; sec?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button"
      style={({ pressed }) => ({ minHeight: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22,
        backgroundColor: sec ? 'transparent' : c.primary, borderWidth: sec ? 1.5 : 0, borderColor: c.border, opacity: pressed ? 0.85 : 1 })}>
      <Text style={{ color: sec ? c.foreground : c.background, fontWeight: '800', fontSize: 16 }}>{texto}</Text>
    </Pressable>
  );
}
