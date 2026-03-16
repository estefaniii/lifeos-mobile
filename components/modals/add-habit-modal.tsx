import React, { useState } from 'react';
import { Modal, View, Text, Pressable, TextInput, ScrollView } from 'react-native';

const EMOJI_OPTIONS = ['📖', '💊', '🧴', '🏃', '💤', '🥗', '🧘', '✍️', '🎯', '💡', '🎶', '🧹', '📵', '🌅', '🥤', '🍎'];
const COLOR_OPTIONS = ['#14B8A6', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#10B981', '#F97316'];

export function AddHabitModal({ visible, onClose, onSave }: {
  visible: boolean;
  onClose: () => void;
  onSave: (data: { name: string; emoji: string; color: string }) => void;
}) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('📖');
  const [color, setColor] = useState('#14B8A6');

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), emoji, color });
    setName('');
    setEmoji('📖');
    setColor('#14B8A6');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#18181B', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24 }}>
          <Text style={{ color: '#FAFAFA', fontSize: 18, fontWeight: '800', marginBottom: 4 }}>
            Nuevo Hábito
          </Text>
          <Text style={{ color: '#71717A', fontSize: 11, marginBottom: 20, textTransform: 'uppercase', letterSpacing: 2, fontWeight: '700' }}>
            Crea un hábito diario
          </Text>

          {/* Name input */}
          <View style={{
            backgroundColor: '#27272A',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#3F3F46',
            paddingHorizontal: 16,
            marginBottom: 16,
          }}>
            <TextInput
              style={{ color: '#FAFAFA', fontSize: 16, paddingVertical: 14 }}
              placeholder="Ej: Leer 20 min, Skincare, Vitaminas..."
              placeholderTextColor="#52525B"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Emoji picker */}
          <Text style={{ color: '#A1A1AA', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Ícono
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {EMOJI_OPTIONS.map((e) => (
                <Pressable
                  key={e}
                  onPress={() => setEmoji(e)}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: emoji === e ? 'rgba(20,184,166,0.2)' : '#27272A',
                    borderWidth: 2,
                    borderColor: emoji === e ? '#14B8A6' : 'transparent',
                  }}
                >
                  <Text style={{ fontSize: 22 }}>{e}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          {/* Color picker */}
          <Text style={{ color: '#A1A1AA', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Color
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
            {COLOR_OPTIONS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: c,
                  borderWidth: 3,
                  borderColor: color === c ? '#FAFAFA' : 'transparent',
                }}
              />
            ))}
          </View>

          {/* Buttons */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              onPress={onClose}
              style={{ flex: 1, backgroundColor: '#27272A', borderRadius: 16, paddingVertical: 14, alignItems: 'center' }}
            >
              <Text style={{ color: '#A1A1AA', fontWeight: '700', fontSize: 13 }}>Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              style={{
                flex: 2,
                backgroundColor: name.trim() ? '#14B8A6' : 'rgba(20,184,166,0.3)',
                borderRadius: 16,
                paddingVertical: 14,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#FAFAFA', fontWeight: '800', fontSize: 13 }}>
                Crear Hábito
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
