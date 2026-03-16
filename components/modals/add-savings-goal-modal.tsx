import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { useCreateSavingsGoal } from '@/hooks/use-savings-goals';

const GOAL_COLORS = [
  { label: 'Teal', value: 'primary' },
  { label: 'Verde', value: 'success' },
  { label: 'Amarillo', value: 'warning' },
  { label: 'Morado', value: 'accent' },
];

interface AddSavingsGoalModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
}

export function AddSavingsGoalModal({ visible, onClose, userId }: AddSavingsGoalModalProps) {
  const colors = useColors();
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
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/50">
        <View className="flex-1 mt-auto bg-background rounded-t-3xl p-6">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-bold text-foreground" style={{ color: '#FAFAFA' }}>Nueva Meta de Ahorro</Text>
            <Pressable onPress={onClose}>
              <Text className="text-2xl text-muted" style={{ color: '#A1A1AA' }}>✕</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2" style={{ color: '#FAFAFA' }}>Nombre de la meta</Text>
              <TextInput
                className="bg-surface rounded-lg px-4 py-3 text-foreground"
                style={{ color: '#FAFAFA' }}
                placeholder="Ej: Vacaciones, Fondo de emergencia"
                placeholderTextColor={colors.muted}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2" style={{ color: '#FAFAFA' }}>Meta total ($)</Text>
              <View className="flex-row items-center bg-surface rounded-lg px-4 py-3">
                <Text className="text-lg text-muted mr-2" style={{ color: '#A1A1AA' }}>$</Text>
                <TextInput
                  className="flex-1 text-lg text-foreground"
                  style={{ color: '#FAFAFA' }}
                  placeholder="0.00"
                  placeholderTextColor={colors.muted}
                  keyboardType="decimal-pad"
                  value={targetAmount}
                  onChangeText={setTargetAmount}
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2" style={{ color: '#FAFAFA' }}>Ya tienes ahorrado ($)</Text>
              <View className="flex-row items-center bg-surface rounded-lg px-4 py-3">
                <Text className="text-lg text-muted mr-2" style={{ color: '#A1A1AA' }}>$</Text>
                <TextInput
                  className="flex-1 text-lg text-foreground"
                  style={{ color: '#FAFAFA' }}
                  placeholder="0.00"
                  placeholderTextColor={colors.muted}
                  keyboardType="decimal-pad"
                  value={currentAmount}
                  onChangeText={setCurrentAmount}
                />
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-sm font-semibold text-foreground mb-2" style={{ color: '#FAFAFA' }}>Color</Text>
              <View className="flex-row gap-2">
                {GOAL_COLORS.map((c) => (
                  <Pressable
                    key={c.value}
                    onPress={() => setSelectedColor(c.value)}
                    className={`flex-1 py-3 rounded-lg items-center border-2 ${
                      selectedColor === c.value ? 'border-primary' : 'border-transparent bg-surface'
                    }`}
                  >
                    <Text className="text-xs font-semibold text-foreground" style={{ color: '#FAFAFA' }}>{c.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View className="flex-row gap-3 mb-6">
              <Pressable onPress={onClose} className="flex-1 bg-surface rounded-lg py-3 items-center">
                <Text className="text-foreground font-semibold" style={{ color: '#E4E4E7' }}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                disabled={createGoal.isPending}
                className={`flex-1 rounded-lg py-3 items-center ${createGoal.isPending ? 'bg-primary opacity-50' : 'bg-primary'}`}
              >
                <Text className="text-background font-semibold" style={{ color: '#FAFAFA' }}>
                  {createGoal.isPending ? 'Guardando...' : 'Guardar'}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
