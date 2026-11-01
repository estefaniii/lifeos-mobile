import React, { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useColors } from '@/hooks/use-colors';
import {
  useBorrarPrograma,
  useDiasHechos,
  useGuardarPrograma,
  useMarcarDia,
  useProgramas,
  type DiaPrograma,
  type Programa,
} from '@/hooks/use-programas';

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

export function ProgramasEjercicio() {
  const c = useColors();
  const { data: programas = [], isLoading, error } = useProgramas();
  const { data: hechos = [] } = useDiasHechos();
  const [abierto, setAbierto] = useState<Programa | null>(null);
  const [editando, setEditando] = useState<Programa | 'nuevo' | null>(null);

  if (editando) {
    return (
      <Editor
        programa={editando === 'nuevo' ? null : editando}
        alSalir={() => setEditando(null)}
      />
    );
  }

  if (abierto) {
    const vivo = programas.find((p) => p.id === abierto.id) ?? abierto;
    return (
      <Dias
        programa={vivo}
        hechos={hechos.filter((h) => h.program_id === vivo.id).map((h) => h.day)}
        alSalir={() => setAbierto(null)}
        alEditar={() => { setAbierto(null); setEditando(vivo); }}
      />
    );
  }

  if (error) {
    return (
      <Aviso c={c}>
        Aún no puedo guardar programas: falta crear las tablas en la base de
        datos. Está el archivo supabase/programas-ejercicio.sql listo para
        pegar en Supabase.
      </Aviso>
    );
  }

  return (
    <View style={{ gap: 12 }}>
      <Pressable
        onPress={() => setEditando('nuevo')}
        accessibilityRole="button"
        style={({ pressed }) => ({
          borderRadius: 18, borderWidth: 1, borderStyle: 'dashed', borderColor: c.border,
          paddingVertical: 14, alignItems: 'center', opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text style={{ color: c.primary, fontWeight: '700' }}>+ Nuevo programa</Text>
      </Pressable>

      {isLoading && <Text style={{ color: c.muted, fontSize: 13 }}>Cargando…</Text>}

      {!isLoading && programas.length === 0 && (
        <Aviso c={c}>
          Aquí van los planes que sigues de alguien más: pones el nombre, de
          quién es, y el enlace del video de cada día. La app te lleva la
          cuenta de por dónde vas.
        </Aviso>
      )}

      {programas.map((p) => {
        const hechosDeEste = hechos.filter((h) => h.program_id === p.id).length;
        const total = p.days.length || 1;
        return (
          <Pressable
            key={p.id}
            onPress={() => setAbierto(p)}
            accessibilityRole="button"
            style={({ pressed }) => ({
              backgroundColor: c.surface, borderRadius: 22, padding: 18,
              borderWidth: 1, borderColor: c.border, opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ color: c.foreground, fontSize: 18, fontWeight: '700' }}>{p.name}</Text>
            {!!p.author && (
              <Text style={{ color: c.muted, fontSize: 13 }}>de {p.author}</Text>
            )}
            <View style={{ height: 6, backgroundColor: c.border, borderRadius: 6, marginTop: 12, overflow: 'hidden' }}>
              <View style={{ width: `${Math.round((hechosDeEste / total) * 100)}%`, height: '100%', backgroundColor: c.primary }} />
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

// ---------- los días de un programa ----------

function Dias({
  programa,
  hechos,
  alSalir,
  alEditar,
}: {
  programa: Programa;
  hechos: number[];
  alSalir: () => void;
  alEditar: () => void;
}) {
  const c = useColors();
  const marcar = useMarcarDia();

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
        <Pressable onPress={alSalir} style={{ paddingVertical: 8 }}>
          <Text style={{ color: c.primary, fontWeight: '700' }}>← Programas</Text>
        </Pressable>
        <Pressable onPress={alEditar} style={{ paddingVertical: 8 }}>
          <Text style={{ color: c.muted, fontWeight: '600' }}>Editar</Text>
        </Pressable>
      </View>

      <Text style={{ color: c.foreground, fontSize: 24, fontWeight: '800' }}>{programa.name}</Text>
      {!!programa.source_url && (
        <Pressable onPress={() => abrirVideo(programa.source_url!)}>
          <Text style={{ color: c.primary, fontSize: 13 }}>Ver el programa completo</Text>
        </Pressable>
      )}

      {programa.days.length === 0 && (
        <Aviso c={c}>Este programa todavía no tiene días. Pulsa «Editar» y añádelos.</Aviso>
      )}

      {programa.days.map((d) => {
        const hecho = hechos.includes(d.dia);
        return (
          <View
            key={d.dia}
            style={{
              backgroundColor: c.surface, borderRadius: 20, padding: 16,
              borderWidth: 1, borderColor: hecho ? c.primary : c.border,
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
                  borderColor: hecho ? c.primary : c.border,
                  backgroundColor: hecho ? c.primary : 'transparent',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                {hecho && <Text style={{ color: c.background, fontWeight: '800', fontSize: 14 }}>✓</Text>}
              </Pressable>

              <View style={{ flex: 1 }}>
                <Text style={{ color: c.muted, fontSize: 11.5, fontWeight: '700', letterSpacing: 1 }}>
                  DÍA {d.dia}
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

            {d.video ? (
              <Pressable
                onPress={() => abrirVideo(d.video!)}
                accessibilityRole="button"
                style={({ pressed }) => ({
                  marginTop: 12, borderRadius: 14, paddingVertical: 11,
                  backgroundColor: c.primary, alignItems: 'center', opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text style={{ color: c.background, fontWeight: '800' }}>Ver el video</Text>
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
      <Pressable onPress={alSalir} style={{ paddingVertical: 8 }}>
        <Text style={{ color: c.primary, fontWeight: '700' }}>← Cancelar</Text>
      </Pressable>

      <Text style={{ color: c.foreground, fontSize: 24, fontWeight: '800' }}>
        {programa ? 'Editar programa' : 'Nuevo programa'}
      </Text>

      <Campo c={c} etiqueta="Nombre" valor={nombre} alCambiar={setNombre} ejemplo="2 Week Shred" />
      <Campo c={c} etiqueta="De quién es" valor={autor} alCambiar={setAutor} ejemplo="Chloe Ting" />
      <Campo
        c={c}
        etiqueta="Enlace del programa"
        valor={fuente}
        alCambiar={setFuente}
        ejemplo="https://…"
      />

      <Text style={{ color: c.foreground, fontSize: 17, fontWeight: '700', marginTop: 8 }}>
        Los días
      </Text>

      {dias.map((d, i) => (
        <View
          key={i}
          style={{ backgroundColor: c.surface, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: c.border, gap: 8 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: c.muted, fontSize: 11.5, fontWeight: '700', letterSpacing: 1 }}>
              DÍA {d.dia}
            </Text>
            <Pressable onPress={() => quitar(i)} hitSlop={10}>
              <Text style={{ color: c.muted, fontSize: 13 }}>Quitar</Text>
            </Pressable>
          </View>
          <Campo c={c} valor={d.titulo} alCambiar={(v) => cambiar(i, 'titulo', v)} ejemplo="Abs + cardio" />
          <Campo c={c} valor={d.video ?? ''} alCambiar={(v) => cambiar(i, 'video', v)} ejemplo="Enlace del video" />
          <Pressable
            onPress={() => cambiar(i, 'descanso', !d.descanso)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}
          >
            <View
              style={{
                width: 20, height: 20, borderRadius: 7, borderWidth: 1.6,
                borderColor: d.descanso ? c.primary : c.border,
                backgroundColor: d.descanso ? c.primary : 'transparent',
              }}
            />
            <Text style={{ color: c.muted, fontSize: 13 }}>Día de descanso</Text>
          </Pressable>
        </View>
      ))}

      <Pressable
        onPress={añadir}
        style={({ pressed }) => ({
          borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: c.border,
          paddingVertical: 12, alignItems: 'center', opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text style={{ color: c.primary, fontWeight: '700' }}>+ Añadir día</Text>
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
          borderRadius: 16, paddingVertical: 14, alignItems: 'center',
          backgroundColor: c.primary, opacity: !puedeGuardar ? 0.5 : pressed ? 0.85 : 1,
        })}
      >
        <Text style={{ color: c.background, fontWeight: '800' }}>
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
          style={{ paddingVertical: 12, alignItems: 'center' }}
        >
          <Text style={{ color: c.muted, fontSize: 13 }}>Borrar este programa</Text>
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
        <Text style={{ color: c.muted, fontSize: 12.5 }}>{etiqueta}</Text>
      )}
      <TextInput
        value={valor}
        onChangeText={alCambiar}
        placeholder={ejemplo}
        placeholderTextColor={c.muted}
        autoCapitalize="none"
        style={{
          backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border,
          paddingHorizontal: 12, paddingVertical: 10, color: c.foreground, fontSize: 15,
        }}
      />
    </View>
  );
}

function Aviso({ c, children }: { c: ReturnType<typeof useColors>; children: React.ReactNode }) {
  return (
    <View style={{ borderRadius: 18, borderWidth: 1, borderStyle: 'dashed', borderColor: c.border, padding: 16 }}>
      <Text style={{ color: c.muted, fontSize: 13.5, lineHeight: 20 }}>{children}</Text>
    </View>
  );
}
