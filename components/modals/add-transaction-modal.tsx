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
import { useQueryClient } from '@tanstack/react-query';

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  initialType?: 'income' | 'expense';
}

const COLORS = {
  bg: '#09090B',
  card: '#0F0F12',
  surface: '#18181B',
  border: '#27272A',
  text: '#FAFAFA',
  textDim: '#E4E4E7',
  muted: '#A1A1AA',
  subtle: '#52525B',
  primary: '#14B8A6',
  income: '#22C55E',
  expense: '#EF4444',
};

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
          date: new Date().toISOString().split('T')[0],
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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View
            style={{
              maxHeight: '92%',
              backgroundColor: COLORS.surface,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingHorizontal: 22,
              paddingTop: 14,
              paddingBottom: 24,
              borderTopWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            {/* Drag handle */}
            <View
              style={{
                alignSelf: 'center',
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: COLORS.border,
                marginBottom: 12,
              }}
            />

            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.text }}>
                Nueva transacción
              </Text>
              <Pressable onPress={onClose} hitSlop={12}>
                <Text style={{ fontSize: 22, color: COLORS.muted }}>✕</Text>
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 12 }}
            >
              {/* Type segmented control */}
              <View
                style={{
                  flexDirection: 'row',
                  backgroundColor: COLORS.bg,
                  borderRadius: 12,
                  padding: 4,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
              >
                {(['income', 'expense'] as const).map((t) => {
                  const active = type === t;
                  const tint = t === 'income' ? COLORS.income : COLORS.expense;
                  return (
                    <Pressable
                      key={t}
                      onPress={() => setType(t)}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        alignItems: 'center',
                        borderRadius: 10,
                        backgroundColor: active ? tint : 'transparent',
                      }}
                    >
                      <Text
                        style={{
                          color: active ? '#fff' : COLORS.muted,
                          fontWeight: '700',
                          fontSize: 13,
                        }}
                      >
                        {t === 'income' ? '↑ Ingreso' : '↓ Gasto'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Amount */}
              <Text style={styles.label}>Monto</Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: COLORS.bg,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  marginBottom: 16,
                }}
              >
                <Text style={{ color: COLORS.muted, fontSize: 22, marginRight: 6 }}>$</Text>
                <TextInput
                  value={amount}
                  onChangeText={(v) => setAmount(v.replace(/[^\d.,]/g, ''))}
                  placeholder="0.00"
                  placeholderTextColor={COLORS.subtle}
                  keyboardType="decimal-pad"
                  style={[
                    {
                      flex: 1,
                      color: COLORS.text,
                      fontSize: 22,
                      fontWeight: '700',
                      paddingVertical: 14,
                    },
                    Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null,
                  ]}
                />
              </View>

              {/* Category */}
              <Text style={styles.label}>Categoría</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {categories.map((cat) => {
                  const active = category === cat.name;
                  return (
                    <Pressable
                      key={cat.name}
                      onPress={() => setCategory(cat.name)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingHorizontal: 12,
                        paddingVertical: 9,
                        borderRadius: 99,
                        backgroundColor: active ? COLORS.primary : COLORS.bg,
                        borderWidth: 1,
                        borderColor: active ? COLORS.primary : COLORS.border,
                      }}
                    >
                      <Text style={{ fontSize: 13 }}>{cat.icon}</Text>
                      <Text
                        style={{
                          color: active ? '#fff' : COLORS.textDim,
                          fontSize: 12,
                          fontWeight: '600',
                        }}
                      >
                        {cat.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Description */}
              <Text style={styles.label}>Nota (opcional)</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Ej: Almuerzo con cliente"
                placeholderTextColor={COLORS.subtle}
                multiline
                style={[
                  {
                    backgroundColor: COLORS.bg,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    color: COLORS.text,
                    fontSize: 14,
                    minHeight: 64,
                    textAlignVertical: 'top',
                    marginBottom: 16,
                  },
                  Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null,
                ]}
              />

              {/* Error / Success */}
              {error && (
                <View style={[styles.alert, { backgroundColor: 'rgba(239,68,68,0.10)', borderColor: 'rgba(239,68,68,0.35)' }]}>
                  <Text style={{ color: '#FCA5A5', fontSize: 13, textAlign: 'center' }}>{error}</Text>
                </View>
              )}
              {success && (
                <View style={[styles.alert, { backgroundColor: 'rgba(34,197,94,0.10)', borderColor: 'rgba(34,197,94,0.35)' }]}>
                  <Text style={{ color: '#86EFAC', fontSize: 13, textAlign: 'center' }}>
                    ¡Transacción guardada!
                  </Text>
                </View>
              )}

              {/* Actions */}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                <Pressable
                  onPress={onClose}
                  disabled={saving}
                  style={{
                    flex: 1,
                    backgroundColor: COLORS.bg,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    borderRadius: 14,
                    paddingVertical: 14,
                    alignItems: 'center',
                    opacity: saving ? 0.5 : 1,
                  }}
                >
                  <Text style={{ color: COLORS.textDim, fontWeight: '700', fontSize: 14 }}>
                    Cancelar
                  </Text>
                </Pressable>
                <Pressable
                  onPress={submit}
                  disabled={saving}
                  style={({ pressed }) => ({
                    flex: 1.4,
                    backgroundColor: COLORS.primary,
                    borderRadius: 14,
                    paddingVertical: 14,
                    alignItems: 'center',
                    opacity: saving ? 0.6 : pressed ? 0.9 : 1,
                  })}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>
                      Guardar
                    </Text>
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
  label: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '600' as const,
    marginBottom: 6,
    marginLeft: 2,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  alert: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
};
