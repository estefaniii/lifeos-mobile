import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, Text, View, Pressable, Alert, Platform, Image, Linking } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import {
  ZONAS, AVISO_EJERCICIO, buscarRutina, listasPara, urlComoSeHace, urlSpotify, urlYoutubeMusic,
  type Rutina, type Zona,
} from '@/constants/ejercicios';
import { useExerciseSessions, useLogExercise } from '@/hooks/use-vida';
import { useMarcarDia } from '@/hooks/use-programas';
import { ProgramasEjercicio, type MarcaDia } from '@/components/programas-ejercicio';
import { Sticker, Titulo } from '@/components/decor';
import { fechaLocal } from '@/lib/registros';

type C = ReturnType<typeof useColors>;

/** La rutina en curso. Con `marca` viene de un día de un programa o reto. */
type EnCurso = { rutina: Rutina; zona: Zona; marca?: MarcaDia };

// Abre un enlace externo (YouTube, Spotify). A nivel de módulo para no
// recrearlo en cada render.
function abrir(url: string) {
  Linking.openURL(url).catch(() => Alert.alert('No pude abrirlo', 'Prueba otra vez en un momento.'));
}

// Ejercicio: elige una zona, una rutina y síguela paso a paso con temporizador de descanso.
export default function ExerciseScreen() {
  const c = useColors();
  const [zona, setZona] = useState<Zona | null>(null);
  const [enCurso, setEnCurso] = useState<EnCurso | null>(null);
  /*
   * Dos cosas distintas en la misma pestaña: las rutinas que trae la app
   * y los planes que ella sigue (retos de 21 días o de alguien más).
   * Separadas porque se usan de forma distinta —una rutina se hace de
   * principio a fin con el temporizador; un programa es un calendario de
   * semanas— y mezcladas en una sola lista no se sabría cuál es cuál.
   */
  const [vista, setVista] = useState<'zonas' | 'programas'>('zonas');
  // El programa abierto vive aquí y no en el componente de programas: al
  // abrir el reproductor ese componente se desmonta y, al volver, tiene
  // que seguir en el mismo programa.
  const [programaAbierto, setProgramaAbierto] = useState<string | null>(null);
  const marcar = useMarcarDia();
  const { data: sesiones = [], error } = useExerciseSessions(30);

  const semana = useMemo(() => {
    const hace7 = new Date(); hace7.setDate(hace7.getDate() - 6);
    const desde = fechaLocal(hace7);
    const s = sesiones.filter((x) => x.done_on >= desde);
    return { veces: s.length, minutos: s.reduce((t, x) => t + x.minutes, 0) };
  }, [sesiones]);

  if (enCurso) {
    const m = enCurso.marca;
    return (
      <Reproductor
        key={`${enCurso.rutina.id}-${m?.dia ?? ''}`}
        rutina={enCurso.rutina}
        zona={enCurso.zona}
        volverA={m ? 'Mi programa' : enCurso.zona.nombre}
        alSalir={() => setEnCurso(null)}
        // Si el día ya estaba marcado no se toca: marcar dos veces lo desmarcaría.
        alTerminar={m && !m.yaHecho
          ? () => marcar.mutate({ programId: m.programId, dia: m.dia, hecho: false },
              { onError: () => Alert.alert('No se marcó el día', 'Márcalo a mano en tu programa.') })
          : undefined}
      />
    );
  }

  const hacerRutinaDePrograma = (rutinaId: string, marca: MarcaDia) => {
    const r = buscarRutina(rutinaId);
    if (!r) { Alert.alert('No encuentro esa rutina', 'Puede que haya cambiado de nombre.'); return; }
    setEnCurso({ ...r, marca });
  };

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ paddingBottom: 150 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 24, maxWidth: 640, width: '100%', alignSelf: 'center' }}>
          {zona ? (
            <CabeceraZona c={c} zona={zona} alVolver={() => setZona(null)} />
          ) : (
            <>
              <Titulo color={c.foreground}>Ejercicio</Titulo>
              <Text style={{ color: c.muted, fontSize: 14, marginTop: 6, marginBottom: 18 }}>
                {vista === 'programas'
                  ? 'Tus retos de 21 días y los planes que sigues, día por día.'
                  : 'Rutinas por zona, en casa y a tu ritmo.'}
              </Text>

              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18 }}>
                {([['zonas', 'Rutinas'], ['programas', 'Programas y retos']] as const).map(([k, texto]) => (
                  <Pressable
                    key={k}
                    onPress={() => setVista(k)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: vista === k }}
                    style={{
                      paddingHorizontal: 16, minHeight: 44, justifyContent: 'center', borderRadius: 999,
                      backgroundColor: vista === k ? c.primary : c.surface,
                      borderWidth: 1, borderColor: vista === k ? c.primary : c.border,
                    }}
                  >
                    <Text style={{ color: vista === k ? c.background : c.muted, fontWeight: '700', fontSize: 14 }}>
                      {texto}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {!zona && vista === 'zonas' && (
            <>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
                <Dato c={c} valor={semana.veces} texto="rutinas esta semana" />
                <Dato c={c} valor={semana.minutos} texto="minutos esta semana" />
              </View>
              <Musica c={c} titulo="Música para entrenar" />
            </>
          )}
          {error && vista === 'zonas' && (
            <Text style={{ color: c.warning, fontSize: 13, marginBottom: 12 }}>
              Aún no puedo guardar tus rutinas: no pude leer tu historial de ejercicio.
            </Text>
          )}

          {!zona && vista === 'programas' && (
            <ProgramasEjercicio
              abiertoId={programaAbierto}
              alAbrir={setProgramaAbierto}
              alHacerRutina={hacerRutinaDePrograma}
            />
          )}

          {vista === 'programas' && !zona ? null : !zona ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {ZONAS.map((z) => (
                <Pressable key={z.id} onPress={() => setZona(z)} accessibilityRole="button" accessibilityLabel={z.nombre}
                  style={({ pressed }) => ({ width: '48%', flexGrow: 1, backgroundColor: c.surface, borderRadius: 22,
                    borderWidth: 1, borderColor: c.border, opacity: pressed ? 0.85 : 1, overflow: 'hidden' })}>
                  <Image source={z.foto} resizeMode="cover" style={{ width: '100%', height: 108 }} />
                  <View style={{ padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: z.color }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: c.foreground, fontSize: 16.5, fontWeight: '700' }}>{z.nombre}</Text>
                      <Text style={{ color: c.muted, fontSize: 12.5 }}>{z.rutinas.length} rutinas</Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {zona.rutinas.map((r) => (
                <Pressable key={r.id} onPress={() => setEnCurso({ rutina: r, zona })} accessibilityRole="button"
                  style={({ pressed }) => ({ backgroundColor: c.surface, borderRadius: 22, padding: 18, borderWidth: 1, borderColor: c.border, opacity: pressed ? 0.85 : 1 })}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                    <Text style={{ color: c.foreground, fontSize: 18, fontWeight: '700', flex: 1 }}>{r.nombre}</Text>
                    <View style={{ borderRadius: 999, borderWidth: 1, borderColor: zona.color, paddingHorizontal: 10, paddingVertical: 3 }}>
                      <Text style={{ color: zona.color, fontSize: 12, fontWeight: '800' }}>{r.nivel} · {r.minutos} min</Text>
                    </View>
                  </View>
                  <Text style={{ color: c.muted, fontSize: 13.5, marginTop: 8, lineHeight: 19 }}>{r.ejercicios.map((e) => e.nombre).join(' · ')}</Text>
                </Pressable>
              ))}
              <Pressable onPress={() => setZona(null)} accessibilityRole="button" style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center' }}>
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

function CabeceraZona({ c, zona, alVolver }: { c: C; zona: Zona; alVolver: () => void }) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Pressable onPress={alVolver} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' }}>
        <Text style={{ color: c.primary, fontWeight: '700' }}>← Todas las zonas</Text>
      </Pressable>
      <View style={{ marginTop: 4 }}>
        <Image source={zona.foto} resizeMode="cover" style={{ width: '100%', height: 170, borderRadius: 22 }} />
        <Sticker texto={`${zona.rutinas.length} rutinas`} color={zona.color} giro={-5} style={{ position: 'absolute', bottom: -12, left: 16 }} />
      </View>
      <Titulo color={c.foreground} style={{ marginTop: 18 }}>{zona.nombre}</Titulo>
      <Text style={{ color: c.muted, fontSize: 14, marginTop: 6 }}>Elige una rutina y te guío ejercicio por ejercicio.</Text>
    </View>
  );
}

function Dato({ c, valor, texto }: { c: C; valor: number; texto: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: c.surface, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: c.border }}>
      <Text style={{ color: c.foreground, fontSize: 26, fontWeight: '800' }}>{valor}</Text>
      <Text style={{ color: c.muted, fontSize: 12.5 }}>{texto}</Text>
    </View>
  );
}

// ---------- música: búsquedas en Spotify o YouTube Music ----------
function Musica({ c, titulo, zonaId }: { c: C; titulo: string; zonaId?: string }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ color: c.foreground, fontSize: 16, fontWeight: '800', marginBottom: 10 }}>{titulo}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 20 }}>
        {listasPara(zonaId).map((l) => (
          <View key={l.busqueda} style={{ width: 176, backgroundColor: c.surface, borderRadius: 18, borderWidth: 1, borderColor: c.border, padding: 12, gap: 10 }}>
            <View>
              <Text style={{ color: c.foreground, fontWeight: '800', fontSize: 15 }}>{l.nombre}</Text>
              <Text style={{ color: c.muted, fontSize: 12 }} numberOfLines={1}>{l.busqueda}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <BotonChico c={c} texto="Spotify" onPress={() => abrir(urlSpotify(l))} etiqueta={`${l.nombre} en Spotify`} />
              <BotonChico c={c} texto="YouTube" onPress={() => abrir(urlYoutubeMusic(l))} etiqueta={`${l.nombre} en YouTube Music`} />
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function BotonChico({ c, texto, onPress, etiqueta }: { c: C; texto: string; onPress: () => void; etiqueta?: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="link" accessibilityLabel={etiqueta ?? texto}
      style={({ pressed }) => ({ flex: 1, minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: c.border,
        alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}>
      <Text style={{ color: c.foreground, fontWeight: '700', fontSize: 13 }}>{texto}</Text>
    </Pressable>
  );
}

// ---------- rutina paso a paso ----------
function Reproductor({ rutina, zona, volverA, alSalir, alTerminar }: {
  rutina: Rutina; zona: Zona; volverA: string; alSalir: () => void; alTerminar?: () => void;
}) {
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
    // El día del programa se marca aparte: si falla el historial, el día igual cuenta.
    alTerminar?.();
  }

  const empezar = () => { if (e.segundos) { setCuenta(e.segundos); setModo('trabajo') } else terminarSerie() };
  const progreso = (i + (serie - 1) / e.series) / rutina.ejercicios.length;

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ paddingBottom: 150 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 24, maxWidth: 640, width: '100%', alignSelf: 'center' }}>
          <Pressable onPress={alSalir} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' }}>
            <Text style={{ color: c.primary, fontWeight: '700' }}>← {volverA}</Text>
          </Pressable>
          <View style={{ marginTop: 4 }}>
            <Image source={zona.foto} resizeMode="cover" style={{ width: '100%', height: 160, borderRadius: 22 }} />
            <Sticker texto={`${rutina.nivel} · ${rutina.minutos} min`} color={zona.color} giro={4} style={{ position: 'absolute', bottom: -12, right: 16 }} />
          </View>
          <Titulo size={28} color={c.foreground} style={{ marginTop: 18 }}>{rutina.nombre}</Titulo>
          <View style={{ height: 6, backgroundColor: c.border, borderRadius: 6, marginVertical: 16, overflow: 'hidden' }}>
            <View style={{ width: `${(modo === 'fin' ? 1 : progreso) * 100}%`, height: '100%', backgroundColor: zona.color }} />
          </View>

          {modo === 'fin' ? (
            <View style={{ backgroundColor: c.surface, borderRadius: 26, padding: 24, borderWidth: 1, borderColor: c.border, alignItems: 'center' }}>
              <Text style={{ color: c.foreground, fontSize: 24, fontWeight: '800', marginBottom: 6 }}>¡Rutina completa!</Text>
              <Text style={{ color: c.muted, textAlign: 'center', marginBottom: 18 }}>
                {guardar.isSuccess
                  ? alTerminar ? 'Quedó guardada en tu semana y el día está marcado.' : 'Quedó guardada en tu semana.'
                  : guardar.isPending ? 'Guardando…' : 'Bien hecho. Toma agua y respira.'}
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
              <View style={{ gap: 10 }}>
                {modo === 'listo' && <Boton c={c} texto={e.reps ? 'Hecha esta serie' : 'Empezar'} onPress={empezar} />}
                {modo === 'trabajo' && <Boton c={c} texto="Terminar antes" onPress={() => setCuenta(0)} sec />}
                {modo === 'descanso' && <Boton c={c} texto="Saltar descanso" onPress={() => setCuenta(0)} sec />}
                {/* Búsqueda y no un video fijo: un ID de YouTube se rompe el día que lo borran. */}
                <Boton c={c} texto="▶ Ver cómo se hace" onPress={() => abrir(urlComoSeHace(e))} sec />
              </View>
            </View>
          )}

          {modo !== 'fin' && (
            <View style={{ marginTop: 22 }}>
              <Musica c={c} titulo="Música para esta rutina" zonaId={zona.id} />
            </View>
          )}

          {modo !== 'fin' && (
            <View style={{ gap: 8 }}>
              {rutina.ejercicios.map((x, k) => (
                <View key={x.nombre} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.border, opacity: k < i ? 0.45 : 1 }}>
                  <Text style={{ color: k === i ? c.foreground : c.muted, fontWeight: k === i ? '700' : '400', flex: 1 }}>{k < i ? '✓ ' : ''}{x.nombre}</Text>
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

function Boton({ c, texto, onPress, sec }: { c: C; texto: string; onPress: () => void; sec?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button"
      style={({ pressed }) => ({ minHeight: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22,
        backgroundColor: sec ? 'transparent' : c.primary, borderWidth: sec ? 1.5 : 0, borderColor: c.border, opacity: pressed ? 0.85 : 1 })}>
      <Text style={{ color: sec ? c.foreground : c.background, fontWeight: '800', fontSize: 16 }}>{texto}</Text>
    </Pressable>
  );
}
