import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View, Pressable, TextInput, Modal, Alert, Platform } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { ScreenContainer } from '@/components/screen-container';
import { Titulo, Sticker, Chispa, Estrella, Sello, TINTA } from '@/components/decor';
import { TIPOS_HOBBY, ESTADOS_OBRA, estadoObra, MINUTOS_RAPIDOS } from '@/constants/hobbies';
import { useHobbies, useHobbySessions, useObras, useFotosFirmadas, useHobbyActions, type Hobby, type Obra } from '@/hooks/use-hobbies';
import { minutosSemana, duracion, horaCorta, tituloDia, fechaLocal } from '@/lib/registros';

// Hobbies: lo que haces por gusto, con sus sesiones, y las obras en curso con fotos.
const ROSA = '#F49AC1';
const VISTAS = [['hobbies', 'Hobbies'], ['obras', 'Obras en curso']] as const;
type Vista = (typeof VISTAS)[number][0];

const confirmar = (msg: string, si: () => void) => {
  if (Platform.OS === 'web') { if (window.confirm(msg)) si() }
  else Alert.alert(msg, undefined, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Sí', style: 'destructive', onPress: si }]);
};

export default function HobbiesScreen() {
  const [vista, setVista] = useState<Vista>('hobbies');
  const { data: hobbies = [], error: errHobbies, isLoading } = useHobbies();
  const { data: sesiones = [] } = useHobbySessions();
  const { data: obras = [] } = useObras();
  const acciones = useHobbyActions();

  const [nuevoHobby, setNuevoHobby] = useState(false);
  const [sesionDe, setSesionDe] = useState<Hobby | null>(null);
  const [nuevaObra, setNuevaObra] = useState(false);
  const [obraAbierta, setObraAbierta] = useState<string | null>(null);

  const semana = useMemo(() => minutosSemana(sesiones), [sesiones]);
  const totalSemana = Object.values(semana).reduce((a, b) => a + b, 0);
  const hobbyDe = (id: string | null) => hobbies.find((h) => h.id === id);
  const enCurso = obras.filter((o) => o.status === 'en_proceso').length;
  const obra = obras.find((o) => o.id === obraAbierta) ?? null;

  return (
    <ScreenContainer className="p-0" containerClassName="bg-[#110F0D]">
      <ScrollView contentContainerStyle={{ paddingBottom: 150 }} keyboardShouldPersistTaps="handled">
        <View style={{ paddingHorizontal: 20, paddingTop: 24, maxWidth: 640, width: '100%', alignSelf: 'center', gap: 18 }}>
          {/* Cabecera: el dato de la semana gana la mirada */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Titulo>Hobbies</Titulo>
              <Text style={{ color: TINTA.suave, fontSize: 15, marginTop: 6 }}>Lo que haces porque te gusta.</Text>
            </View>
            <Sello centro={totalSemana < 60 ? `${totalSemana}′` : `${+(totalSemana / 60).toFixed(1)}h`} pie="semana" color={ROSA} size={78} style={{ marginTop: 52 }} />
          </View>

          <View style={{ flexDirection: 'row', backgroundColor: TINTA.tarjeta, borderRadius: 22, padding: 4, borderWidth: 1, borderColor: TINTA.borde }}>
            {VISTAS.map(([v, nombre]) => (
              <Pressable key={v} onPress={() => setVista(v)} accessibilityRole="tab" accessibilityState={{ selected: vista === v }}
                style={{ flex: 1, minHeight: 44, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: vista === v ? ROSA : 'transparent' }}>
                <Text style={{ color: vista === v ? TINTA.fondo : TINTA.texto, fontWeight: '800' }}>
                  {nombre}{v === 'obras' && enCurso ? ` · ${enCurso}` : ''}
                </Text>
              </Pressable>
            ))}
          </View>

          {errHobbies && (
            <View style={{ backgroundColor: TINTA.tarjeta, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: '#FFB547' }}>
              <Text style={{ color: TINTA.texto, fontWeight: '800', fontSize: 16 }}>Falta un paso en la base de datos</Text>
              <Text style={{ color: TINTA.suave, marginTop: 4, lineHeight: 20 }}>
                Las tablas de hobbies y obras todavía no existen en Supabase. Están en supabase/registros-hobbies.sql.
              </Text>
            </View>
          )}

          {vista === 'hobbies' && !errHobbies && <>
            {!isLoading && hobbies.length === 0 && (
              <Vacio emoji="🧶" titulo="Empieza con uno" texto="Tejido, guitarra, dibujo… Elige uno y anota cada rato que le dedicas." />
            )}

            {hobbies.map((h, k) => {
              const min = semana[h.id] ?? 0;
              const pct = Math.min(100, Math.round((min / Math.max(h.weekly_goal_min, 1)) * 100));
              const ultima = sesiones.find((s) => s.hobby_id === h.id);
              return (
                <View key={h.id} style={{ backgroundColor: TINTA.tarjeta, borderRadius: 28, padding: 18, borderWidth: 1, borderColor: TINTA.borde }}>
                  {pct >= 100 && <Sticker texto="¡meta!" color={h.color} giro={k % 2 ? 7 : -7} style={{ position: 'absolute', top: -12, right: 18 }} />}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: h.color, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: k % 2 ? '4deg' : '-4deg' }] }}>
                      <Text style={{ fontSize: 28 }}>{h.emoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: TINTA.texto, fontSize: 19, fontWeight: '800' }}>{h.name}</Text>
                      <Text style={{ color: TINTA.suave, fontSize: 13.5, marginTop: 2 }}>
                        {ultima ? `Última vez: ${tituloDia(fechaLocal(new Date(ultima.done_at))).toLowerCase()}` : 'Sin sesiones todavía'}
                      </Text>
                    </View>
                    <Pressable onPress={() => confirmar(`¿Archivar ${h.name}? Sus sesiones siguen en el historial.`, () => acciones.archivarHobby.mutate(h.id))}
                      accessibilityLabel={`Archivar ${h.name}`} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: TINTA.suave, fontSize: 18 }}>⋯</Text>
                    </Pressable>
                  </View>

                  <View style={{ marginTop: 16 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ color: TINTA.texto, fontWeight: '800' }}>{duracion(min)}</Text>
                      <Text style={{ color: TINTA.suave }}>meta {duracion(h.weekly_goal_min)}</Text>
                    </View>
                    <View style={{ height: 12, borderRadius: 6, backgroundColor: '#2A2521', overflow: 'hidden' }}>
                      <View style={{ width: `${pct}%`, height: '100%', backgroundColor: h.color, borderRadius: 6 }} />
                    </View>
                  </View>

                  <Pressable onPress={() => setSesionDe(h)} accessibilityRole="button"
                    style={{ marginTop: 14, minHeight: 48, borderRadius: 18, borderWidth: 1.5, borderColor: h.color, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: h.color, fontWeight: '800', fontSize: 15 }}>Anotar un rato</Text>
                  </Pressable>
                </View>
              );
            })}

            <Pressable onPress={() => setNuevoHobby(true)} accessibilityRole="button"
              style={{ minHeight: 52, borderRadius: 20, backgroundColor: ROSA, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: TINTA.fondo, fontWeight: '900', fontSize: 16 }}>+ Nuevo hobby</Text>
            </Pressable>

            {sesiones.length > 0 && (
              <View style={{ gap: 2 }}>
                <Text style={{ color: TINTA.texto, fontSize: 18, fontWeight: '800', marginBottom: 6 }}>Últimas sesiones</Text>
                {sesiones.slice(0, 8).map((s) => {
                  const h = hobbyDe(s.hobby_id);
                  const o = obras.find((x) => x.id === s.work_id);
                  return (
                    <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, borderTopWidth: 1, borderTopColor: TINTA.borde }}>
                      <Text style={{ fontSize: 20 }}>{h?.emoji ?? '✨'}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: TINTA.texto, fontWeight: '700' }}>{h?.name ?? 'Hobby archivado'} · {duracion(s.minutes)}</Text>
                        {(o || s.note) && <Text style={{ color: TINTA.suave, fontSize: 13 }} numberOfLines={1}>{[o?.name, s.note].filter(Boolean).join(' · ')}</Text>}
                      </View>
                      <Text style={{ color: TINTA.suave, fontSize: 12.5 }}>{tituloDia(fechaLocal(new Date(s.done_at)))} · {horaCorta(s.done_at)}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </>}

          {vista === 'obras' && !errHobbies && <>
            {obras.length === 0 && (
              <Vacio emoji="🖼️" titulo="Tus obras en curso" texto="Una bufanda, un cuadro, una canción. Guárdala aquí con fotos de cómo va." />
            )}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
              {obras.map((o, k) => <TarjetaObra key={o.id} obra={o} hobby={hobbyDe(o.hobby_id)} giro={k % 3 === 1 ? 2 : k % 3 === 2 ? -2 : 0} onPress={() => setObraAbierta(o.id)} />)}
            </View>
            <Pressable onPress={() => setNuevaObra(true)} accessibilityRole="button"
              style={{ minHeight: 52, borderRadius: 20, backgroundColor: ROSA, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: TINTA.fondo, fontWeight: '900', fontSize: 16 }}>+ Nueva obra</Text>
            </Pressable>
          </>}
        </View>
      </ScrollView>

      <NuevoHobby visible={nuevoHobby} onClose={() => setNuevoHobby(false)} onCrear={(h) => acciones.crearHobby.mutate(h)} />
      <AnotarSesion hobby={sesionDe} obras={obras.filter((o) => o.hobby_id === sesionDe?.id && ['idea', 'en_proceso', 'pausada'].includes(o.status))}
        onClose={() => setSesionDe(null)} onGuardar={(s) => acciones.registrarSesion.mutate(s)} />
      <NuevaObra visible={nuevaObra} hobbies={hobbies} onClose={() => setNuevaObra(false)}
        onCrear={(o) => acciones.crearObra.mutate(o, { onSuccess: (id) => setObraAbierta(id) })} />
      <DetalleObra obra={obra} hobbies={hobbies} onClose={() => setObraAbierta(null)} acciones={acciones} />
    </ScreenContainer>
  );
}

