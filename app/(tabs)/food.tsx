import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View, Pressable, TextInput, Modal } from 'react-native';
import { Image } from 'expo-image';
import { ScreenContainer } from '@/components/screen-container';
import { Titulo, Sticker } from '@/components/decor';
import { useColors } from '@/hooks/use-colors';
import { DIAS, SLOTS, SLOT_LABEL, type Slot } from '@/constants/comida';
import { RECETAS, type Receta } from '@/constants/recetas';
import { useMealPlan, useSaveMeal, filasSugeridas, useShopping, useShoppingActions } from '@/hooks/use-vida';
import { useLifeLogsHoy, useRegistrar, useBorrarRegistro } from '@/hooks/use-registros';
import { horaCorta } from '@/lib/registros';
import {
  repartirSemana, siguienteOpcion, ingredientesDelPlan, sinLoQueYaHay, etiquetaComida, huecosLlenos, type FilaPlan,
} from '@/lib/semana-comida';

// Comida: armar la semana eligiendo recetas, el plan de cada día con su check «La comí»,
// recetas con foto y la lista de compras.
const VISTAS = [['semana', 'Semana'], ['recetas', 'Recetas'], ['compras', 'Compras']] as const;
type Vista = (typeof VISTAS)[number][0];

const PREGUNTA: Record<Slot, string> = {
  desayuno: '¿Qué desayunas esta semana?', almuerzo: '¿Qué almuerzas?', merienda: '¿Qué meriendas?', cena: '¿Qué cenas?',
};
const PASOS = SLOTS.length + 1;   // un paso por momento y la revisión
const vacias = (): Record<Slot, string[]> => ({ desayuno: [], almuerzo: [], merienda: [], cena: [] });
const sinTildes = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const recetaDe = (meal?: string) => (meal ? RECETAS.find((r) => r.titulo === meal) : undefined);

