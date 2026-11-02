import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, Pressable, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Titulo, TINTA, RADIO } from '@/components/decor';
import { useCreateSavingsGoal } from '@/hooks/use-savings-goals';
import { ACENTOS } from '@/constants/tabs';

// La meta guarda la clave; Finanzas la traduce a estos mismos colores
const GOAL_COLORS = [
  { label: 'Menta', value: 'primary', hex: ACENTOS.finanzas },
  { label: 'Verde', value: 'success', hex: ACENTOS.comida },
  { label: 'Ámbar', value: 'warning', hex: ACENTOS.inicio },
  { label: 'Lila', value: 'accent', hex: ACENTOS.historial },
];

const MENTA = ACENTOS.finanzas;
const ALTO = TINTA.elevada;
const webSinBorde = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null;
const campo = { backgroundColor: ALTO, borderWidth: 1, borderColor: TINTA.borde, borderRadius: 16, paddingHorizontal: 16, minHeight: 52 };
const etiqueta = { color: TINTA.suave, fontSize: 14, marginBottom: 8, marginLeft: 2 };

interface AddSavingsGoalModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
}

export function AddSavingsGoalModal({ visible, onClose, userId }: AddSavingsGoalModalProps) {
  const createGoal = useCreateSavingsGoal();

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [selectedColor, setSelectedColor] = useState('primary');

  useEffect(() => {
    if (visible) {
      setName('');
      setTargetAmount('');
      setCurrentAmount('');
      setSelectedColor('primary');
    }
  }, [visible]);

  const handleSave = async () => {
    if (!name.trim() || !targetAmount) {
      Alert.alert('Error', 'El nombre y la meta son obligatorios');
      return;
    }
    try {
      await createGoal.mutateAsync({
        name: name.trim(),
        target_amount: parseFloat(targetAmount),
        current_amount: parseFloat(currentAmount || '0'),
        color: selectedColor,
        user_id: userId,
      });
      setName('');
      setTargetAmount('');
      setCurrentAmount('');
      setSelectedColor('primary');
      onClose();
    } catch {
      Alert.alert('Error', 'No se pudo guardar la meta. Asegúrate de que la tabla savings_goals existe en Supabase.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flex: 1, backgroundColor: TINTA.overlay, justifyContent: 'flex-end' }}>
          <View style={{ maxHeight: '92%', width: '100%', maxWidth: 640, alignSelf: 'center', backgroundColor: TINTA.tarjeta, borderTopLeftRadius: RADIO.hoja, borderTopRightRadius: RADIO.hoja, borderWidth: 1, borderBottomWidth: 0, borderColor: TINTA.borde, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 }}>
            <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: TINTA.borde, marginBottom: 14 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <Titulo size={24} style={{ flex: 1 }}>Nueva meta de ahorro</Titulo>
              <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Cerrar"
                style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: ALTO, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 18, color: TINTA.suave }}>✕</Text>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={etiqueta}>Nombre de la meta</Text>
              <TextInput
                style={[campo, { color: TINTA.texto, fontSize: 15, marginBottom: 16 }, webSinBorde]}
                placeholder="Ej: vacaciones, fondo de emergencia"
                placeholderTextColor={TINTA.suave}
                value={name}
                onChangeText={setName}
              />

              <Text style={etiqueta}>Cuánto quieres juntar</Text>
              <View style={[campo, { flexDirection: 'row', alignItems: 'center', marginBottom: 16 }]}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: TINTA.suave, marginRight: 6 }}>$</Text>
                <TextInput
                  style={[{ flex: 1, fontSize: 20, fontWeight: '800', color: TINTA.texto, paddingVertical: 12 }, webSinBorde]}
                  placeholder="0.00"
                  placeholderTextColor={TINTA.suave}
                  keyboardType="decimal-pad"
                  value={targetAmount}
                  onChangeText={setTargetAmount}
                />
              </View>

              <Text style={etiqueta}>Lo que ya tienes ahorrado</Text>
              <View style={[campo, { flexDirection: 'row', alignItems: 'center', marginBottom: 16 }]}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: TINTA.suave, marginRight: 6 }}>$</Text>
                <TextInput
                  style={[{ flex: 1, fontSize: 20, fontWeight: '800', color: TINTA.texto, paddingVertical: 12 }, webSinBorde]}
                  placeholder="0.00"
                  placeholderTextColor={TINTA.suave}
                  keyboardType="decimal-pad"
                  value={currentAmount}
                  onChangeText={setCurrentAmount}
                />
              </View>

              <Text style={etiqueta}>Color</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {GOAL_COLORS.map((c) => {
                  const activo = selectedColor === c.value;
                  return (
                    <Pressable
                      key={c.value}
                      onPress={() => setSelectedColor(c.value)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: activo }}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, paddingHorizontal: 14, borderRadius: 99, backgroundColor: ALTO, borderWidth: 1.5, borderColor: activo ? TINTA.texto : TINTA.borde }}
                    >
                      <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: c.hex }} />
                      <Text style={{ fontSize: 14, fontWeight: '700', color: activo ? TINTA.texto : TINTA.suave }}>{c.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable onPress={onClose} accessibilityRole="button"
                  style={{ flex: 1, minHeight: 52, borderRadius: 18, borderWidth: 1, borderColor: TINTA.borde, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: TINTA.texto, fontWeight: '800', fontSize: 15 }}>Cancelar</Text>
                </Pressable>
                <Pressable
                  onPress={handleSave}
                  disabled={createGoal.isPending}
                  accessibilityRole="button"
                  style={({ pressed }) => ({ flex: 2, minHeight: 52, borderRadius: 18, backgroundColor: MENTA, alignItems: 'center', justifyContent: 'center', opacity: createGoal.isPending ? 0.5 : pressed ? 0.85 : 1 })}
                >
                  <Text style={{ color: TINTA.sobreAcento, fontWeight: '800', fontSize: 15 }}>
                    {createGoal.isPending ? 'Guardando…' : 'Guardar meta'}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
