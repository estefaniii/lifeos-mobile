import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View, Pressable, Switch, Alert, TextInput, Share, Platform, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { Titulo, Sticker, TINTA, acentoTexto, RADIO } from '@/components/decor';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { useAjustes, useGuardarRecordatorios, useGuardarHoraInicio, useFotoPerfil, usePush, type EstadoPush } from '@/hooks/use-ajustes';
import { RECORDATORIOS, conDefectos, horaBonita, deMinutos, type ClaveRecordatorio, type Recordatorios } from '@/lib/recordatorios';
import { fechaLocal } from '@/lib/registros';
import { ACENTOS } from '@/constants/tabs';
import { guardarPreferenciaTema, preferenciaTema, type PreferenciaTema } from '@/lib/tema';

// Perfil: tu foto y tu nombre, los recordatorios que llegan al celular y tus datos.
const ACENTO = ACENTOS.inicio;

const TEMAS: { valor: PreferenciaTema; texto: string }[] = [
  { valor: 'oscuro', texto: '🌙 Oscuro' },
  { valor: 'claro', texto: '☀️ Claro' },
  { valor: 'sistema', texto: '📱 Como el teléfono' },
];

const avisar = (titulo: string, msg?: string) => (Platform.OS === 'web' ? window.alert(msg ? `${titulo}\n\n${msg}` : titulo) : Alert.alert(titulo, msg));
const confirmar = (msg: string, si: () => void) => {
  if (Platform.OS === 'web') { if (window.confirm(msg)) si() }
  else Alert.alert(msg, undefined, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Sí', onPress: si }]);
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, refresh } = useAuth();
  const { data: ajustes } = useAjustes();
  const { subir, quitar } = useFotoPerfil();
  const guardarRec = useGuardarRecordatorios();
  const push = usePush();
  // El tema se lee al abrir la app; aquí solo se recuerda lo elegido
  const [tema, setTema] = useState<PreferenciaTema>(preferenciaTema);
  const elegirTema = (t: PreferenciaTema) => {
    if (t === tema) return;
    setTema(t);
    void guardarPreferenciaTema(t);
  };
  const guardarHora = useGuardarHoraInicio();

  const [nombre, setNombre] = useState(user?.name || '');
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [rec, setRec] = useState<Recordatorios>(conDefectos(null));
  const [horaAbierta, setHoraAbierta] = useState<{ clave: ClaveRecordatorio; i: number } | null>(null);
  const [ocupado, setOcupado] = useState('');

  useEffect(() => { if (user?.name) setNombre(user.name) }, [user?.name]);
  useEffect(() => { if (ajustes) setRec(ajustes.recordatorios) }, [ajustes]);

  const inicial = (nombre || user?.email || '?').trim().charAt(0).toUpperCase();

  const elegirFoto = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (r.canceled) return;
    const a = r.assets[0];
    subir.mutate({ uri: a.uri, mime: a.mimeType, anterior: ajustes?.avatar_path }, {
      onError: (e) => avisar('No pude subir la foto', (e as Error).message),
    });
  };

  const guardarNombre = async () => {
    if (!nombre.trim() || !user?.id) return;
    const { error } = await supabase.from('users').upsert(
      { id: String(user.id), name: nombre.trim(), email: user.email || '', last_active: new Date().toISOString() },
      { onConflict: 'id' },
    );
    if (error) return avisar('No se pudo guardar', error.message);
    await refresh();
    setEditandoNombre(false);
  };

  // Cada cambio se guarda al momento
  const cambiar = (r: Recordatorios) => { setRec(r); guardarRec.mutate(r) };
  const alternar = (c: ClaveRecordatorio, on: boolean) => cambiar({ ...rec, [c]: { ...rec[c], on } });
  const moverHora = (c: ClaveRecordatorio, i: number, delta: number) => {
    const h = rec[c].horas[i];
    const nueva = deMinutos(Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5)) + delta);
    const horas = [...rec[c].horas]; horas[i] = nueva; horas.sort();
    setHoraAbierta({ clave: c, i: horas.indexOf(nueva) });
    cambiar({ ...rec, [c]: { ...rec[c], horas } });
  };
  const quitarHora = (c: ClaveRecordatorio, i: number) => {
    const horas = rec[c].horas.filter((_, k) => k !== i);
    setHoraAbierta(null);
    cambiar({ ...rec, [c]: { on: horas.length > 0 && rec[c].on, horas: horas.length ? horas : rec[c].horas } });
  };
  const sumarHora = (c: ClaveRecordatorio) => {
    const ult = rec[c].horas[rec[c].horas.length - 1] ?? '09:00';
    const nueva = deMinutos(Number(ult.slice(0, 2)) * 60 + Number(ult.slice(3, 5)) + 60);
    if (rec[c].horas.includes(nueva)) return;
    cambiar({ ...rec, [c]: { ...rec[c], horas: [...rec[c].horas, nueva].sort() } });
  };

  const accionPush = async (que: 'activar' | 'probar' | 'desactivar') => {
    setOcupado(que);
    try {
      if (que === 'activar') { await push.activar(); await push.probar() }
      if (que === 'probar') await push.probar();
      if (que === 'desactivar') await push.desactivar();
    } catch (e) {
      avisar('No se pudo', (e as Error).message);
    } finally {
      setOcupado('');
    }
  };

  const exportar = async () => {
    if (!user?.id) return;
    const id = String(user.id);
    const tablas = ['transactions', 'budgets', 'savings_goals', 'recurring_transactions', 'health_metrics', 'mental_logs', 'habits', 'habit_logs',
      'exercise_sessions', 'meal_plan', 'shopping_items', 'notes', 'life_logs', 'hobbies', 'hobby_sessions', 'craft_works'];
    const datos: Record<string, unknown> = { exportado: new Date().toISOString(), usuario: { id, nombre: user.name, email: user.email } };
    const filas = await Promise.all(tablas.map((t) => supabase.from(t).select('*').eq('user_id', id)));
    tablas.forEach((t, k) => { datos[t] = filas[k].data ?? [] });
    const json = JSON.stringify(datos, null, 2);
    if (Platform.OS === 'web') {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      a.download = `lifeos-${fechaLocal()}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    } else {
      await Share.share({ message: json, title: 'Mis datos de LifeOS' });
    }
  };

  const tarjeta = { backgroundColor: TINTA.tarjeta, borderRadius: RADIO.tarjeta, borderWidth: 1, borderColor: TINTA.borde } as const;

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ paddingBottom: 150 }} keyboardShouldPersistTaps="handled">
        <View style={{ paddingHorizontal: 20, paddingTop: 24, maxWidth: 640, width: '100%', alignSelf: 'center', gap: 22 }}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' }}>
            <Text style={{ color: TINTA.suave, fontWeight: '700', fontSize: 15 }}>← Volver</Text>
          </Pressable>

          {/* Tú: foto grande, nombre y correo */}
          <View style={[tarjeta, { padding: 22, alignItems: 'center' }]}>
            <Pressable onPress={elegirFoto} accessibilityRole="button" accessibilityLabel="Cambiar foto de perfil"
              style={{ width: 112, height: 112, borderRadius: 56, borderWidth: 3, borderColor: ACENTO, padding: 3 }}>
              <View style={{ flex: 1, borderRadius: 52, overflow: 'hidden', backgroundColor: TINTA.elevada, alignItems: 'center', justifyContent: 'center' }}>
                {ajustes?.avatarUrl
                  ? <Image source={{ uri: ajustes.avatarUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  : <Titulo size={44} color={ACENTO}>{inicial}</Titulo>}
                {subir.isPending && (
                  <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,.5)', alignItems: 'center', justifyContent: 'center' } as never}>
                    <ActivityIndicator color="#fff" />
                  </View>
                )}
              </View>
              <View style={{ position: 'absolute', right: -2, bottom: 2, width: 36, height: 36, borderRadius: 18, backgroundColor: ACENTO, borderWidth: 3, borderColor: TINTA.tarjeta, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 15 }}>📷</Text>
              </View>
            </Pressable>
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 10 }}>
              <Pressable onPress={elegirFoto} style={{ minHeight: 40, justifyContent: 'center' }}>
                <Text style={{ color: acentoTexto(ACENTO), fontWeight: '800' }}>{ajustes?.avatarUrl ? 'Cambiar foto' : 'Poner foto'}</Text>
              </Pressable>
              {!!ajustes?.avatar_path && (
                <Pressable onPress={() => confirmar('¿Quitar tu foto?', () => quitar.mutate(ajustes.avatar_path!))} style={{ minHeight: 40, justifyContent: 'center' }}>
                  <Text style={{ color: TINTA.suave, fontWeight: '700' }}>Quitar</Text>
                </Pressable>
              )}
            </View>

            {editandoNombre ? (
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, width: '100%' }}>
                <TextInput value={nombre} onChangeText={setNombre} autoFocus onSubmitEditing={guardarNombre} placeholder="Tu nombre" placeholderTextColor={TINTA.suave}
                  style={{ flex: 1, color: TINTA.texto, borderWidth: 1.5, borderColor: TINTA.borde, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 11, fontSize: 17 }} />
                <Pressable onPress={guardarNombre} style={{ minWidth: 84, borderRadius: 16, backgroundColor: ACENTO, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: TINTA.sobreAcento, fontWeight: '900' }}>Guardar</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={() => setEditandoNombre(true)} accessibilityRole="button" accessibilityHint="Editar tu nombre" style={{ alignItems: 'center', marginTop: 6 }}>
                <Titulo size={30}>{nombre || 'Tu nombre'}</Titulo>
                <Text style={{ color: TINTA.suave, fontSize: 14, marginTop: 4 }}>{user?.email} · <Text style={{ color: acentoTexto(ACENTO), fontWeight: '700' }}>editar</Text></Text>
              </Pressable>
            )}
          </View>

          {/* Notificaciones */}
          <View>
            <Titulo size={24} style={{ marginBottom: 4 }}>Recordatorios</Titulo>
            <Text style={{ color: TINTA.suave, fontSize: 14.5, marginBottom: 12, lineHeight: 20 }}>Llegan al celular aunque LifeOS esté cerrada.</Text>

            <EstadoAvisos estado={push.estado} ocupado={ocupado} onAccion={accionPush} />

            <View style={[tarjeta, { marginTop: 12, paddingHorizontal: 16 }]}>
              {RECORDATORIOS.map((r, k) => {
                const a = rec[r.clave];
                return (
                  <View key={r.clave} style={{ paddingVertical: 14, borderTopWidth: k ? 1 : 0, borderTopColor: TINTA.borde }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: TINTA.elevada, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 19 }}>{r.emoji}</Text>
                      </View>
                      <Text style={{ flex: 1, color: a.on ? TINTA.texto : TINTA.suave, fontSize: 16, fontWeight: '800' }}>{r.nombre}</Text>
                      <Switch value={a.on} onValueChange={(v) => alternar(r.clave, v)} trackColor={{ false: TINTA.bordeFuerte, true: ACENTO }} thumbColor="#fff"
                        {...({ activeThumbColor: '#fff' } as object)} accessibilityLabel={r.nombre} />
                    </View>
                    {a.on && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10, marginLeft: 52 }}>
                        {a.horas.map((h, i) => {
                          const abierta = horaAbierta?.clave === r.clave && horaAbierta.i === i;
                          return (
                            <Pressable key={h} onPress={() => setHoraAbierta(abierta ? null : { clave: r.clave, i })} accessibilityRole="button" accessibilityLabel={`Cambiar la hora ${horaBonita(h)}`}
                              style={{ minHeight: 36, paddingHorizontal: 12, borderRadius: 18, justifyContent: 'center', borderWidth: 1.5, borderColor: abierta ? ACENTO : TINTA.borde, backgroundColor: abierta ? ACENTO + '22' : 'transparent' }}>
                              <Text style={{ color: TINTA.texto, fontWeight: '700', fontSize: 13.5 }}>{horaBonita(h)}</Text>
                            </Pressable>
                          );
                        })}
                        {r.horas.length > 1 || a.horas.length > 1 ? (
                          <Pressable onPress={() => sumarHora(r.clave)} accessibilityLabel="Añadir otra hora"
                            style={{ minHeight: 36, paddingHorizontal: 12, borderRadius: 18, justifyContent: 'center', borderWidth: 1.5, borderStyle: 'dashed', borderColor: TINTA.borde }}>
                            <Text style={{ color: TINTA.suave, fontWeight: '700', fontSize: 13.5 }}>+ hora</Text>
                          </Pressable>
                        ) : null}
                      </View>
                    )}
                    {a.on && horaAbierta?.clave === r.clave && a.horas[horaAbierta.i] && (
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, marginLeft: 52 }}>
                        {[['− 30 min', -30], ['+ 30 min', 30]].map(([t, d]) => (
                          <Pressable key={t} onPress={() => moverHora(r.clave, horaAbierta.i, d as number)}
                            style={{ flex: 1, minHeight: 44, borderRadius: 14, backgroundColor: TINTA.elevada, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ color: TINTA.texto, fontWeight: '800' }}>{t}</Text>
                          </Pressable>
                        ))}
                        {a.horas.length > 1 && (
                          <Pressable onPress={() => quitarHora(r.clave, horaAbierta.i)} style={{ minHeight: 44, paddingHorizontal: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ color: acentoTexto(ACENTOS.ejercicio), fontWeight: '800' }}>Quitar</Text>
                          </Pressable>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* Cuándo empieza tu día */}
          <View>
            <Titulo size={24} style={{ marginBottom: 4 }}>Tu día empieza a las</Titulo>
            <Text style={{ color: TINTA.suave, fontSize: 14.5, marginBottom: 12, lineHeight: 20 }}>
              Si te acuestas tarde, lo que hagas antes de esta hora cuenta para el día anterior: el agua, los hábitos, el historial y las rachas.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {[0, 1, 2, 3, 4, 5, 6].map((h) => {
                const on = (ajustes?.day_start_hour ?? 0) === h;
                return (
                  <Pressable key={h} onPress={() => guardarHora.mutate(h)} accessibilityRole="button" accessibilityState={{ selected: on }}
                    style={{ minHeight: 44, paddingHorizontal: 14, borderRadius: 22, justifyContent: 'center', borderWidth: 1.5,
                      borderColor: on ? ACENTO : TINTA.borde, backgroundColor: on ? ACENTO : 'transparent' }}>
                    <Text style={{ color: on ? TINTA.sobreAcento : TINTA.texto, fontWeight: '800' }}>{h === 0 ? 'Medianoche' : `${h}:00 a. m.`}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Apariencia */}
          <View>
            <Titulo size={24} style={{ marginBottom: 4 }}>Apariencia</Titulo>
            <Text style={{ color: TINTA.suave, fontSize: 14.5, marginBottom: 12, lineHeight: 20 }}>
              {Platform.OS === 'web'
                ? 'Al elegir, la app se vuelve a cargar con los colores nuevos.'
                : 'Se aplica la próxima vez que abras la app.'}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {TEMAS.map((t) => {
                const on = tema === t.valor;
                return (
                  <Pressable key={t.valor} onPress={() => elegirTema(t.valor)} accessibilityRole="button" accessibilityState={{ selected: on }}
                    style={{ minHeight: 44, paddingHorizontal: 14, borderRadius: 22, justifyContent: 'center', borderWidth: 1.5,
                      borderColor: on ? ACENTO : TINTA.borde, backgroundColor: on ? ACENTO : 'transparent' }}>
                    <Text style={{ color: on ? TINTA.sobreAcento : TINTA.texto, fontWeight: '800' }}>{t.texto}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Tus datos */}
          <View>
            <Titulo size={24} style={{ marginBottom: 12 }}>Tus datos</Titulo>
            <Pressable onPress={exportar} accessibilityRole="button" style={[tarjeta, { padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }]}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: ACENTOS.finanzas, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-5deg' }] }}>
                <Text style={{ fontSize: 20 }}>📦</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: TINTA.texto, fontSize: 16, fontWeight: '800' }}>Descargar una copia</Text>
                <Text style={{ color: TINTA.suave, fontSize: 13.5, marginTop: 2 }}>Finanzas, salud, hábitos, comidas, hobbies y notas en un archivo.</Text>
              </View>
              <Text style={{ color: TINTA.suave, fontSize: 20 }}>›</Text>
            </Pressable>
          </View>

          {/* Salir: un botón tranquilo, sin «zona de peligro» */}
          <Pressable onPress={() => confirmar('¿Cerrar sesión en este dispositivo?', () => { logout() })} accessibilityRole="button"
            style={{ minHeight: 52, borderRadius: 20, borderWidth: 1.5, borderColor: TINTA.borde, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: TINTA.texto, fontWeight: '800', fontSize: 15 }}>Cerrar sesión</Text>
          </Pressable>
          <Text style={{ color: TINTA.suave, fontSize: 12.5, textAlign: 'center', marginTop: -8 }}>LifeOS · tu vida personal</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

// El estado de las notificaciones en este celular y qué hacer en cada caso
function EstadoAvisos({ estado, ocupado, onAccion }: { estado: EstadoPush; ocupado: string; onAccion: (q: 'activar' | 'probar' | 'desactivar') => void }) {
  const caja = { backgroundColor: TINTA.tarjeta, borderRadius: RADIO.tarjeta, borderWidth: 1.5, padding: 18 } as const;
  const boton = (texto: string, q: 'activar' | 'probar' | 'desactivar', principal = true) => (
    <Pressable key={q} onPress={() => onAccion(q)} disabled={!!ocupado} accessibilityRole="button"
      style={{ flex: principal ? 2 : 1, minHeight: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
        backgroundColor: principal ? ACENTO : 'transparent', borderWidth: principal ? 0 : 1.5, borderColor: TINTA.borde, opacity: ocupado && ocupado !== q ? 0.5 : 1 }}>
      {ocupado === q ? <ActivityIndicator color={principal ? TINTA.sobreAcento : TINTA.texto} /> :
        <Text style={{ color: principal ? TINTA.sobreAcento : TINTA.texto, fontWeight: '900', fontSize: 15 }}>{texto}</Text>}
    </Pressable>
  );

  if (estado === 'cargando') return <View style={[caja, { borderColor: TINTA.borde }]}><ActivityIndicator color={TINTA.suave} /></View>;

  if (estado === 'activo') return (
    <View style={[caja, { borderColor: ACENTOS.finanzas }]}>
      <Sticker texto="activas ✓" color={ACENTOS.finanzas} giro={5} style={{ position: 'absolute', top: -12, right: 18 }} />
      <Text style={{ color: TINTA.texto, fontSize: 16, fontWeight: '800' }}>Este celular recibe tus recordatorios</Text>
      <Text style={{ color: TINTA.suave, fontSize: 14, marginTop: 4, lineHeight: 20 }}>Si no te llega la prueba, revisa que el modo Concentración no las esté silenciando.</Text>
      {Platform.OS === 'web' && <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>{boton('Enviar prueba', 'probar')}{boton('Apagar', 'desactivar', false)}</View>}
    </View>
  );

  if (estado === 'instalar') return (
    <View style={[caja, { borderColor: ACENTO }]}>
      <Text style={{ color: TINTA.texto, fontSize: 16, fontWeight: '800' }}>Primero, añade LifeOS a tu pantalla de inicio</Text>
      <Text style={{ color: TINTA.suave, fontSize: 14, marginTop: 6, lineHeight: 21 }}>
        En el iPhone las notificaciones solo funcionan con la app instalada:{'\n'}
        1. Toca el botón Compartir de Safari (el cuadro con la flecha).{'\n'}
        2. Elige «Añadir a pantalla de inicio».{'\n'}
        3. Abre LifeOS desde el ícono y vuelve aquí a activarlas.
      </Text>
    </View>
  );

  if (estado === 'bloqueado') return (
    <View style={[caja, { borderColor: ACENTOS.ejercicio }]}>
      <Text style={{ color: TINTA.texto, fontSize: 16, fontWeight: '800' }}>Las notificaciones están bloqueadas</Text>
      <Text style={{ color: TINTA.suave, fontSize: 14, marginTop: 6, lineHeight: 21 }}>
        En el iPhone: Ajustes → Notificaciones → LifeOS → Permitir notificaciones. En la computadora, desde el candado junto a la dirección.
      </Text>
    </View>
  );

  if (estado === 'sin-soporte') return (
    <View style={[caja, { borderColor: TINTA.borde }]}>
      <Text style={{ color: TINTA.texto, fontSize: 16, fontWeight: '800' }}>Este navegador no recibe notificaciones</Text>
      <Text style={{ color: TINTA.suave, fontSize: 14, marginTop: 6 }}>Abre LifeOS en Safari del iPhone (instalada) o en Chrome.</Text>
    </View>
  );

  return (
    <View style={[caja, { borderColor: ACENTO }]}>
      <Text style={{ color: TINTA.texto, fontSize: 16, fontWeight: '800' }}>Activa los recordatorios en este celular</Text>
      <Text style={{ color: TINTA.suave, fontSize: 14, marginTop: 4, lineHeight: 20 }}>Te pedirá permiso y te llegará una notificación de prueba.</Text>
      <View style={{ flexDirection: 'row', marginTop: 14 }}>{boton('Activar notificaciones', 'activar')}</View>
    </View>
  );
}