export default function FoodScreen() {
  const c = useColors();
  const hoy = (new Date().getDay() + 6) % 7;   // 0 = lunes
  const [dia, setDia] = useState(hoy);
  const [editando, setEditando] = useState<Slot | null>(null);
  const [texto, setTexto] = useState('');
  const [nuevo, setNuevo] = useState('');
  const [vista, setVista] = useState<Vista>('semana');
  const [filtro, setFiltro] = useState<Slot | null>(null);
  const [busca, setBusca] = useState('');
  const [receta, setReceta] = useState<Receta | null>(null);
  const [hecho, setHecho] = useState<'' | 'compras' | 'plan'>('');
  const [aviso, setAviso] = useState('');
  const [listo, setListo] = useState('');

  // «Armar mi semana»
  const [armando, setArmando] = useState(false);
  const [paso, setPaso] = useState(0);
  const [elegidas, setElegidas] = useState<Record<Slot, string[]>>(vacias);
  const [borrador, setBorrador] = useState<FilaPlan[]>([]);
  const [conCompras, setConCompras] = useState(true);
  const [verLista, setVerLista] = useState(false);

  const { data: plan = [], error, isLoading } = useMealPlan();
  const guardar = useSaveMeal();
  const { data: compras = [] } = useShopping();
  const { add, addMany, toggle, clearDone } = useShoppingActions();
  const { data: logs = [] } = useLifeLogsHoy();
  const registrar = useRegistrar();
  const borrar = useBorrarRegistro();
  // Checks recién tocados, para que se vean al instante mientras llega el registro
  const [pendientes, setPendientes] = useState<Set<string>>(() => new Set());

  const delDia = useMemo(() => Object.fromEntries(plan.filter((r) => r.day === dia).map((r) => [r.slot, r.meal])) as Partial<Record<Slot, string>>, [plan, dia]);
  const vacio = !isLoading && plan.length === 0;
  const llenos = huecosLlenos(plan);
  const esHoy = dia === hoy;

  // ---------- check de hoy ----------
  const logDe = (slot: Slot) => {
    const meal = delDia[slot];
    if (!meal) return undefined;
    const label = etiquetaComida(slot, meal);
    return logs.find((l) => l.kind === 'comida' && l.label?.trim() === label);
  };
  const comidaMarcada = (slot: Slot) => !!delDia[slot] && (!!logDe(slot) || pendientes.has(etiquetaComida(slot, delDia[slot]!)));
  const conComida = SLOTS.filter((s) => delDia[s]?.trim());
  const comidas = conComida.filter(comidaMarcada).length;

  const quitarPendiente = (label: string) => setPendientes((p) => { const n = new Set(p); n.delete(label); return n });
  const marcar = (slot: Slot) => {
    const meal = delDia[slot];
    if (!meal?.trim()) return;
    const label = etiquetaComida(slot, meal);
    const log = logDe(slot);
    setAviso('');
    if (log) {
      quitarPendiente(label);
      borrar.mutate({ id: log.id, tipo: 'comida', at: log.logged_at, titulo: label },
        { onError: () => setAviso('No pude quitar el check. Revisa la conexión e inténtalo otra vez.') });
      return;
    }
    if (pendientes.has(label)) return;   // ya va en camino
    setPendientes((p) => new Set(p).add(label));
    registrar.mutate({ kind: 'comida', label }, {
      onError: () => { quitarPendiente(label); setAviso('No pude guardar el check. Revisa la conexión e inténtalo otra vez.') },
    });
  };

  // ---------- plan del día ----------
  const editar = (slot: Slot) => { setEditando(slot); setTexto(delDia[slot] ?? '') };
  const confirmar = () => { if (editando) guardar.mutate([{ day: dia, slot: editando, meal: texto.trim() }]); setEditando(null) };
  const abrir = (r: Receta) => { setReceta(r); setHecho('') };
  const aCompras = (r: Receta) => { addMany.mutate(r.ingredientes); setHecho('compras') };
  const alPlan = (r: Receta) => { guardar.mutate([{ day: dia, slot: r.slot, meal: r.titulo }]); setHecho('plan') };
  const agregar = () => { if (nuevo.trim()) add.mutate(nuevo.trim()); setNuevo('') };

  // ---------- recetas ----------
  const recetas = useMemo(() => {
    const q = sinTildes(busca.trim());
    return RECETAS.filter((r) => (!filtro || r.slot === filtro) &&
      (!q || sinTildes([r.titulo, ...r.etiquetas, ...r.ingredientes].join(' ')).includes(q)));
  }, [filtro, busca]);

  // ---------- armar la semana ----------
  const empezarArmado = () => {
    // Las recetas que ya están en el plan salen elegidas de entrada
    const pre = vacias();
    for (const r of plan) if (recetaDe(r.meal) && !pre[r.slot].includes(r.meal)) pre[r.slot].push(r.meal);
    setElegidas(pre); setPaso(0); setBorrador([]); setConCompras(true); setVerLista(false); setListo(''); setArmando(true);
  };
  const elegir = (slot: Slot, titulo: string) => setElegidas((e) => ({
    ...e, [slot]: e[slot].includes(titulo) ? e[slot].filter((t) => t !== titulo) : [...e[slot], titulo],
  }));
  const siguiente = () => {
    if (paso === SLOTS.length - 1) setBorrador(repartirSemana(elegidas));
    setPaso((p) => Math.min(PASOS - 1, p + 1));
  };
  const cambiarHueco = (fila: FilaPlan) => setBorrador((b) => b.map((x) =>
    x.day === fila.day && x.slot === fila.slot ? { ...x, meal: siguienteOpcion(elegidas[fila.slot], x.meal) } : x));
  const ingredientes = useMemo(
    () => sinLoQueYaHay(ingredientesDelPlan(borrador.map((f) => f.meal), RECETAS), compras),
    [borrador, compras]);
  const guardarSemana = () => {
    if (borrador.length) guardar.mutate(borrador);
    const n = conCompras ? ingredientes.length : 0;
    if (n) addMany.mutate(ingredientes);
    setArmando(false); setVista('semana'); setDia(hoy);
    setListo(n ? `Semana guardada. Mandé ${n} ${n === 1 ? 'cosa' : 'cosas'} a Compras.` : 'Semana guardada.');
  };
  const huecoBorrador = (day: number, slot: Slot) =>
    borrador.find((f) => f.day === day && f.slot === slot)?.meal ?? plan.find((f) => f.day === day && f.slot === slot)?.meal ?? '';

  const tarjeta = { backgroundColor: c.surface, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: c.border } as const;
  const chip = (on: boolean) => ({ minHeight: 44, paddingHorizontal: 16, borderRadius: 22, justifyContent: 'center' as const,
    backgroundColor: on ? c.primary : c.surface, borderWidth: 1, borderColor: on ? c.primary : c.border });
  const campo = { color: c.foreground, borderWidth: 1.5, borderColor: c.border, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, flex: 1 } as const;
  const botonLleno = { backgroundColor: c.primary, borderRadius: 18, minHeight: 50, paddingHorizontal: 16, justifyContent: 'center' as const, alignItems: 'center' as const };
  const botonBorde = { borderRadius: 18, minHeight: 50, paddingHorizontal: 16, justifyContent: 'center' as const, alignItems: 'center' as const, borderWidth: 1.5, borderColor: c.primary };
  const casilla = (on: boolean, size = 26) => ({ width: size, height: size, borderRadius: size / 3, borderWidth: 2, borderColor: on ? c.primary : c.muted,
    backgroundColor: on ? c.primary : 'transparent', alignItems: 'center' as const, justifyContent: 'center' as const });

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ paddingBottom: 150 }} keyboardShouldPersistTaps="handled">
        <View style={{ paddingHorizontal: 20, paddingTop: 24, maxWidth: 640, width: '100%', alignSelf: 'center', gap: 16 }}>
          <View>
            <Titulo color={c.foreground}>Comida</Titulo>
            <Text style={{ color: c.muted, fontSize: 14, marginTop: 6 }}>Elige qué comer, mira cómo se prepara y marca lo que ya comiste.</Text>
          </View>

          {/* Secciones */}
          <View style={{ flexDirection: 'row', backgroundColor: c.surface, borderRadius: 22, padding: 4, borderWidth: 1, borderColor: c.border }}>
            {VISTAS.map(([v, nombre]) => (
              <Pressable key={v} onPress={() => setVista(v)} accessibilityRole="tab" accessibilityState={{ selected: vista === v }}
                style={{ flex: 1, minHeight: 44, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: vista === v ? c.primary : 'transparent' }}>
                <Text style={{ color: vista === v ? c.background : c.foreground, fontWeight: '700' }}>
                  {nombre}{v === 'compras' && compras.some((x) => !x.done) ? ` · ${compras.filter((x) => !x.done).length}` : ''}
                </Text>
              </Pressable>
            ))}
          </View>

          {error && <Text style={{ color: c.warning, fontSize: 13 }}>Aún no puedo guardar tu plan: falta crear la tabla de comidas en la base de datos.</Text>}

          {!!listo && (
            <View style={{ ...tarjeta, borderColor: c.primary, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 }}>
              <Text style={{ color: c.foreground, flex: 1, fontWeight: '600' }}>{listo}</Text>
              {listo.includes('Compras') && (
                <Pressable onPress={() => { setVista('compras'); setListo('') }} style={{ minHeight: 44, justifyContent: 'center' }}>
                  <Text style={{ color: c.primary, fontWeight: '800' }}>Ver compras</Text>
                </Pressable>
              )}
            </View>
          )}

          {vista === 'semana' && <>
          {/* Armar la semana */}
          <Pressable onPress={empezarArmado} accessibilityRole="button" accessibilityLabel="Armar mi semana"
            style={{ ...tarjeta, padding: 0, overflow: 'hidden', flexDirection: 'row', alignItems: 'stretch' }}>
            <View style={{ flexDirection: 'row', width: 112 }}>
              {[RECETAS[0], RECETAS[RECETAS.length - 1]].map((r, k) => (
                <Image key={k} source={r.foto} style={{ flex: 1 }} contentFit="cover" accessibilityIgnoresInvertColors />
              ))}
            </View>
            <View style={{ flex: 1, padding: 16, gap: 4, justifyContent: 'center' }}>
              <Text style={{ color: c.foreground, fontSize: 18, fontWeight: '800' }}>{llenos ? 'Rearmar mi semana' : 'Armar mi semana'}</Text>
              <Text style={{ color: c.muted, fontSize: 13.5, lineHeight: 19 }}>Elige recetas, las reparto por los 7 días y te paso la lista de compras.</Text>
            </View>
          </Pressable>

          {/* Días */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {DIAS.map((d, k) => (
              <Pressable key={d} onPress={() => { setDia(k); setEditando(null) }} accessibilityRole="button" accessibilityState={{ selected: k === dia }}
                style={{ minHeight: 44, paddingHorizontal: 16, borderRadius: 22, justifyContent: 'center',
                  backgroundColor: k === dia ? c.primary : c.surface, borderWidth: 1, borderColor: k === dia ? c.primary : c.border }}>
                <Text style={{ color: k === dia ? c.background : c.foreground, fontWeight: '700' }}>{d.slice(0, 3)}{k === hoy ? ' · hoy' : ''}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Plan del día */}
          <View style={{ ...tarjeta, marginTop: llenos >= 28 ? 6 : 0 }}>
            {llenos >= 28 && <Sticker texto="semana lista" giro={5} style={{ position: 'absolute', top: -14, right: 18 }} />}
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: c.foreground, fontSize: 19, fontWeight: '800' }}>{esHoy ? `Hoy, ${DIAS[dia].toLowerCase()}` : DIAS[dia]}</Text>
              {esHoy && conComida.length > 0 && (
                <Text style={{ color: c.muted, fontSize: 13.5, fontWeight: '600' }}>{comidas} de {conComida.length} comidas de hoy</Text>
              )}
            </View>
            {esHoy && conComida.length > 0 && (
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }} accessibilityLabel={`${comidas} de ${conComida.length} comidas de hoy`}>
                {conComida.map((s) => (
                  <View key={s} style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: comidaMarcada(s) ? c.primary : c.border }} />
                ))}
              </View>
            )}
            {!!aviso && esHoy && <Text style={{ color: c.warning, fontSize: 13, marginBottom: 8 }}>{aviso}</Text>}
            {vacio && (
              <Pressable onPress={() => guardar.mutate(filasSugeridas())} style={{ borderWidth: 1.5, borderColor: c.primary, borderRadius: 18, padding: 14, marginBottom: 10 }}>
                <Text style={{ color: c.primary, fontWeight: '800' }}>O empieza con el plan sugerido</Text>
                <Text style={{ color: c.muted, fontSize: 13 }}>Lo copio a tu plan y luego lo cambias a tu gusto.</Text>
              </Pressable>
            )}
            {SLOTS.map((slot) => {
              const meal = delDia[slot];
              const r = recetaDe(meal);
              const comida = esHoy && comidaMarcada(slot);
              const log = esHoy ? logDe(slot) : undefined;
              return (
                <View key={slot} style={{ paddingVertical: 12, borderTopWidth: 1, borderTopColor: c.border }}>
                  {editando === slot ? (
                    <View style={{ gap: 6 }}>
                      <Text style={{ color: c.muted, fontSize: 12.5, fontWeight: '700' }}>{SLOT_LABEL[slot]}</Text>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TextInput value={texto} onChangeText={setTexto} autoFocus onSubmitEditing={confirmar} placeholder="¿Qué vas a comer?"
                          placeholderTextColor={c.muted} style={campo} />
                        <Pressable onPress={confirmar} style={{ minWidth: 72, minHeight: 44, borderRadius: 16, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ color: c.background, fontWeight: '800' }}>Listo</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Pressable onPress={() => (r ? abrir(r) : editar(slot))} accessibilityRole="button"
                        accessibilityLabel={r ? `${SLOT_LABEL[slot]}: ${r.titulo}. Ver cómo se prepara` : `${SLOT_LABEL[slot]}: ${meal || 'vacío'}. Editar`}
                        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56 }}>
                        {r ? (
                          <Image source={r.foto} style={{ width: 60, height: 60, borderRadius: 16, opacity: comida ? 0.55 : 1 }} contentFit="cover" accessibilityIgnoresInvertColors />
                        ) : (
                          <View style={{ width: 60, height: 60, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.border, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ color: c.muted, fontSize: 20 }}>{meal ? '🍽' : '+'}</Text>
                          </View>
                        )}
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: c.muted, fontSize: 12.5, fontWeight: '700' }}>{SLOT_LABEL[slot]}</Text>
                          <Text numberOfLines={2} style={{ color: meal ? c.foreground : c.muted, fontSize: 16, fontWeight: r ? '700' : '400',
                            textDecorationLine: comida ? 'line-through' : 'none' }}>{meal || 'Toca para escribir'}</Text>
                          {comida && log ? (
                            <Text style={{ color: c.muted, fontSize: 12.5 }}>La comiste a las {horaCorta(log.logged_at)}</Text>
                          ) : r ? (
                            <Text style={{ color: c.primary, fontSize: 12.5, fontWeight: '700' }}>Cómo se prepara · {r.minutos} min</Text>
                          ) : null}
                        </View>
                      </Pressable>
                      <Pressable onPress={() => editar(slot)} accessibilityRole="button" accessibilityLabel={`Cambiar ${SLOT_LABEL[slot].toLowerCase()}`}
                        style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: c.muted, fontSize: 17 }}>✎</Text>
                      </Pressable>
                      {esHoy && !!meal?.trim() && (
                        <Pressable onPress={() => marcar(slot)} accessibilityRole="checkbox" accessibilityState={{ checked: comida }}
                          accessibilityLabel={`La comí: ${meal}`} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                          <View style={casilla(comida, 30)}>
                            {comida && <Text style={{ color: c.background, fontWeight: '900', fontSize: 16 }}>✓</Text>}
                          </View>
                        </Pressable>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
            {esHoy && conComida.length > 0 && (
              <Text style={{ color: c.muted, fontSize: 12.5, marginTop: 6 }}>Marca la casilla cuando la comas: queda en tu Historial con la hora.</Text>
            )}
          </View>
          </>}

          {vista === 'recetas' && <>
          <TextInput value={busca} onChangeText={setBusca} placeholder="Buscar receta o ingrediente…" placeholderTextColor={c.muted}
            style={{ ...campo, flex: 0, minHeight: 48, backgroundColor: c.surface }} returnKeyType="search" clearButtonMode="while-editing" accessibilityLabel="Buscar receta" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            <Pressable onPress={() => setFiltro(null)} accessibilityRole="button" accessibilityState={{ selected: !filtro }} style={chip(!filtro)}>
              <Text style={{ color: !filtro ? c.background : c.foreground, fontWeight: '700' }}>Todas</Text>
            </Pressable>
            {SLOTS.map((sl) => (
              <Pressable key={sl} onPress={() => setFiltro(sl)} accessibilityRole="button" accessibilityState={{ selected: filtro === sl }} style={chip(filtro === sl)}>
                <Text style={{ color: filtro === sl ? c.background : c.foreground, fontWeight: '700' }}>{SLOT_LABEL[sl]}</Text>
              </Pressable>
            ))}
          </ScrollView>
          {recetas.length === 0 && <Text style={{ color: c.muted, paddingVertical: 8 }}>Ninguna receta coincide con «{busca.trim()}».</Text>}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {recetas.map((r) => (
              <Pressable key={r.id} onPress={() => abrir(r)} accessibilityRole="button" accessibilityLabel={`Receta: ${r.titulo}`}
                style={{ flexBasis: '46%', flexGrow: 1, backgroundColor: c.surface, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: c.border }}>
                <Image source={r.foto} style={{ width: '100%', aspectRatio: 4 / 3 }} contentFit="cover" accessibilityIgnoresInvertColors />
                <View style={{ padding: 12, gap: 4 }}>
                  <Text style={{ color: c.foreground, fontSize: 15, fontWeight: '800' }} numberOfLines={2}>{r.titulo}</Text>
                  <Text style={{ color: c.muted, fontSize: 12.5 }}>{r.minutos} min · {SLOT_LABEL[r.slot]}</Text>
                </View>
              </Pressable>
            ))}
          </View>
          </>}

          {vista === 'compras' && <>
          {/* Compras */}
          <View style={tarjeta}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ color: c.foreground, fontSize: 19, fontWeight: '800' }}>Lista de compras</Text>
              {compras.some((x) => x.done) && (
                <Pressable onPress={() => clearDone.mutate()} style={{ minHeight: 44, justifyContent: 'center' }}>
                  <Text style={{ color: c.primary, fontWeight: '700', fontSize: 13 }}>Quitar comprados</Text>
                </Pressable>
              )}
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
              <TextInput value={nuevo} onChangeText={setNuevo} onSubmitEditing={agregar} placeholder="Agregar algo…" placeholderTextColor={c.muted} style={campo} />
              <Pressable onPress={agregar} accessibilityLabel="Agregar" style={{ width: 52, minHeight: 44, borderRadius: 16, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: c.background, fontSize: 24, fontWeight: '800' }}>+</Text>
              </Pressable>
            </View>
            {compras.length === 0 && <Text style={{ color: c.muted, paddingVertical: 8 }}>Tu lista está vacía. Al armar tu semana te la lleno.</Text>}
            {compras.map((x) => (
              <Pressable key={x.id} onPress={() => toggle.mutate(x)} accessibilityRole="checkbox" accessibilityState={{ checked: x.done }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 }}>
                <View style={casilla(x.done, 24)}>
                  {x.done && <Text style={{ color: c.background, fontWeight: '900', fontSize: 14 }}>✓</Text>}
                </View>
                <Text style={{ color: x.done ? c.muted : c.foreground, fontSize: 16, textDecorationLine: x.done ? 'line-through' : 'none', flex: 1 }}>{x.name}</Text>
              </Pressable>
            ))}
          </View>
          </>}
        </View>
      </ScrollView>

      {/* Armar mi semana: un paso por momento y la revisión */}
      <Modal visible={armando} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setArmando(false)}>
        <View style={{ flex: 1, backgroundColor: c.background }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 18, maxWidth: 640, width: '100%', alignSelf: 'center' }}>
            <Text style={{ color: c.muted, fontWeight: '700' }}>Paso {paso + 1} de {PASOS}</Text>
            <Pressable onPress={() => setArmando(false)} accessibilityRole="button" accessibilityLabel="Cerrar sin guardar"
              style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: c.surface, borderWidth: 1, borderColor: c.border }}>
              <Text style={{ color: c.foreground, fontSize: 22, fontWeight: '700', lineHeight: 24 }}>×</Text>
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 20, marginTop: 10, maxWidth: 640, width: '100%', alignSelf: 'center' }}>
            {Array.from({ length: PASOS }, (_, k) => (
              <View key={k} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: k <= paso ? c.primary : c.border }} />
            ))}
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 14, maxWidth: 640, width: '100%', alignSelf: 'center' }}>
            {paso < SLOTS.length ? (() => {
              const slot = SLOTS[paso];
              const opciones = RECETAS.filter((r) => r.slot === slot);
              return <>
                <View>
                  <Titulo color={c.foreground} size={30}>{PREGUNTA[slot]}</Titulo>
                  <Text style={{ color: c.muted, fontSize: 14.5, marginTop: 8, lineHeight: 20 }}>
                    Toca las que te provoquen. Con dos o más, no repito la misma dos días seguidos.
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                  {opciones.map((r) => {
                    const n = elegidas[slot].indexOf(r.titulo);
                    const on = n >= 0;
                    return (
                      <Pressable key={r.id} onPress={() => elegir(slot, r.titulo)} accessibilityRole="checkbox" accessibilityState={{ checked: on }}
                        accessibilityLabel={r.titulo}
                        style={{ flexBasis: '46%', flexGrow: 1, borderRadius: 20, overflow: 'hidden', backgroundColor: c.surface,
                          borderWidth: on ? 3 : 1, borderColor: on ? c.primary : c.border }}>
                        <Image source={r.foto} style={{ width: '100%', aspectRatio: 1 }} contentFit="cover" accessibilityIgnoresInvertColors />
                        <View style={{ position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
                          backgroundColor: on ? c.primary : 'rgba(0,0,0,0.45)', borderWidth: 2, borderColor: '#fff' }}>
                          {on && <Text style={{ color: c.background, fontWeight: '900' }}>✓</Text>}
                        </View>
                        <View style={{ padding: 12, gap: 2 }}>
                          <Text style={{ color: c.foreground, fontSize: 15, fontWeight: '800' }} numberOfLines={2}>{r.titulo}</Text>
                          <Text style={{ color: c.muted, fontSize: 12.5 }}>{r.minutos} min · rinde {r.porciones}</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </>;
            })() : <>
              <View>
                <Titulo color={c.foreground} size={30}>Tu semana</Titulo>
                <Text style={{ color: c.muted, fontSize: 14.5, marginTop: 8, lineHeight: 20 }}>
                  Toca una comida para cambiarla por otra de las que elegiste.
                </Text>
              </View>
              {borrador.length === 0 ? (
                <Text style={{ color: c.muted }}>No elegiste ninguna receta: tu plan queda como estaba.</Text>
              ) : (
                <Pressable onPress={() => setBorrador(repartirSemana(elegidas))} style={{ ...botonBorde, minHeight: 44 }}>
                  <Text style={{ color: c.primary, fontWeight: '800' }}>Repartir otra vez</Text>
                </Pressable>
              )}
              {DIAS.map((d, day) => (
                <View key={d} style={{ ...tarjeta, padding: 14 }}>
                  <Text style={{ color: c.foreground, fontWeight: '800', fontSize: 16, marginBottom: 10 }}>{d}{day === hoy ? ' · hoy' : ''}</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {SLOTS.map((slot) => {
                      const meal = huecoBorrador(day, slot);
                      const r = recetaDe(meal);
                      const cambia = elegidas[slot].length > 1;
                      const fila = borrador.find((f) => f.day === day && f.slot === slot);
                      return (
                        <Pressable key={slot} disabled={!fila || !cambia} onPress={() => fila && cambiarHueco(fila)}
                          accessibilityRole="button" accessibilityLabel={`${d}, ${SLOT_LABEL[slot]}: ${meal || 'vacío'}${fila && cambia ? '. Toca para cambiar' : ''}`}
                          style={{ flex: 1, gap: 4, opacity: fila ? 1 : 0.55 }}>
                          {r ? (
                            <Image source={r.foto} style={{ width: '100%', aspectRatio: 1, borderRadius: 14 }} contentFit="cover" accessibilityIgnoresInvertColors />
                          ) : (
                            <View style={{ width: '100%', aspectRatio: 1, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.border }} />
                          )}
                          <Text style={{ color: c.muted, fontSize: 11, fontWeight: '700' }}>{SLOT_LABEL[slot]}</Text>
                          <Text numberOfLines={2} style={{ color: c.foreground, fontSize: 12, lineHeight: 15 }}>{meal || '—'}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
              {borrador.length > 0 && (
                <View style={tarjeta}>
                  <Pressable onPress={() => setConCompras((v) => !v)} accessibilityRole="checkbox" accessibilityState={{ checked: conCompras }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 }}>
                    <View style={casilla(conCompras)}>{conCompras && <Text style={{ color: c.background, fontWeight: '900' }}>✓</Text>}</View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: c.foreground, fontWeight: '800', fontSize: 16 }}>Mandar ingredientes a Compras</Text>
                      <Text style={{ color: c.muted, fontSize: 13 }}>
                        {ingredientes.length
                          ? `${ingredientes.length} ${ingredientes.length === 1 ? 'cosa' : 'cosas'}, sin repetir. Lo que ya tienes pendiente no se duplica.`
                          : 'Ya está todo en tu lista.'}
                      </Text>
                    </View>
                  </Pressable>
                  {ingredientes.length > 0 && (
                    <Pressable onPress={() => setVerLista((v) => !v)} style={{ minHeight: 44, justifyContent: 'center' }}>
                      <Text style={{ color: c.primary, fontWeight: '700' }}>{verLista ? 'Ocultar la lista' : 'Ver la lista'}</Text>
                    </Pressable>
                  )}
                  {verLista && ingredientes.map((i) => (
                    <View key={i} style={{ flexDirection: 'row', gap: 10, paddingVertical: 3 }}>
                      <Text style={{ color: c.primary, fontSize: 15, lineHeight: 21 }}>•</Text>
                      <Text style={{ color: c.foreground, fontSize: 15, lineHeight: 21, flex: 1 }}>{i}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>}
          </ScrollView>

          {/* Navegación del asistente */}
          <View style={{ flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 28, borderTopWidth: 1, borderTopColor: c.border, maxWidth: 640, width: '100%', alignSelf: 'center' }}>
            {paso > 0 && (
              <Pressable onPress={() => setPaso((p) => p - 1)} style={{ ...botonBorde, flex: 1 }}>
                <Text style={{ color: c.primary, fontWeight: '800' }}>Atrás</Text>
              </Pressable>
            )}
            {paso < SLOTS.length ? (
              <Pressable onPress={siguiente} style={{ ...botonLleno, flex: 2 }}>
                <Text style={{ color: c.background, fontWeight: '800' }}>
                  {elegidas[SLOTS[paso]].length
                    ? `Siguiente · ${elegidas[SLOTS[paso]].length} ${elegidas[SLOTS[paso]].length === 1 ? 'elegida' : 'elegidas'}`
                    : 'Saltar: dejo lo que tengo'}
                </Text>
              </Pressable>
            ) : (
              <Pressable onPress={guardarSemana} style={{ ...botonLleno, flex: 2 }}>
                <Text style={{ color: c.background, fontWeight: '800' }}>{borrador.length ? 'Guardar mi semana' : 'Cerrar'}</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>

      {/* Detalle de una receta */}
      <Modal visible={!!receta} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setReceta(null)}>
        {receta && (
          <View style={{ flex: 1, backgroundColor: c.background }}>
            <ScrollView contentContainerStyle={{ paddingBottom: 60, maxWidth: 640, width: '100%', alignSelf: 'center' }}>
              <View>
                <Image source={receta.foto} style={{ width: '100%', aspectRatio: 4 / 3 }} contentFit="cover" accessibilityIgnoresInvertColors />
                <Pressable onPress={() => setReceta(null)} accessibilityRole="button" accessibilityLabel="Cerrar receta"
                  style={{ position: 'absolute', top: 16, right: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700', lineHeight: 24 }}>×</Text>
                </Pressable>
              </View>
              <View style={{ padding: 20, gap: 16 }}>
                <View>
                  <Titulo color={c.foreground} size={28}>{receta.titulo}</Titulo>
                  <Text style={{ color: c.muted, fontSize: 14, marginTop: 6 }}>
                    {SLOT_LABEL[receta.slot]} · {receta.minutos} min · {receta.porciones} {receta.porciones === 1 ? 'porción' : 'porciones'}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                    {receta.etiquetas.map((e) => (
                      <Text key={e} style={{ color: c.foreground, fontSize: 12.5, fontWeight: '600', backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, overflow: 'hidden' }}>{e}</Text>
                    ))}
                  </View>
                </View>

                <View style={{ gap: 8 }}>
                  <Pressable onPress={() => alPlan(receta)} style={botonLleno}>
                    <Text style={{ color: c.background, fontWeight: '800', textAlign: 'center' }}>
                      {hecho === 'plan' ? `Lista para el ${DIAS[dia].toLowerCase()} ✓` : `Ponerla en ${receta.slot === 'desayuno' || receta.slot === 'almuerzo' ? 'el' : 'la'} ${SLOT_LABEL[receta.slot].toLowerCase()} del ${DIAS[dia].toLowerCase()}`}
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => aCompras(receta)} disabled={hecho === 'compras'} style={botonBorde}>
                    <Text style={{ color: c.primary, fontWeight: '800', textAlign: 'center' }}>
                      {hecho === 'compras' ? 'Ingredientes en tu lista ✓' : 'Agregar ingredientes a compras'}
                    </Text>
                  </Pressable>
                </View>

                <View style={tarjeta}>
                  <Text style={{ color: c.foreground, fontSize: 19, fontWeight: '800', marginBottom: 8 }}>Ingredientes</Text>
                  {receta.ingredientes.map((i) => (
                    <View key={i} style={{ flexDirection: 'row', gap: 10, paddingVertical: 5 }}>
                      <Text style={{ color: c.primary, fontSize: 16, lineHeight: 22 }}>•</Text>
                      <Text style={{ color: c.foreground, fontSize: 16, lineHeight: 22, flex: 1 }}>{i}</Text>
                    </View>
                  ))}
                </View>

                <View style={tarjeta}>
                  <Text style={{ color: c.foreground, fontSize: 19, fontWeight: '800', marginBottom: 8 }}>Preparación</Text>
                  {receta.pasos.map((p, k) => (
                    <View key={k} style={{ flexDirection: 'row', gap: 12, paddingVertical: 8 }}>
                      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: c.background, fontWeight: '800', fontSize: 13 }}>{k + 1}</Text>
                      </View>
                      <Text style={{ color: c.foreground, fontSize: 16, lineHeight: 23, flex: 1 }}>{p}</Text>
                    </View>
                  ))}
                </View>
                <Text style={{ color: c.muted, fontSize: 12 }}>Foto: Pexels.</Text>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>
    </ScreenContainer>
  );
}
