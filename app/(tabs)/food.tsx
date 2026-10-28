import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View, Pressable, TextInput, Modal } from 'react-native';
import { Image } from 'expo-image';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { DIAS, SLOTS, SLOT_LABEL, type Slot } from '@/constants/comida';
import { RECETAS, type Receta } from '@/constants/recetas';
import { useMealPlan, useSaveMeal, filasSugeridas, useShopping, useShoppingActions } from '@/hooks/use-vida';

// Comida: plan semanal editable, recetas con foto y lista de compras.
const VISTAS = [['semana', 'Semana'], ['recetas', 'Recetas'], ['compras', 'Compras']] as const;
type Vista = (typeof VISTAS)[number][0];

export default function FoodScreen() {
  const c = useColors();
  const hoy = (new Date().getDay() + 6) % 7;   // 0 = lunes
  const [dia, setDia] = useState(hoy);
  const [editando, setEditando] = useState<Slot | null>(null);
  const [texto, setTexto] = useState('');
  const [nuevo, setNuevo] = useState('');
  const [vista, setVista] = useState<Vista>('semana');
  const [filtro, setFiltro] = useState<Slot | null>(null);
  const [receta, setReceta] = useState<Receta | null>(null);
  const [hecho, setHecho] = useState<'' | 'compras' | 'plan'>('');
  const { data: plan = [], error, isLoading } = useMealPlan();
  const guardar = useSaveMeal();
  const { data: compras = [] } = useShopping();
  const { add, addMany, toggle, clearDone } = useShoppingActions();

  const delDia = useMemo(() => Object.fromEntries(plan.filter((r) => r.day === dia).map((r) => [r.slot, r.meal])), [plan, dia]);
  const vacio = !isLoading && plan.length === 0;

  const editar = (slot: Slot) => { setEditando(slot); setTexto(delDia[slot] ?? '') };
  const confirmar = () => { if (editando) guardar.mutate([{ day: dia, slot: editando, meal: texto.trim() }]); setEditando(null) };
  const recetas = filtro ? RECETAS.filter((r) => r.slot === filtro) : RECETAS;
  const recetaDe = (meal?: string) => RECETAS.find((r) => r.titulo === meal);
  const abrir = (r: Receta) => { setReceta(r); setHecho('') };
  const aCompras = (r: Receta) => { addMany.mutate(r.ingredientes); setHecho('compras') };
  const alPlan = (r: Receta) => { guardar.mutate([{ day: dia, slot: r.slot, meal: r.titulo }]); setHecho('plan') };
  const agregar = () => { if (nuevo.trim()) add.mutate(nuevo.trim()); setNuevo('') };

  const tarjeta = { backgroundColor: c.surface, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: c.border } as const;
  const chip = (on: boolean) => ({ minHeight: 44, paddingHorizontal: 16, borderRadius: 22, justifyContent: 'center' as const,
    backgroundColor: on ? c.primary : c.surface, borderWidth: 1, borderColor: on ? c.primary : c.border });
  const campo = { color: c.foreground, borderWidth: 1.5, borderColor: c.border, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, flex: 1 } as const;

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
        <View style={{ paddingHorizontal: 20, paddingTop: 24, maxWidth: 640, width: '100%', alignSelf: 'center', gap: 16 }}>
          <View>
            <Text style={{ color: c.foreground, fontSize: 30, fontWeight: '800' }}>Comida</Text>
            <Text style={{ color: c.muted, fontSize: 14, marginTop: 4 }}>Tu plan de la semana, recetas y lo que hay que comprar.</Text>
          </View>

          {/* Secciones */}
          <View style={{ flexDirection: 'row', backgroundColor: c.surface, borderRadius: 22, padding: 4, borderWidth: 1, borderColor: c.border }}>
            {VISTAS.map(([v, nombre]) => (
              <Pressable key={v} onPress={() => setVista(v)} accessibilityRole="tab" accessibilityState={{ selected: vista === v }}
                style={{ flex: 1, minHeight: 44, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: vista === v ? c.primary : 'transparent' }}>
                <Text style={{ color: vista === v ? c.background : c.foreground, fontWeight: '700' }}>{nombre}</Text>
              </Pressable>
            ))}
          </View>

          {error && <Text style={{ color: c.warning, fontSize: 13 }}>Aún no puedo guardar tu plan: falta crear la tabla de comidas en la base de datos.</Text>}

          {vista === 'semana' && <>
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
          <View style={tarjeta}>
            <Text style={{ color: c.foreground, fontSize: 19, fontWeight: '800', marginBottom: 8 }}>{DIAS[dia]}</Text>
            {vacio && (
              <Pressable onPress={() => guardar.mutate(filasSugeridas())} style={{ backgroundColor: c.primary, borderRadius: 18, padding: 14, marginBottom: 10 }}>
                <Text style={{ color: c.background, fontWeight: '800' }}>Empezar con el plan sugerido</Text>
                <Text style={{ color: c.background, opacity: 0.8, fontSize: 13 }}>Lo copio a tu plan y luego lo cambias a tu gusto.</Text>
              </Pressable>
            )}
            {SLOTS.map((slot) => (
              <View key={slot} style={{ paddingVertical: 12, borderTopWidth: 1, borderTopColor: c.border }}>
                <Text style={{ color: c.muted, fontSize: 12.5, fontWeight: '700', marginBottom: 4 }}>{SLOT_LABEL[slot]}</Text>
                {editando === slot ? (
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TextInput value={texto} onChangeText={setTexto} autoFocus onSubmitEditing={confirmar} placeholder="¿Qué vas a comer?"
                      placeholderTextColor={c.muted} style={campo} />
                    <Pressable onPress={confirmar} style={{ minWidth: 72, borderRadius: 16, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: c.background, fontWeight: '800' }}>Listo</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable onPress={() => editar(slot)} accessibilityRole="button" accessibilityHint="Editar" style={{ minHeight: 32, justifyContent: 'center' }}>
                    <Text style={{ color: delDia[slot] ? c.foreground : c.muted, fontSize: 16 }}>{delDia[slot] || 'Toca para escribir'}</Text>
                  </Pressable>
                )}
                {editando !== slot && recetaDe(delDia[slot]) && (
                  <Pressable onPress={() => abrir(recetaDe(delDia[slot])!)} style={{ minHeight: 36, justifyContent: 'center', alignSelf: 'flex-start' }}>
                    <Text style={{ color: c.primary, fontWeight: '700', fontSize: 13.5 }}>Ver receta</Text>
                  </Pressable>
                )}
              </View>
            ))}
          </View>

          </>}

          {vista === 'recetas' && <>
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
              <Pressable onPress={agregar} accessibilityLabel="Agregar" style={{ width: 52, borderRadius: 16, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: c.background, fontSize: 24, fontWeight: '800' }}>+</Text>
              </Pressable>
            </View>
            {compras.length === 0 && <Text style={{ color: c.muted, paddingVertical: 8 }}>Tu lista está vacía.</Text>}
            {compras.map((x) => (
              <Pressable key={x.id} onPress={() => toggle.mutate(x)} accessibilityRole="checkbox" accessibilityState={{ checked: x.done }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 }}>
                <View style={{ width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: x.done ? c.primary : c.muted,
                  backgroundColor: x.done ? c.primary : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                  {x.done && <Text style={{ color: c.background, fontWeight: '900', fontSize: 14 }}>✓</Text>}
                </View>
                <Text style={{ color: x.done ? c.muted : c.foreground, fontSize: 16, textDecorationLine: x.done ? 'line-through' : 'none', flex: 1 }}>{x.name}</Text>
              </Pressable>
            ))}
          </View>
          </>}
        </View>
      </ScrollView>

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
                  <Text style={{ color: c.foreground, fontSize: 26, fontWeight: '800' }}>{receta.titulo}</Text>
                  <Text style={{ color: c.muted, fontSize: 14, marginTop: 4 }}>
                    {SLOT_LABEL[receta.slot]} · {receta.minutos} min · {receta.porciones} {receta.porciones === 1 ? 'porción' : 'porciones'}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                    {receta.etiquetas.map((e) => (
                      <Text key={e} style={{ color: c.foreground, fontSize: 12.5, fontWeight: '600', backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, overflow: 'hidden' }}>{e}</Text>
                    ))}
                  </View>
                </View>

                <View style={{ gap: 8 }}>
                  <Pressable onPress={() => alPlan(receta)} style={{ backgroundColor: c.primary, borderRadius: 18, minHeight: 50, paddingHorizontal: 16, justifyContent: 'center' }}>
                    <Text style={{ color: c.background, fontWeight: '800', textAlign: 'center' }}>
                      {hecho === 'plan' ? `Lista para el ${DIAS[dia].toLowerCase()} ✓` : `Ponerla en ${receta.slot === 'desayuno' || receta.slot === 'almuerzo' ? 'el' : 'la'} ${SLOT_LABEL[receta.slot].toLowerCase()} del ${DIAS[dia].toLowerCase()}`}
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => aCompras(receta)} disabled={hecho === 'compras'}
                    style={{ borderRadius: 18, minHeight: 50, paddingHorizontal: 16, justifyContent: 'center', borderWidth: 1.5, borderColor: c.primary }}>
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
