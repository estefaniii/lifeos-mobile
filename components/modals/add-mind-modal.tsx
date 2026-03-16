import React, { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { useAddMindWellnessEntry } from '@/hooks/use-mind-wellness';

interface AddMindModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  type: 'affirmation' | 'stress' | 'meditation' | 'journal';
}

/**
 * Modal para agregar datos de mente y bienestar
 */
export function AddMindModal({ visible, onClose, userId, type }: AddMindModalProps) {
  const colors = useColors();
  const queryClient = useQueryClient();
  const addEntry = useAddMindWellnessEntry();

  const [value, setValue] = useState('');
  const [stressLevel, setStressLevel] = useState('5');
  const [isLoading, setIsLoading] = useState(false);

  const handleAdd = async () => {
    if (!value && type !== 'stress') {
      Alert.alert('Error', 'Por favor completa el campo');
      return;
    }

    setIsLoading(true);
    try {
      if (type === 'affirmation') {
        const { error } = await supabase.from('affirmations').insert([
          {
            user_id: userId,
            text: value,
            created_at: new Date().toISOString(),
            date: new Date().toISOString().split('T')[0],
            is_active: true
          },
        ]);
        if (error) throw error;
        await queryClient.refetchQueries({ queryKey: ['daily-affirmation'] });
        await queryClient.refetchQueries({ queryKey: ['affirmation-history'] });
      } else {
        // Usar el nuevo hook para stress, meditation y journal
        await addEntry.mutateAsync({
          userId,
          type,
          value: type === 'meditation' ? parseInt(value) : undefined,
          stressLevel: type === 'stress' ? parseInt(stressLevel) : undefined,
          note: type === 'journal' ? value : undefined,
        });
      }

      const messages: Record<string, string> = {
        affirmation: 'Afirmación creada correctamente',
        stress: 'Nivel de estrés registrado',
        meditation: 'Sesión de meditación registrada',
        journal: 'Entrada de diario guardada',
      };

      Alert.alert('Éxito', messages[type]);
      setValue('');
      setStressLevel('5');
      onClose();
    } catch (error) {
      console.error(`Error agregando ${type}:`, error);
      Alert.alert('Error', `No se pudo registrar el ${type}`);
    } finally {
      setIsLoading(false);
    }
  };

  const titles: Record<string, string> = {
    affirmation: 'Nueva Afirmación',
    stress: 'Estado de Ánimo',
    meditation: 'Sesión de Calma',
    journal: 'Tu Diario Intimo',
  };

  const placeholders: Record<string, string> = {
    affirmation: 'Ej: "Vivo en la abundancia infinita ahora"',
    stress: '',
    meditation: '¿Cuántos minutos meditaste?',
    journal: '¿Cómo te sientes hoy? ¿Qué quieres manifestar?',
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-background rounded-t-[40px] p-8 shadow-2xl border-t border-white/10" style={{ maxHeight: '90%' }}>
          {/* Handle bar for visual cue */}
          <View className="w-12 h-1.5 bg-muted/30 rounded-full self-center mb-8" />
          
          {/* Header */}
          <View className="flex-row justify-between items-center mb-8">
            <View>
              <Text className="text-3xl font-bold text-foreground" style={{ color: '#FAFAFA' }}>{titles[type]}</Text>
              <Text className="text-sm text-muted" style={{ color: '#A1A1AA' }}>Completa tu registro diario</Text>
            </View>
            <Pressable 
              onPress={onClose}
              className="w-10 h-10 rounded-full bg-surface items-center justify-center active:bg-muted/10 transition-colors"
            >
              <Text className="text-xl text-foreground font-medium" style={{ color: '#FAFAFA' }}>✕</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {type === 'affirmation' && (
              <View className="mb-8">
                <Text className="text-sm font-bold text-primary mb-3 uppercase tracking-widest">Texto de Asunción</Text>
                <TextInput
                  className="bg-surface rounded-3xl px-6 py-6 text-foreground text-lg shadow-inner"
                  style={{ color: '#FAFAFA' }}
                  placeholder={placeholders[type]}
                  placeholderTextColor={colors.muted}
                  value={value}
                  onChangeText={setValue}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                <View className="bg-primary/5 rounded-2xl p-4 mt-4 border border-primary/10">
                  <Text className="text-xs text-primary leading-relaxed font-medium">
                    ✨ Tip: Escribe en tiempo presente y siente la emoción de que ya es un hecho.
                  </Text>
                </View>
              </View>
            )}

            {type === 'journal' && (
              <View className="mb-8">
                <Text className="text-sm font-bold text-primary mb-3 uppercase tracking-widest">Reflexión</Text>
                <TextInput
                  className="bg-surface rounded-3xl px-6 py-6 text-foreground text-lg shadow-inner"
                  style={{ color: '#FAFAFA' }}
                  placeholder={placeholders[type]}
                  placeholderTextColor={colors.muted}
                  value={value}
                  onChangeText={setValue}
                  multiline
                  numberOfLines={8}
                  textAlignVertical="top"
                />
              </View>
            )}

            {type === 'stress' && (
              <View className="mb-8">
                <Text className="text-sm font-bold text-primary mb-6 uppercase tracking-widest">
                  ¿Cómo está tu nivel de paz? ({stressLevel}/10)
                </Text>
                <View className="flex-row flex-wrap justify-between gap-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                    <Pressable
                      key={level}
                      onPress={() => setStressLevel(level.toString())}
                      className={`w-[18%] aspect-square rounded-2xl items-center justify-center border-2 ${
                        parseInt(stressLevel) === level 
                          ? 'bg-primary border-primary shadow-lg shadow-primary/30' 
                          : 'bg-surface border-transparent'
                      }`}
                    >
                      <Text
                        className={`text-lg font-black ${
                          parseInt(stressLevel) === level ? 'text-background' : 'text-foreground/70'
                        }`}
                        style={{ color: '#FAFAFA' }}
                      >
                        {level}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <View className="flex-row justify-between mt-4 px-2">
                  <Text className="text-xs text-muted font-bold" style={{ color: '#A1A1AA' }}>PAZ TOTAL</Text>
                  <Text className="text-xs text-muted font-bold" style={{ color: '#A1A1AA' }}>ESTRÉS ALTO</Text>
                </View>
              </View>
            )}

            {type === 'meditation' && (
              <View className="mb-8">
                <Text className="text-sm font-bold text-primary mb-3 uppercase tracking-widest">Tiempo de Presencia</Text>
                <View className="flex-row items-center bg-surface rounded-3xl px-6 py-5 shadow-inner">
                  <TextInput
                    className="flex-1 text-2xl font-bold text-foreground"
                    style={{ color: '#FAFAFA' }}
                    placeholder="20"
                    placeholderTextColor={colors.muted}
                    keyboardType="number-pad"
                    value={value}
                    onChangeText={setValue}
                    autoFocus
                  />
                  <Text className="text-xl text-muted font-bold" style={{ color: '#A1A1AA' }}>min</Text>
                </View>
                <View className="flex-row gap-2 mt-4">
                  {[10, 20, 30, 45].map((mins) => (
                    <Pressable 
                      key={mins}
                      onPress={() => setValue(mins.toString())}
                      className="flex-1 bg-surface py-3 rounded-xl items-center border border-white/5 active:bg-primary/10"
                    >
                      <Text className="text-foreground/70 font-bold" style={{ color: '#D4D4D8' }}>{mins}m</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View className="flex-row gap-4">
              <Pressable
                onPress={onClose}
                className="flex-1 bg-surface rounded-3xl py-5 items-center border border-white/5"
              >
                <Text className="text-foreground font-bold text-lg" style={{ color: '#E4E4E7' }}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={handleAdd}
                disabled={isLoading}
                className={`flex-1 rounded-3xl py-5 items-center shadow-xl ${
                  isLoading ? 'bg-primary/50' : 'bg-primary shadow-primary/30'
                }`}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-background font-black text-lg" style={{ color: '#FAFAFA' }}>GUARDAR</Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