function Vacio({ emoji, titulo, texto }: { emoji: string; titulo: string; texto: string }) {
  return (
    <View style={{ backgroundColor: TINTA.tarjeta, borderRadius: 28, padding: 22, borderWidth: 1, borderColor: TINTA.borde, overflow: 'visible' }}>
      <Chispa size={26} color="#FFB547" style={{ position: 'absolute', top: -10, right: 26 }} />
      <Estrella size={22} style={{ position: 'absolute', bottom: -9, right: 60 }} />
      <Text style={{ fontSize: 40 }}>{emoji}</Text>
      <Titulo size={24} style={{ marginTop: 8 }}>{titulo}</Titulo>
      <Text style={{ color: TINTA.suave, marginTop: 6, fontSize: 15, lineHeight: 21 }}>{texto}</Text>
    </View>
  );
}

function TarjetaObra({ obra, hobby, giro, onPress }: { obra: Obra; hobby?: Hobby; giro: number; onPress: () => void }) {
  const portada = obra.craft_work_images[0]?.path;
  const { data: urls } = useFotosFirmadas(portada ? [portada] : []);
  const est = estadoObra(obra.status);
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Obra: ${obra.name}`}
      style={{ flexBasis: '46%', flexGrow: 1, backgroundColor: TINTA.texto, borderRadius: 6, padding: 8, paddingBottom: 12, transform: [{ rotate: `${giro}deg` }] }}>
      {/* Polaroid: foto arriba, nombre abajo */}
      <View style={{ aspectRatio: 1, borderRadius: 3, overflow: 'hidden', backgroundColor: hobby?.color ?? ROSA, alignItems: 'center', justifyContent: 'center' }}>
        {portada && urls?.[portada]
          ? <Image source={{ uri: urls[portada] }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          : <Text style={{ fontSize: 44 }}>{hobby?.emoji ?? '🖼️'}</Text>}
      </View>
      <Sticker texto={est.nombre} color={est.color} giro={-giro * 3 || -5} style={{ position: 'absolute', top: -10, left: -6 }} />
      <Text style={{ color: TINTA.fondo, fontWeight: '800', fontSize: 15, marginTop: 8 }} numberOfLines={1}>{obra.name}</Text>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: '#E2D9CF', marginTop: 6, overflow: 'hidden' }}>
        <View style={{ width: `${obra.progress_pct}%`, height: '100%', backgroundColor: TINTA.fondo }} />
      </View>
    </Pressable>
  );
}

// ─── Hojas ───────────────────────────────────────────────────────────────────

function Hoja({ visible, onClose, titulo, children }: { visible: boolean; onClose: () => void; titulo: string; children: React.ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} accessibilityLabel="Cerrar" />
      <View style={{ backgroundColor: TINTA.tarjeta, borderTopLeftRadius: 32, borderTopRightRadius: 32, borderWidth: 1, borderColor: TINTA.borde, maxHeight: '88%' }}>
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40, gap: 14 }} keyboardShouldPersistTaps="handled">
          <Titulo size={24}>{titulo}</Titulo>
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}

const campo = { color: TINTA.texto, borderWidth: 1.5, borderColor: TINTA.borde, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 } as const;
const etiqueta = { color: TINTA.suave, fontWeight: '700' as const, fontSize: 13.5 };
const chip = (on: boolean, color = ROSA) => ({
  minHeight: 44, paddingHorizontal: 16, borderRadius: 22, justifyContent: 'center' as const, alignItems: 'center' as const,
  backgroundColor: on ? color : 'transparent', borderWidth: 1.5, borderColor: on ? color : TINTA.borde,
});
const Boton = ({ texto, onPress, color = ROSA, disabled }: { texto: string; onPress: () => void; color?: string; disabled?: boolean }) => (
  <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button"
    style={{ minHeight: 52, borderRadius: 20, backgroundColor: color, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.5 : 1 }}>
    <Text style={{ color: TINTA.fondo, fontWeight: '900', fontSize: 16 }}>{texto}</Text>
  </Pressable>
);

function NuevoHobby({ visible, onClose, onCrear }: { visible: boolean; onClose: () => void; onCrear: (h: Pick<Hobby, 'name' | 'kind' | 'emoji' | 'color' | 'weekly_goal_min'>) => void }) {
  const [tipo, setTipo] = useState<(typeof TIPOS_HOBBY)[number]>(TIPOS_HOBBY[0]);
  const [nombre, setNombre] = useState('');
  const [meta, setMeta] = useState(120);
  const crear = () => {
    onCrear({ name: nombre.trim() || tipo.nombre, kind: tipo.kind, emoji: tipo.emoji, color: tipo.color, weekly_goal_min: meta });
    setNombre(''); setMeta(120); onClose();
  };
  return (
    <Hoja visible={visible} onClose={onClose} titulo="Nuevo hobby">
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {TIPOS_HOBBY.map((t) => (
          <Pressable key={t.kind} onPress={() => setTipo(t)} accessibilityRole="button" accessibilityState={{ selected: tipo.kind === t.kind }} style={chip(tipo.kind === t.kind, t.color)}>
            <Text style={{ color: tipo.kind === t.kind ? TINTA.fondo : TINTA.texto, fontWeight: '700' }}>{t.emoji} {t.nombre}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={etiqueta}>Nombre</Text>
      <TextInput value={nombre} onChangeText={setNombre} placeholder={tipo.nombre} placeholderTextColor={TINTA.suave} style={campo} />
      <Text style={etiqueta}>Meta a la semana</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {[60, 120, 180, 300].map((m) => (
          <Pressable key={m} onPress={() => setMeta(m)} style={chip(meta === m)}>
            <Text style={{ color: meta === m ? TINTA.fondo : TINTA.texto, fontWeight: '700' }}>{duracion(m)}</Text>
          </Pressable>
        ))}
      </View>
      <Boton texto="Crear hobby" onPress={crear} color={tipo.color} />
    </Hoja>
  );
}

function AnotarSesion({ hobby, obras, onClose, onGuardar }: {
  hobby: Hobby | null; obras: Obra[]; onClose: () => void;
  onGuardar: (s: { hobby_id: string; minutes: number; note?: string; work_id?: string | null }) => void;
}) {
  const [min, setMin] = useState(30);
  const [nota, setNota] = useState('');
  const [obra, setObra] = useState<string | null>(null);
  if (!hobby) return null;
  const guardar = () => { onGuardar({ hobby_id: hobby.id, minutes: min, note: nota.trim(), work_id: obra }); setNota(''); setObra(null); onClose() };
  return (
    <Hoja visible onClose={onClose} titulo={`${hobby.emoji} ${hobby.name}`}>
      <Text style={etiqueta}>¿Cuánto rato?</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {MINUTOS_RAPIDOS.map((m) => (
          <Pressable key={m} onPress={() => setMin(m)} style={chip(min === m, hobby.color)}>
            <Text style={{ color: min === m ? TINTA.fondo : TINTA.texto, fontWeight: '700' }}>{duracion(m)}</Text>
          </Pressable>
        ))}
      </View>
      {obras.length > 0 && <>
        <Text style={etiqueta}>¿En qué obra?</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {obras.map((o) => (
            <Pressable key={o.id} onPress={() => setObra(obra === o.id ? null : o.id)} style={chip(obra === o.id, hobby.color)}>
              <Text style={{ color: obra === o.id ? TINTA.fondo : TINTA.texto, fontWeight: '700' }}>{o.name}</Text>
            </Pressable>
          ))}
        </View>
      </>}
      <Text style={etiqueta}>Nota (opcional)</Text>
      <TextInput value={nota} onChangeText={setNota} placeholder="Terminé la manga izquierda" placeholderTextColor={TINTA.suave} style={campo} />
      <Boton texto={`Guardar ${duracion(min)}`} onPress={guardar} color={hobby.color} />
    </Hoja>
  );
}

function NuevaObra({ visible, hobbies, onClose, onCrear }: {
  visible: boolean; hobbies: Hobby[]; onClose: () => void;
  onCrear: (o: { name: string; description?: string; hobby_id?: string | null }) => void;
}) {
  const [nombre, setNombre] = useState('');
  const [desc, setDesc] = useState('');
  const [hobby, setHobby] = useState<string | null>(null);
  const crear = () => { if (!nombre.trim()) return; onCrear({ name: nombre.trim(), description: desc.trim(), hobby_id: hobby }); setNombre(''); setDesc(''); setHobby(null); onClose() };
  return (
    <Hoja visible={visible} onClose={onClose} titulo="Nueva obra">
      <Text style={etiqueta}>Nombre</Text>
      <TextInput value={nombre} onChangeText={setNombre} placeholder="Bufanda de lana verde" placeholderTextColor={TINTA.suave} style={campo} />
      {hobbies.length > 0 && <>
        <Text style={etiqueta}>Hobby</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {hobbies.map((h) => (
            <Pressable key={h.id} onPress={() => setHobby(hobby === h.id ? null : h.id)} style={chip(hobby === h.id, h.color)}>
              <Text style={{ color: hobby === h.id ? TINTA.fondo : TINTA.texto, fontWeight: '700' }}>{h.emoji} {h.name}</Text>
            </Pressable>
          ))}
        </View>
      </>}
      <Text style={etiqueta}>De qué se trata (opcional)</Text>
      <TextInput value={desc} onChangeText={setDesc} multiline placeholder="Para regalar en diciembre" placeholderTextColor={TINTA.suave} style={[campo, { minHeight: 80, textAlignVertical: 'top' }]} />
      <Boton texto="Crear obra" onPress={crear} disabled={!nombre.trim()} />
    </Hoja>
  );
}

function DetalleObra({ obra, hobbies, onClose, acciones }: {
  obra: Obra | null; hobbies: Hobby[]; onClose: () => void; acciones: ReturnType<typeof useHobbyActions>;
}) {
  const paths = obra?.craft_work_images.map((i) => i.path) ?? [];
  const { data: urls = {} } = useFotosFirmadas(paths);
  const [aviso, setAviso] = useState('');
  if (!obra) return null;
  const hobby = hobbies.find((h) => h.id === obra.hobby_id);

  const agregarFoto = async () => {
    setAviso('');
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, allowsMultipleSelection: true, selectionLimit: 6 });
    if (r.canceled) return;
    let orden = obra.craft_work_images.length;
    for (const a of r.assets) {
      acciones.subirFoto.mutate({ obra: obra.id, uri: a.uri, mime: a.mimeType, orden: orden++ }, {
        onError: (e) => setAviso(`No pude subir la foto: ${(e as Error).message}`),
      });
    }
  };

  return (
    <Hoja visible onClose={onClose} titulo={obra.name}>
      {!!hobby && <Text style={{ color: TINTA.suave, marginTop: -8 }}>{hobby.emoji} {hobby.name}{obra.started_on ? ` · desde ${obra.started_on.split('-').reverse().join('/')}` : ''}</Text>}
      {!!obra.description && <Text style={{ color: TINTA.texto, fontSize: 15, lineHeight: 21 }}>{obra.description}</Text>}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 6 }}>
        {obra.craft_work_images.map((img, k) => (
          <View key={img.id} style={{ width: 150, backgroundColor: TINTA.texto, padding: 6, paddingBottom: 18, borderRadius: 4, transform: [{ rotate: `${k % 2 ? 2 : -2}deg` }] }}>
            {urls[img.path]
              ? <Image source={{ uri: urls[img.path] }} style={{ width: '100%', aspectRatio: 1 }} contentFit="cover" />
              : <View style={{ width: '100%', aspectRatio: 1, backgroundColor: '#E2D9CF' }} />}
            <Pressable onPress={() => confirmar('¿Quitar esta foto?', () => acciones.borrarFoto.mutate(img))} accessibilityLabel="Quitar foto"
              style={{ position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,.6)', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 18, lineHeight: 20 }}>×</Text>
            </Pressable>
          </View>
        ))}
        <Pressable onPress={agregarFoto} accessibilityRole="button" accessibilityLabel="Añadir fotos"
          style={{ width: 150, aspectRatio: 0.88, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: ROSA, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <Text style={{ fontSize: 28 }}>📷</Text>
          <Text style={{ color: ROSA, fontWeight: '800' }}>{acciones.subirFoto.isPending ? 'Subiendo…' : 'Añadir fotos'}</Text>
        </Pressable>
      </ScrollView>
      {!!aviso && <Text style={{ color: '#FFB547' }}>{aviso}</Text>}

      <Text style={etiqueta}>Cómo va · {obra.progress_pct}%</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[0, 25, 50, 75, 100].map((p) => (
          <Pressable key={p} onPress={() => acciones.cambiarObra.mutate({ id: obra.id, progress_pct: p })} style={[chip(obra.progress_pct === p), { flex: 1, paddingHorizontal: 0 }]}>
            <Text style={{ color: obra.progress_pct === p ? TINTA.fondo : TINTA.texto, fontWeight: '700' }}>{p}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={etiqueta}>Estado</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {ESTADOS_OBRA.map((e) => (
          <Pressable key={e.estado} onPress={() => acciones.cambiarObra.mutate({ id: obra.id, status: e.estado })} style={chip(obra.status === e.estado, e.color)}>
            <Text style={{ color: obra.status === e.estado ? TINTA.fondo : TINTA.texto, fontWeight: '700' }}>{e.nombre}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={() => confirmar(`¿Borrar «${obra.name}» y sus fotos?`, () => { acciones.borrarObra.mutate(obra); onClose() })}
        style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
        <Text style={{ color: '#FF7A6B', fontWeight: '700' }}>Borrar obra</Text>
      </Pressable>
    </Hoja>
  );
}
