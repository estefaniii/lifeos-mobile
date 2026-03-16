import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

interface AddProductivityModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  projects: Array<{ id: string; name: string }>;
}

/**
 * Modal para registrar tiempo de trabajo en un proyecto
 */
export function AddProductivityModal({
  visible,
  onClose,
  userId,
  projects,
}: AddProductivityModalProps) {
  const colors = useColors();
  const queryClient = useQueryClient();

  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [durationMinutes, setDurationMinutes] = useState('');
  const [activity, setActivity] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setSelectedProject(null);
      setDurationMinutes('');
      setActivity('');
    }
  }, [visible]);

  const handleAddProductivity = async () => {
    if (!selectedProject || !durationMinutes) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);
    try {
      const { error: insertError } = await supabase.from('productivity_logs').insert([
        {
          user_id: userId,
          project_id: selectedProject,
          duration_minutes: parseInt(durationMinutes),
          note: activity || 'Trabajo',
          date: new Date().toISOString().split('T')[0],
        },
      ]);
      if (insertError) throw insertError;

      // Refrescar datos
      await queryClient.refetchQueries({ queryKey: ['today-productivity'] });
      await queryClient.refetchQueries({ queryKey: ['productivity-by-project'] });

      Alert.alert('Éxito', 'Tiempo registrado correctamente');
      setSelectedProject(null);
      setDurationMinutes('');
      setActivity('');
      onClose();
    } catch (error) {
      console.error('Error registrando tiempo:', error);
      Alert.alert('Error', 'No se pudo registrar el tiempo');
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
            <Text className="text-2xl font-bold text-foreground" style={{ color: '#FAFAFA' }}>Registrar Tiempo</Text>
            <Pressable onPress={onClose}>
              <Text className="text-2xl text-muted" style={{ color: '#A1A1AA' }}>✕</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Project Selector */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2" style={{ color: '#FAFAFA' }}>Proyecto</Text>
              <View className="flex-row flex-wrap gap-2">
                {projects.map((project) => (
                  <Pressable
                    key={project.id}
                    onPress={() => setSelectedProject(project.id)}
                    className={`px-4 py-2 rounded-full ${
                      selectedProject === project.id ? 'bg-primary' : 'bg-surface'
                    }`}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        selectedProject === project.id ? 'text-background' : 'text-foreground'
                      }`}
                      style={{ color: '#FAFAFA' }}
                    >
                      {project.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Duration Input */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2" style={{ color: '#FAFAFA' }}>Duración (minutos)</Text>
              <View className="flex-row items-center bg-surface rounded-lg px-4 py-3">
                <TextInput
                  className="flex-1 text-lg text-foreground"
                  style={{ color: '#FAFAFA' }}
                  placeholder="30"
                  placeholderTextColor={colors.muted}
                  keyboardType="number-pad"
                  value={durationMinutes}
                  onChangeText={setDurationMinutes}
                />
                <Text className="text-lg text-muted ml-2" style={{ color: '#A1A1AA' }}>min</Text>
              </View>
            </View>

            {/* Activity Input */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-foreground mb-2" style={{ color: '#FAFAFA' }}>Actividad (opcional)</Text>
              <TextInput
                className="bg-surface rounded-lg px-4 py-3 text-foreground"
                style={{ color: '#FAFAFA' }}
                placeholder="Ej: Desarrollo, Diseño, Reunión"
                placeholderTextColor={colors.muted}
                value={activity}
                onChangeText={setActivity}
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
                onPress={handleAddProductivity}
                disabled={isLoading}
                className={`flex-1 rounded-lg py-3 items-center ${
                  isLoading ? 'bg-primary opacity-50' : 'bg-primary'
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
