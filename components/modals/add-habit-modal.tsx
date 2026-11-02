import React, { useState } from 'react';
import { Modal, View, Text, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Titulo, TINTA, RADIO } from '@/components/decor';
import { ACENTOS } from '@/constants/tabs';

const EMOJI_OPTIONS = ['📖', '💊', '🧴', '🏃', '💤', '🥗', '🧘', '✍️', '🎯', '💡', '🎶', '🧹', '📵', '🌅', '🥤', '🍎'];
// Los acentos de la app: ámbar, lima, coral, cielo, lila, menta, rosa y amarillo
const COLOR_OPTIONS = [ACENTOS.inicio, ACENTOS.comida, ACENTOS.ejercicio, ACENTOS.agua, ACENTOS.historial, ACENTOS.finanzas, ACENTOS.hobbies, '#FFD966'];
const ACENTO = ACENTOS.inicio;
const ELEVADO = TINTA.elevada;

export function AddHabitModal({ visible, onClose, onSave }: {
  visible: boolean;
  onClose: () => void;
  onSave: (data: { name: string; emoji: string; color: string }) => void;
}) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('📖');
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const listo = !!name.trim();

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), emoji, color });
    setName('');
    setEmoji('📖');
    setColor(COLOR_OPTIONS[0]);
    onClose();
  };

  const etiqueta = { color: TINTA.suave, fontSize: 14, fontWeight: '700' as const, marginBottom: 10 };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ flex: 1, backgroundColor: TINTA.overlay, justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: TINTA.tarjeta, borderTopLeftRadius: RADIO.hoja, borderTopRightRadius: RADIO.hoja, borderWidth: 1, borderBottomWidth: 0, borderColor: TINTA.borde, padding: 24, paddingBottom: 32 }}>
            <View style={{ maxWidth: 640, width: '100%', alignSelf: 'center' }}>
              <Titulo size={24}>Nuevo hábito</Titulo>
              <Text style={{ color: TINTA.suave, fontSize: 14, marginTop: 4, marginBottom: 20 }}>
                Algo que quieras hacer cada día.
              </Text>

              <TextInput
                style={{
                  backgroundColor: ELEVADO,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: TINTA.borde,
                  paddingHorizontal: 16,
                  minHeight: 52,
                  color: TINTA.texto,
                  fontSize: 16,
                  marginBottom: 20,
                }}
                placeholder="Ej.: leer 20 min, skincare, vitaminas…"
                placeholderTextColor={TINTA.suave}
                value={name}
                onChangeText={setName}
                onSubmitEditing={handleSave}
                accessibilityLabel="Nombre del hábito"
              />

              <Text style={etiqueta}>Ícono</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {EMOJI_OPTIONS.map((e) => (
                    <Pressable
                      key={e}
                      onPress={() => setEmoji(e)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: emoji === e }}
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: ELEVADO,
                        borderWidth: 2,
                        borderColor: emoji === e ? color : 'transparent',
                      }}
                    >
                      <Text style={{ fontSize: 22 }}>{e}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              <Text style={etiqueta}>Color</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
                {COLOR_OPTIONS.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setColor(c)}
                    accessibilityRole="radio"
                    accessibilityLabel={`Color ${c}`}
                    accessibilityState={{ selected: color === c }}
                    style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <View style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      backgroundColor: c,
                      borderWidth: 3,
                      borderColor: color === c ? TINTA.texto : 'transparent',
                    }} />
                  </Pressable>
                ))}
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable
                  onPress={onClose}
                  accessibilityRole="button"
                  style={{ flex: 1, minHeight: 52, borderRadius: 26, borderWidth: 1, borderColor: TINTA.borde, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ color: TINTA.texto, fontWeight: '700', fontSize: 15 }}>Cancelar</Text>
                </Pressable>
                <Pressable
                  onPress={handleSave}
                  disabled={!listo}
                  accessibilityRole="button"
                  style={{
                    flex: 2,
                    minHeight: 52,
                    borderRadius: 26,
                    backgroundColor: ACENTO,
                    opacity: listo ? 1 : 0.45,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: TINTA.sobreAcento, fontWeight: '800', fontSize: 15 }}>Crear hábito</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
