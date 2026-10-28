import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View, Pressable, TextInput } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { DIAS, SLOTS, SLOT_LABEL, type Slot } from '@/constants/comida';
import { useMealPlan, useSaveMeal, filasSugeridas, useShopping, useShoppingActions } from '@/hooks/use-vida';

// Comida: plan semanal editable y lista de compras.
export default function FoodScreen() {
  const c = useColors();
  const hoy = (new Date().getDay() + 6) % 7;   // 0 = lunes
  const [dia, setDia] = useState(hoy);
  const [editando, setEditando] = useState<Slot | null>(null);
  const [texto, setTexto] = useState('');
  const [nuevo, setNuevo] = useState('');
  const { data: plan = [], error, isLoading } = useMealPlan();
  const guardar = useSaveMeal();
  const { data: compras = [] } = useShopping();
  const { add, toggle, clearDone } = useShoppingActions();

  const delDia = useMemo(() => Object.fromEntries(plan.filter((r) => r.day === dia).map((r) => [r.slot, r.meal])), [plan, dia]);
  const vacio = !isLoading && plan.length === 0;

  const editar = (slot: Slot) => { setEditando(slot); setTexto(delDia[slot] ?? '') };
  const confirmar = () => { if (editando) guardar.mutate([{ day: dia, slot: editando, meal: texto.trim() }]); setEditando(null) };
  const agregar = () => { if (nuevo.trim()) add.mutate(nuevo.trim()); setNuevo('') };

  const tarjeta = { backgroundColor: c.surface, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: c.border } as const;
  const campo = { color: c.foreground, borderWidth: 1.5, borderColor: c.border, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, flex: 1 } as const;

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
        <View style={{ paddingHorizontal: 20, paddingTop: 24, maxWidth: 640, width: '100%', alignSelf: 'center', gap: 16 }}>
          <View>
            <Text style={{ color: c.foreground, fontSize: 30, fontWeight: '800' }}>Comida</Text>
            <Text style={{ color: c.muted, fontSize: 14, marginTop: 4 }}>Tu plan de la semana y lo que hay que comprar.</Text>
          </View>

          {error && <Text style={{ color: c.warning, fontSize: 13 }}>Aún no puedo guardar tu plan: falta crear la tabla de comidas en la base de datos.</Text>}

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
              </View>
            ))}
          </View>

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
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
