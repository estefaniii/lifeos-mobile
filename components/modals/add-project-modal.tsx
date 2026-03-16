import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, Pressable, Alert } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { useCreateProject } from '@/hooks/use-productivity';

interface AddProjectModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
}

export function AddProjectModal({ visible, onClose, userId }: AddProjectModalProps) {
  const colors = useColors();
  const createProject = useCreateProject();
  const [name, setName] = useState('');

  useEffect(() => {
    if (visible) setName('');
  }, [visible]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre del proyecto es obligatorio');
      return;
    }
    try {
      await createProject.mutateAsync({ name: name.trim(), userId });
      setName('');
      onClose();
    } catch {
      Alert.alert('Error', 'No se pudo crear el proyecto');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/50">
        <View className="mt-auto bg-background rounded-t-3xl p-6">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-bold text-foreground" style={{ color: '#FAFAFA' }}>Nuevo Proyecto</Text>
            <Pressable onPress={onClose}>
              <Text className="text-2xl text-muted" style={{ color: '#A1A1AA' }}>✕</Text>
            </Pressable>
          </View>

          <View className="mb-6">
            <Text className="text-sm font-semibold text-foreground mb-2" style={{ color: '#FAFAFA' }}>Nombre del proyecto</Text>
            <TextInput
              className="bg-surface rounded-lg px-4 py-3 text-foreground"
              style={{ color: '#FAFAFA' }}
              placeholder="Ej: Dropshipping, Diseño gráfico, Universidad"
              placeholderTextColor={colors.muted}
              value={name}
              onChangeText={setName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
          </View>

          <View className="flex-row gap-3 mb-4">
            <Pressable onPress={onClose} className="flex-1 bg-surface rounded-lg py-3 items-center">
              <Text className="text-foreground font-semibold" style={{ color: '#E4E4E7' }}>Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={createProject.isPending}
              className={`flex-1 rounded-lg py-3 items-center ${createProject.isPending ? 'bg-primary opacity-50' : 'bg-primary'}`}
            >
              <Text className="text-background font-semibold" style={{ color: '#FAFAFA' }}>
                {createProject.isPending ? 'Creando...' : 'Crear Proyecto'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
