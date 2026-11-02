import React, { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useColors } from '@/hooks/use-colors';
import { Sticker, Titulo, TINTA, acentoTexto, RADIO } from '@/components/decor';
import { ZONAS, buscarRutina } from '@/constants/ejercicios';
import { RETOS, type Reto } from '@/constants/retos';
import {
  useBorrarPrograma,
  useDiasHechos,
  useGuardarPrograma,
  useMarcarDia,
  useProgramas,
  type DiaPrograma,
  type Programa,
} from '@/hooks/use-programas';
import { ACENTOS } from '@/constants/tabs';

/**
 * Programas guiados: un plan de varios días con el video de cada día.
 *
 * Los enlaces los pone ella. No vienen escritos en el código a propósito:
 * un identificador de YouTube metido a mano se rompe el día que borran el
 * video, y entonces la app enseña un reproductor en blanco sin decir por
 * qué. Así sirve para Chloe Ting, para Daisy o para cualquier otra.
 *
 * El video se abre con el navegador EN la app (`openBrowserAsync`) y no
 * con un reproductor incrustado: YouTube bloquea el incrustado de
 * muchísimos videos, y un reproductor que falla en la mitad de los casos
 * es peor que un enlace que funciona siempre.
 */

/** Qué día de qué programa se está haciendo, para marcarlo al terminar la rutina. */
export type MarcaDia = { programId: string; dia: number; yaHecho: boolean };

// El acento de Ejercicio (coral) con texto oscuro encima
const ACENTO = ACENTOS.ejercicio;
const SOBRE = TINTA.sobreAcento;

const zonaDe = (id: string) => ZONAS.find((z) => z.id === id) ?? ZONAS[0];
/** El programa guardado de un reto, si ya lo empezó. Se reconoce por autor y nombre. */
const programaDelReto = (programas: Programa[], r: Reto) =>
  programas.find((p) => p.author === 'LifeOS' && p.name === r.nombre);

