import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { fechaLocal } from '@/lib/registros';
import { Titulo, TINTA, acentoTexto, RADIO } from '@/components/decor';
import { useQueryClient } from '@tanstack/react-query';
import { ACENTOS } from '@/constants/tabs';

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  initialType?: 'income' | 'expense';
}

const COLORS = {
  bg: TINTA.fondo,
  onAccent: TINTA.sobreAcento,
  card: TINTA.tarjeta,
  alto: TINTA.elevada,
  border: TINTA.borde,
  text: TINTA.texto,
  muted: TINTA.suave,
  primary: ACENTOS.finanzas,
  income: ACENTOS.finanzas,
  expense: ACENTOS.ejercicio,
};

const webSinBorde = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null;

const INCOME_CATEGORIES = [
  { name: 'Sueldo', icon: '💼' },
  { name: 'Emprendimientos', icon: '🚀' },
  { name: 'Dropshipping', icon: '📦' },
  { name: 'Servicios Creativos', icon: '🎨' },
  { name: 'Freelance', icon: '💻' },
  { name: 'Inversiones', icon: '📈' },
  { name: 'Otros', icon: '📌' },
];

const EXPENSE_CATEGORIES = [
  { name: 'Materiales', icon: '🛠' },
  { name: 'Salidas', icon: '🎉' },
  { name: 'Universidad', icon: '🎓' },
  { name: 'Compras Online', icon: '🛒' },
  { name: 'Comida', icon: '🍔' },
  { name: 'Transporte', icon: '🚗' },
  { name: 'Suscripciones', icon: '📱' },
  { name: 'Salud', icon: '💊' },
  { name: 'Otros', icon: '📌' },
];

