import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  initialType?: 'income' | 'expense';
}

/**
 * Modal para agregar una nueva transacción
 */
export function AddTransactionModal({ visible, onClose, userId, initialType = 'expense' }: AddTransactionModalProps) {
  const colors = useColors();
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'income' | 'expense'>(initialType);
  const [category, setCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Sincronizar tipo y limpiar campos cada vez que el modal se abre
  useEffect(() => {
    if (visible) {
      setType(initialType);
      setAmount('');
      setDescription('');
      setCategory('');
    }
  }, [visible, initialType]);

  const incomeCategories = [
    { name: 'Sueldo', icon: '💼' },
    { name: 'Emprendimientos', icon: '🚀' },
    { name: 'Dropshipping', icon: '📦' },
    { name: 'Servicios Creativos', icon: '🎨' },
    { name: 'Freelance', icon: '💻' },
    { name: 'Inversiones', icon: '📈' },
    { name: 'Otros', icon: '📌' },
  ];
  const expenseCategories = [
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
  const categories = type === 'income' ? incomeCategories : expenseCategories;

  const handleAddTransaction = async () => {
    if (!amount || !description || !category) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);
    try {
      // Insertar transacción
      const transactionAmount = type === 'income' ? parseFloat(amount) : -parseFloat(amount);

      const { error: insertError } = await supabase.from('transactions').insert([
        {
          user_id: userId,
          amount: transactionAmount,
          note: description,
          category: category,
          type,
          date: new Date().toISOString().split('T')[0],
        },
      ]);
      if (insertError) throw insertError;

      // Refrescar datos
      await queryClient.refetchQueries({ queryKey: ['financial-summary'] });
      await queryClient.refetchQueries({ queryKey: ['transactions'] });

      Alert.alert('Éxito', 'Transacción agregada correctamente');
      setAmount('');
      setDescription('');
      setCategory('');
      onClose();
    } catch (error) {
      console.error('Error agregando transacción:', error);
      Alert.alert('Error', 'No se pudo agregar la transacción');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/50">
        <View className="flex-1 mt-auto bg-background rounded-t-3xl p-6">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-bold text-foreground" style={{ color: '#FAFAFA' }}>Agregar Transacción</Text>
            <Pressable onPress={onClose}>
              <Text className="text-2xl text-muted" style={{ color: '#A1A1AA' }}>✕</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Amount Input */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2" style={{ color: '#FAFAFA' }}>Monto</Text>
              <View className="flex-row items-center bg-surface rounded-lg px-4 py-3">
                <Text className="text-lg text-muted mr-2" style={{ color: '#A1A1AA' }}>$</Text>
                <TextInput
                  className="flex-1 text-lg text-foreground"
                  style={{ color: '#FAFAFA' }}
                  placeholder="0.00"
                  placeholderTextColor={colors.muted}
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>
            </View>

            {/* Type Selector */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2" style={{ color: '#FAFAFA' }}>Tipo</Text>
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => setType('income')}
                  className={`flex-1 py-3 rounded-lg items-center ${type === 'income' ? 'bg-success' : 'bg-surface'
                    }`}
                >
                  <Text
                    className={`font-semibold ${type === 'income' ? 'text-background' : 'text-foreground'
                      }`}
                    style={{ color: '#FAFAFA' }}
                  >
                    Ingreso
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setType('expense')}
                  className={`flex-1 py-3 rounded-lg items-center ${type === 'expense' ? 'bg-error' : 'bg-surface'
                    }`}
                >
                  <Text
                    className={`font-semibold ${type === 'expense' ? 'text-background' : 'text-foreground'
                      }`}
                    style={{ color: '#FAFAFA' }}
                  >
                    Gasto
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Category Selector */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2" style={{ color: '#FAFAFA' }}>Categoría</Text>
              <View className="flex-row flex-wrap gap-2">
                {categories.map((cat) => (
                  <Pressable
                    key={cat.name}
                    onPress={() => setCategory(cat.name)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingHorizontal: 14,
                      paddingVertical: 9,
                      borderRadius: 99,
                      backgroundColor: category === cat.name ? '#14B8A6' : '#27272A',
                    }}
                  >
                    <Text style={{ fontSize: 14 }}>{cat.icon}</Text>
                    <Text style={{ color: category === cat.name ? '#fff' : '#E4E4E7', fontSize: 12, fontWeight: '600' }}>
                      {cat.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Description Input */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-foreground mb-2" style={{ color: '#FAFAFA' }}>Descripción</Text>
              <TextInput
                className="bg-surface rounded-lg px-4 py-3 text-foreground"
                style={{ color: '#FAFAFA' }}
                placeholder="Ej: Pago de sueldo, Compra de materiales"
                placeholderTextColor={colors.muted}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-3 mb-6">
              <Pressable
                onPress={onClose}
                className="flex-1 bg-surface rounded-lg py-3 items-center"
              >
                <Text className="text-foreground font-semibold" style={{ color: '#E4E4E7' }}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={handleAddTransaction}
                disabled={isLoading}
                className={`flex-1 rounded-lg py-3 items-center ${isLoading ? 'bg-primary opacity-50' : 'bg-primary'
                  }`}
              >
                <Text className="text-background font-semibold" style={{ color: '#FAFAFA' }}>
                  {isLoading ? 'Guardando...' : 'Guardar'}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