export function ProgramasEjercicio({
  abiertoId,
  alAbrir,
  alHacerRutina,
}: {
  /** El programa abierto vive en la pantalla: así sigue abierto al volver del reproductor. */
  abiertoId: string | null;
  alAbrir: (id: string | null) => void;
  alHacerRutina: (rutinaId: string, marca: MarcaDia) => void;
}) {
  const c = useColors();
  const { data: programas = [], isLoading, error } = useProgramas();
  const { data: hechos = [] } = useDiasHechos();
  const [editando, setEditando] = useState<Programa | 'nuevo' | null>(null);
  const [reto, setReto] = useState<Reto | null>(null);

  if (editando) {
    return (
      <Editor
        programa={editando === 'nuevo' ? null : editando}
        alSalir={() => setEditando(null)}
      />
    );
  }

  if (reto) {
    return (
      <VistaReto
        reto={reto}
        existente={programaDelReto(programas, reto)}
        alSalir={() => setReto(null)}
        alAbrir={(id) => { setReto(null); alAbrir(id); }}
      />
    );
  }

  const abierto = abiertoId ? programas.find((p) => p.id === abiertoId) : null;
  if (abierto) {
    return (
      <Dias
        programa={abierto}
        hechos={hechos.filter((h) => h.program_id === abierto.id).map((h) => h.day)}
        alSalir={() => alAbrir(null)}
        alEditar={() => { alAbrir(null); setEditando(abierto); }}
        alHacerRutina={alHacerRutina}
      />
    );
  }

  const hechosDe = (id: string) => hechos.filter((h) => h.program_id === id).length;

  return (
    <View style={{ gap: 12 }}>
      {error && (
        <Aviso c={c}>
          No pude cargar tus programas. Revisa la conexión y vuelve a entrar.
          Si la base de datos es nueva, las tablas están en
          supabase/programas-ejercicio.sql.
        </Aviso>
      )}

      {/* ---------- retos de 21 días ---------- */}
      <Titulo size={22} color={c.foreground}>Retos de 21 días</Titulo>
      <Text style={{ color: c.muted, fontSize: 13.5, marginTop: -6 }}>
        Elige uno y te lo paso a tu plan. Tú vas contando los días.
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingTop: 12, paddingBottom: 4, paddingRight: 20 }}
      >
        {RETOS.map((r) => {
          const z = zonaDe(r.zona);
          const guardado = programaDelReto(programas, r);
          return (
            <Pressable
              key={r.id}
              onPress={() => setReto(r)}
              accessibilityRole="button"
              accessibilityLabel={r.nombre}
              style={({ pressed }) => ({
                width: 236, backgroundColor: c.surface, borderRadius: 24,
                borderWidth: 1, borderColor: c.border, opacity: pressed ? 0.85 : 1,
              })}
            >
              <Image
                source={z.foto}
                resizeMode="cover"
                style={{ width: '100%', height: 118, borderTopLeftRadius: 23, borderTopRightRadius: 23 }}
              />
              <Sticker texto="21 días" color={z.color} giro={5} style={{ position: 'absolute', top: -10, right: 12 }} />
              <View style={{ padding: 14, gap: 4 }}>
                <Titulo size={20} color={c.foreground}>{r.nombre}</Titulo>
                <Text style={{ color: c.muted, fontSize: 13, lineHeight: 18 }} numberOfLines={3}>{r.para}</Text>
                {guardado && (
                  <Text style={{ color: acentoTexto(z.color), fontSize: 12.5, fontWeight: '700', marginTop: 4 }}>
                    En tu plan · {hechosDe(guardado.id)} de 21 días
                  </Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ---------- los programas guardados ---------- */}
      <Titulo size={22} color={c.foreground} style={{ marginTop: 14 }}>Tus programas</Titulo>

      <Pressable
        onPress={() => setEditando('nuevo')}
        accessibilityRole="button"
        style={({ pressed }) => ({
          borderRadius: 24, borderWidth: 1, borderStyle: 'dashed', borderColor: c.border,
          minHeight: 52, justifyContent: 'center', alignItems: 'center', opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text style={{ color: acentoTexto(ACENTO), fontWeight: '700' }}>+ Nuevo programa</Text>
      </Pressable>

      {isLoading && <Text style={{ color: c.muted, fontSize: 13 }}>Cargando…</Text>}

      {!isLoading && !error && programas.length === 0 && (
        <Aviso c={c}>
          Aquí van los retos que elijas y los planes que sigues de alguien más:
          pones el nombre, de quién es, y el enlace del video de cada día. La
          app te lleva la cuenta de por dónde vas.
        </Aviso>
      )}

      {programas.map((p) => {
        const hechosDeEste = hechosDe(p.id);
        const total = p.days.length || 1;
        return (
          <Pressable
            key={p.id}
            onPress={() => alAbrir(p.id)}
            accessibilityRole="button"
            style={({ pressed }) => ({
              backgroundColor: c.surface, borderRadius: 24, padding: 18,
              borderWidth: 1, borderColor: c.border, opacity: pressed ? 0.85 : 1,
            })}
          >
            <Titulo size={20} color={c.foreground}>{p.name}</Titulo>
            {!!p.author && (
              <Text style={{ color: c.muted, fontSize: 13, marginTop: 2 }}>de {p.author}</Text>
            )}
            <View style={{ height: 6, backgroundColor: c.border, borderRadius: 6, marginTop: 12, overflow: 'hidden' }}>
              <View style={{ width: `${Math.round((hechosDeEste / total) * 100)}%`, height: '100%', backgroundColor: ACENTO }} />
            </View>
            <Text style={{ color: c.muted, fontSize: 12.5, marginTop: 6 }}>
              {hechosDeEste} de {p.days.length} días
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------- un reto antes de empezarlo ----------

function VistaReto({
  reto,
  existente,
  alSalir,
  alAbrir,
}: {
  reto: Reto;
  existente?: Programa;
  alSalir: () => void;
  alAbrir: (id: string) => void;
}) {
  const c = useColors();
  const guardar = useGuardarPrograma();
  const z = zonaDe(reto.zona);
  const entrenos = reto.dias.filter((d) => !d.descanso).length;

  const empezar = () => {
    if (existente) return alAbrir(existente.id);
    guardar.mutate(
      { name: reto.nombre, author: 'LifeOS', days: reto.dias },
      {
        onSuccess: (id) => alAbrir(id),
        onError: (e) => Alert.alert('No se guardó el reto', (e as Error).message),
      },
    );
  };

  return (
    <View style={{ gap: 12 }}>
      <Atras c={c} texto="← Programas" onPress={alSalir} />
      <View>
        <Image source={z.foto} resizeMode="cover" style={{ width: '100%', height: 190, borderRadius: 26 }} />
        <Sticker texto="21 días" color={z.color} giro={-5} style={{ position: 'absolute', bottom: -12, right: 16 }} />
      </View>
      <Titulo size={28} color={c.foreground} style={{ marginTop: 8 }}>{reto.nombre}</Titulo>
      <Text style={{ color: c.foreground, fontSize: 15, lineHeight: 21 }}>{reto.para}</Text>
      <Text style={{ color: c.muted, fontSize: 13.5, lineHeight: 19 }}>
        {entrenos} días de rutina y {reto.dias.length - entrenos} de descanso activo. Empieza
        suave para aprender la técnica y termina con la rutina completa.
      </Text>

      {[0, 1, 2].map((s) => (
        <View key={s} style={{ backgroundColor: c.surface, borderRadius: RADIO.tarjeta, padding: 16, borderWidth: 1, borderColor: c.border, gap: 4 }}>
          <Titulo size={20} color={c.foreground} style={{ marginBottom: 4 }}>Semana {s + 1}</Titulo>
          {reto.dias.slice(s * 7, s * 7 + 7).map((d) => (
            <Text key={d.dia} style={{ color: d.descanso ? c.muted : c.foreground, fontSize: 13.5 }}>
              Día {d.dia} · {d.titulo}
            </Text>
          ))}
        </View>
      ))}

      {guardar.isError && (
        <Text style={{ color: c.warning, fontSize: 13 }}>
          No se guardó: {(guardar.error as Error).message}
        </Text>
      )}
      <BotonLleno
        c={c}
        texto={existente ? 'Seguir con el reto' : guardar.isPending ? 'Guardando…' : 'Empezar el reto'}
        onPress={empezar}
        deshabilitado={guardar.isPending}
      />
    </View>
  );
}

// ---------- los días de un programa ----------

function Dias({
  programa,
  hechos,
  alSalir,
  alEditar,
  alHacerRutina,
}: {
  programa: Programa;
  hechos: number[];
  alSalir: () => void;
  alEditar: () => void;
  alHacerRutina: (rutinaId: string, marca: MarcaDia) => void;
}) {
  const c = useColors();
  const marcar = useMarcarDia();
  const total = programa.days.length;
  const hechosN = programa.days.filter((d) => hechos.includes(d.dia)).length;
  // El día que toca es el primero sin marcar: si se salta uno, no se pierde.
  const siguiente = programa.days.find((d) => !hechos.includes(d.dia));

  const abrirVideo = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      Alert.alert('No pude abrirlo', 'Revisa que el enlace esté bien escrito.');
    }
  };

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Atras c={c} texto="← Programas" onPress={alSalir} />
        <Pressable onPress={alEditar} accessibilityRole="button" style={{ minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'flex-end' }}>
          <Text style={{ color: c.muted, fontWeight: '600' }}>Editar</Text>
        </Pressable>
      </View>

      <Titulo size={28} color={c.foreground}>{programa.name}</Titulo>

      {total > 0 && (
        <View style={{ backgroundColor: c.surface, borderRadius: RADIO.tarjeta, padding: 18, borderWidth: 1, borderColor: c.border, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <Titulo size={22} color={c.foreground}>
              {siguiente ? `Día ${siguiente.dia} de ${total}` : '¡Terminado!'}
            </Titulo>
            <Text style={{ color: c.muted, fontSize: 13 }}>{hechosN} hechos</Text>
          </View>
          {/* Una casilla por día, siete por fila: se ve de un vistazo lo hecho y lo que falta. */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }} accessibilityLabel={`${hechosN} de ${total} días hechos`}>
            {programa.days.map((d) => {
              const hecho = hechos.includes(d.dia);
              const hoy = siguiente?.dia === d.dia;
              return (
                <View
                  key={d.dia}
                  style={{
                    width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: hecho ? ACENTO : 'transparent',
                    borderWidth: hoy ? 2 : 1, borderColor: hecho || hoy ? ACENTO : c.border,
                    borderStyle: d.descanso && !hecho ? 'dashed' : 'solid',
                  }}
                >
                  <Text style={{ color: hecho ? SOBRE : hoy ? c.foreground : c.muted, fontSize: 12.5, fontWeight: '700' }}>
                    {hecho ? '✓' : d.dia}
                  </Text>
                </View>
              );
            })}
          </View>
          {programa.days.some((d) => d.descanso) && (
            <Text style={{ color: c.muted, fontSize: 12.5 }}>Las casillas punteadas son descanso activo.</Text>
          )}
        </View>
      )}
      {!!programa.source_url && (
        <Pressable onPress={() => abrirVideo(programa.source_url!)} accessibilityRole="link" style={{ minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' }}>
          <Text style={{ color: acentoTexto(ACENTO), fontSize: 14, fontWeight: '700' }}>Ver el programa completo</Text>
        </Pressable>
      )}

      {programa.days.length === 0 && (
        <Aviso c={c}>Este programa todavía no tiene días. Pulsa «Editar» y añádelos.</Aviso>
      )}

      {programa.days.map((d) => {
        const hecho = hechos.includes(d.dia);
        const r = buscarRutina(d.rutina);
        const hoy = siguiente?.dia === d.dia;
        return (
          <View
            key={d.dia}
            style={{
              backgroundColor: c.surface, borderRadius: 24, padding: 16,
              borderWidth: 1, borderColor: hecho || hoy ? ACENTO : c.border,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Pressable
                onPress={() => marcar.mutate({ programId: programa.id, dia: d.dia, hecho })}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: hecho }}
                hitSlop={10}
                style={{
                  width: 26, height: 26, borderRadius: 9, borderWidth: 1.6,
                  borderColor: hecho ? ACENTO : c.border,
                  backgroundColor: hecho ? ACENTO : 'transparent',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                {hecho && <Text style={{ color: SOBRE, fontWeight: '800', fontSize: 14 }}>✓</Text>}
              </Pressable>

              <View style={{ flex: 1 }}>
                <Text style={{ color: c.muted, fontSize: 12.5, fontWeight: '700' }}>
                  Día {d.dia}{hoy ? ' · te toca hoy' : ''}
                </Text>
                <Text
                  style={{
                    color: c.foreground, fontSize: 16, fontWeight: '700',
                    textDecorationLine: hecho ? 'line-through' : 'none',
                  }}
                >
                  {d.titulo || (d.descanso ? 'Descanso' : `Día ${d.dia}`)}
                </Text>
              </View>
            </View>

            {!!d.notas && (
              <Text style={{ color: c.muted, fontSize: 13, marginTop: 8 }}>{d.notas}</Text>
            )}

            {r && (
              <Text style={{ color: c.muted, fontSize: 12.5, marginTop: 8 }}>
                {r.rutina.nombre} · {r.zona.nombre} · {r.rutina.minutos} min
              </Text>
            )}

            {r ? (
              <Pressable
                onPress={() => alHacerRutina(r.rutina.id, { programId: programa.id, dia: d.dia, yaHecho: hecho })}
                accessibilityRole="button"
                style={({ pressed }) => ({
                  marginTop: 12, borderRadius: 23, minHeight: 46, justifyContent: 'center',
                  backgroundColor: hoy ? ACENTO : 'transparent', borderWidth: hoy ? 0 : 1.5, borderColor: c.border,
                  alignItems: 'center', opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text style={{ color: hoy ? SOBRE : c.foreground, fontWeight: '800' }}>
                  {hecho ? 'Repetir la rutina' : 'Hacer la rutina'}
                </Text>
              </Pressable>
            ) : d.video ? (
              <Pressable
                onPress={() => abrirVideo(d.video!)}
                accessibilityRole="button"
                style={({ pressed }) => ({
                  marginTop: 12, borderRadius: 23, minHeight: 46, justifyContent: 'center',
                  backgroundColor: ACENTO, alignItems: 'center', opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text style={{ color: SOBRE, fontWeight: '800' }}>Ver el video</Text>
              </Pressable>
            ) : (
              !d.descanso && (
                <Text style={{ color: c.muted, fontSize: 12.5, marginTop: 10 }}>
                  Sin enlace todavía.
                </Text>
              )
            )}
          </View>
        );
      })}
    </View>
  );
}

// ---------- crear o editar ----------

function Editor({ programa, alSalir }: { programa: Programa | null; alSalir: () => void }) {
  const c = useColors();
  const guardar = useGuardarPrograma();
  const borrar = useBorrarPrograma();

  const [nombre, setNombre] = useState(programa?.name ?? '');
  const [autor, setAutor] = useState(programa?.author ?? '');
  const [fuente, setFuente] = useState(programa?.source_url ?? '');
  const [dias, setDias] = useState<DiaPrograma[]>(programa?.days ?? []);

  const cambiar = (i: number, campo: keyof DiaPrograma, valor: string | boolean) =>
    setDias((d) => d.map((x, j) => (j === i ? { ...x, [campo]: valor } : x)));

  const añadir = () =>
    setDias((d) => [...d, { dia: d.length + 1, titulo: '', video: '' }]);

  const quitar = (i: number) =>
    // Se renumeran los que quedan: sin esto, borrar el día 2 dejaba
    // 1, 3, 4 y el progreso apuntaba a días que ya no existen.
    setDias((d) => d.filter((_, j) => j !== i).map((x, j) => ({ ...x, dia: j + 1 })));

  const puedeGuardar = nombre.trim().length > 0 && !guardar.isPending;

  return (
    <View style={{ gap: 12 }}>
      <Atras c={c} texto="← Cancelar" onPress={alSalir} />

      <Titulo size={28} color={c.foreground}>
        {programa ? 'Editar programa' : 'Nuevo programa'}
      </Titulo>

      <Campo c={c} etiqueta="Nombre" valor={nombre} alCambiar={setNombre} ejemplo="2 Week Shred" />
      <Campo c={c} etiqueta="De quién es" valor={autor} alCambiar={setAutor} ejemplo="Chloe Ting" />
      <Campo
        c={c}
        etiqueta="Enlace del programa"
        valor={fuente}
        alCambiar={setFuente}
        ejemplo="https://…"
      />

      <Titulo size={22} color={c.foreground} style={{ marginTop: 8 }}>
        Los días
      </Titulo>

      {dias.map((d, i) => (
        <View
          key={i}
          style={{ backgroundColor: c.surface, borderRadius: RADIO.tarjeta, padding: 16, borderWidth: 1, borderColor: c.border, gap: 8 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: c.muted, fontSize: 12.5, fontWeight: '700' }}>
              Día {d.dia}
            </Text>
            <Pressable onPress={() => quitar(i)} accessibilityRole="button" style={{ minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'flex-end' }}>
              <Text style={{ color: c.muted, fontSize: 14, fontWeight: '600' }}>Quitar</Text>
            </Pressable>
          </View>
          <Campo c={c} valor={d.titulo} alCambiar={(v) => cambiar(i, 'titulo', v)} ejemplo="Abs + cardio" />
          <Campo c={c} valor={d.video ?? ''} alCambiar={(v) => cambiar(i, 'video', v)} ejemplo="Enlace del video" />
          <Pressable
            onPress={() => cambiar(i, 'descanso', !d.descanso)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: !!d.descanso }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 }}
          >
            <View
              style={{
                width: 24, height: 24, borderRadius: 8, borderWidth: 1.6,
                borderColor: d.descanso ? ACENTO : c.border,
                backgroundColor: d.descanso ? ACENTO : 'transparent',
              }}
            />
            <Text style={{ color: c.foreground, fontSize: 14 }}>Día de descanso</Text>
          </Pressable>
        </View>
      ))}

      <Pressable
        onPress={añadir}
        style={({ pressed }) => ({
          borderRadius: 24, borderWidth: 1, borderStyle: 'dashed', borderColor: c.border,
          minHeight: 52, justifyContent: 'center', alignItems: 'center', opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text style={{ color: acentoTexto(ACENTO), fontWeight: '700' }}>+ Añadir día</Text>
      </Pressable>

      <Pressable
        disabled={!puedeGuardar}
        onPress={() =>
          guardar.mutate(
            { id: programa?.id, name: nombre, author: autor, source_url: fuente, days: dias },
            {
              onSuccess: alSalir,
              onError: (e) => Alert.alert('No se guardó', (e as Error).message),
            },
          )
        }
        style={({ pressed }) => ({
          borderRadius: 26, minHeight: 52, justifyContent: 'center', alignItems: 'center',
          backgroundColor: ACENTO, opacity: !puedeGuardar ? 0.5 : pressed ? 0.85 : 1,
        })}
      >
        <Text style={{ color: SOBRE, fontWeight: '800' }}>
          {guardar.isPending ? 'Guardando…' : 'Guardar'}
        </Text>
      </Pressable>

      {programa && (
        <Pressable
          onPress={() =>
            Alert.alert('¿Borrar el programa?', 'Se van también los días marcados.', [
              { text: 'No', style: 'cancel' },
              {
                text: 'Borrar',
                style: 'destructive',
                onPress: () => borrar.mutate(programa.id, { onSuccess: alSalir }),
              },
            ])
          }
          style={{ minHeight: 44, justifyContent: 'center', alignItems: 'center' }}
        >
          <Text style={{ color: c.muted, fontSize: 14 }}>Borrar este programa</Text>
        </Pressable>
      )}
    </View>
  );
}

// ---------- piezas ----------

function Campo({
  c,
  etiqueta,
  valor,
  alCambiar,
  ejemplo,
}: {
  c: ReturnType<typeof useColors>;
  etiqueta?: string;
  valor: string;
  alCambiar: (v: string) => void;
  ejemplo?: string;
}) {
  return (
    <View style={{ gap: 4 }}>
      {!!etiqueta && (
        <Text style={{ color: c.muted, fontSize: 13, fontWeight: '600' }}>{etiqueta}</Text>
      )}
      <TextInput
        value={valor}
        onChangeText={alCambiar}
        placeholder={ejemplo}
        placeholderTextColor={c.muted}
        autoCapitalize="none"
        style={{
          backgroundColor: c.background, borderRadius: 16, borderWidth: 1, borderColor: c.border,
          paddingHorizontal: 14, minHeight: 48, color: c.foreground, fontSize: 15,
        }}
      />
    </View>
  );
}

function Atras({ c, texto, onPress }: { c: ReturnType<typeof useColors>; texto: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' }}>
      <Text style={{ color: acentoTexto(ACENTO), fontWeight: '700' }}>{texto}</Text>
    </Pressable>
  );
}

function BotonLleno({ c, texto, onPress, deshabilitado }: {
  c: ReturnType<typeof useColors>; texto: string; onPress: () => void; deshabilitado?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado}
      accessibilityRole="button"
      style={({ pressed }) => ({
        minHeight: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22,
        backgroundColor: ACENTO, opacity: deshabilitado ? 0.5 : pressed ? 0.85 : 1,
      })}
    >
      <Text style={{ color: SOBRE, fontWeight: '800', fontSize: 16 }}>{texto}</Text>
    </Pressable>
  );
}

function Aviso({ c, children }: { c: ReturnType<typeof useColors>; children: React.ReactNode }) {
  return (
    <View style={{ borderRadius: 24, borderWidth: 1, borderStyle: 'dashed', borderColor: c.border, padding: 18 }}>
      <Text style={{ color: c.muted, fontSize: 13.5, lineHeight: 20 }}>{children}</Text>
    </View>
  );
}