export function AddTransactionModal({
  visible,
  onClose,
  userId,
  initialType = 'expense',
}: AddTransactionModalProps) {
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'income' | 'expense'>(initialType);
  const [category, setCategory] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setType(initialType);
    setAmount('');
    setDescription('');
    setCategory('');
    setError(null);
    setSuccess(false);
    setSaving(false);
  }, [visible, initialType]);

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const submit = async () => {
    setError(null);

    const normalized = amount.replace(',', '.').trim();
    const numericAmount = Number(normalized);
    if (!normalized || Number.isNaN(numericAmount) || numericAmount <= 0) {
      return setError('Ingresa un monto válido mayor a 0.');
    }
    if (!category) return setError('Selecciona una categoría.');
    if (!userId) return setError('Sesión no válida. Vuelve a iniciar sesión.');

    const note = description.trim();
    const transactionAmount =
      type === 'income' ? Math.abs(numericAmount) : -Math.abs(numericAmount);

    setSaving(true);
    try {
      const { error: insertError } = await supabase.from('transactions').insert([
        {
          user_id: userId,
          amount: transactionAmount,
          note: note || null,
          category,
          type,
          date: fechaLocal(),
        },
      ]);
      if (insertError) throw insertError;

      // Refresh queries (don't block UX on this)
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-by-category'] });

      setSuccess(true);
      // Brief success state then close
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err: any) {
      setError(err?.message || 'No se pudo agregar la transacción.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flex: 1, backgroundColor: TINTA.overlay, justifyContent: 'flex-end' }}>
          <View style={styles.hoja}>
            <View style={styles.asa} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <Titulo size={24} style={{ flex: 1 }}>{type === 'income' ? 'Nuevo ingreso' : 'Nuevo gasto'}</Titulo>
              <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Cerrar" style={styles.cerrar}>
                <Text style={{ fontSize: 18, color: COLORS.muted }}>✕</Text>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 8 }}>
              {/* Tipo */}
              <View style={{ flexDirection: 'row', backgroundColor: COLORS.bg, borderRadius: 18, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border }}>
                {(['expense', 'income'] as const).map((t) => {
                  const active = type === t;
                  const tint = t === 'income' ? COLORS.income : COLORS.expense;
                  return (
                    <Pressable
                      key={t}
                      onPress={() => setType(t)}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: active }}
                      style={{ flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: active ? tint : 'transparent' }}
                    >
                      <Text style={{ color: active ? COLORS.onAccent : COLORS.text, fontWeight: '800', fontSize: 14 }}>
                        {t === 'income' ? 'Ingreso' : 'Gasto'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Monto */}
              <Text style={styles.label}>Monto</Text>
              <View style={[styles.campo, { flexDirection: 'row', alignItems: 'center', marginBottom: 16 }]}>
                <Text style={{ color: COLORS.muted, fontSize: 24, fontWeight: '700', marginRight: 6 }}>$</Text>
                <TextInput
                  value={amount}
                  onChangeText={(v) => setAmount(v.replace(/[^\d.,]/g, ''))}
                  placeholder="0.00"
                  placeholderTextColor={COLORS.muted}
                  keyboardType="decimal-pad"
                  style={[{ flex: 1, color: COLORS.text, fontSize: 24, fontWeight: '800', paddingVertical: 12 }, webSinBorde]}
                />
              </View>

              {/* Categoría */}
              <Text style={styles.label}>Categoría</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {categories.map((cat) => {
                  const active = category === cat.name;
                  return (
                    <Pressable
                      key={cat.name}
                      onPress={() => setCategory(cat.name)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      style={{
                        flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 14, borderRadius: 99,
                        backgroundColor: active ? COLORS.primary : COLORS.alto, borderWidth: 1, borderColor: active ? COLORS.primary : COLORS.border,
                      }}
                    >
                      <Text style={{ fontSize: 15 }}>{cat.icon}</Text>
                      <Text style={{ color: active ? COLORS.onAccent : COLORS.text, fontSize: 14, fontWeight: '700' }}>{cat.name}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Nota */}
              <Text style={styles.label}>Nota (opcional)</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Ej: almuerzo con Ana"
                placeholderTextColor={COLORS.muted}
                multiline
                style={[styles.campo, { paddingVertical: 14, color: COLORS.text, fontSize: 15, minHeight: 72, textAlignVertical: 'top', marginBottom: 16 }, webSinBorde]}
              />

              {error && (
                <View style={[styles.alert, { backgroundColor: 'rgba(255,122,107,0.10)', borderColor: 'rgba(255,122,107,0.40)' }]}>
                  <Text style={{ color: acentoTexto(COLORS.expense), fontSize: 14, textAlign: 'center' }}>{error}</Text>
                </View>
              )}
              {success && (
                <View style={[styles.alert, { backgroundColor: 'rgba(95,211,168,0.10)', borderColor: 'rgba(95,211,168,0.40)' }]}>
                  <Text style={{ color: acentoTexto(COLORS.income), fontSize: 14, textAlign: 'center' }}>¡Guardado!</Text>
                </View>
              )}

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                <Pressable
                  onPress={onClose}
                  disabled={saving}
                  accessibilityRole="button"
                  style={[styles.boton, { flex: 1, borderWidth: 1, borderColor: COLORS.border, opacity: saving ? 0.5 : 1 }]}
                >
                  <Text style={{ color: COLORS.text, fontWeight: '800', fontSize: 15 }}>Cancelar</Text>
                </Pressable>
                <Pressable
                  onPress={submit}
                  disabled={saving}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.boton, { flex: 2, backgroundColor: COLORS.primary, opacity: saving ? 0.6 : pressed ? 0.85 : 1 }]}
                >
                  {saving ? (
                    <ActivityIndicator color={COLORS.onAccent} />
                  ) : (
                    <Text style={{ color: COLORS.onAccent, fontWeight: '800', fontSize: 15 }}>Guardar</Text>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = {
  hoja: {
    maxHeight: '92%' as const, width: '100%' as const, maxWidth: 640, alignSelf: 'center' as const,
    backgroundColor: COLORS.card, borderTopLeftRadius: RADIO.hoja, borderTopRightRadius: RADIO.hoja,
    borderWidth: 1, borderBottomWidth: 0, borderColor: COLORS.border,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28,
  },
  asa: { alignSelf: 'center' as const, width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, marginBottom: 14 },
  cerrar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.alto, alignItems: 'center' as const, justifyContent: 'center' as const },
  label: { color: COLORS.muted, fontSize: 14, marginBottom: 8, marginLeft: 2 },
  campo: { backgroundColor: COLORS.alto, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, paddingHorizontal: 16 },
  boton: { minHeight: 52, borderRadius: 18, alignItems: 'center' as const, justifyContent: 'center' as const },
  alert: { borderWidth: 1, borderRadius: 16, padding: 12, marginBottom: 12 },
};
