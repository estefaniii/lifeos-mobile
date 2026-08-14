import React, { useEffect, useState } from 'react';
import {
  Modal, View, Text, TextInput, Pressable, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useCreateClient, useUpdateClient, useDeleteClient } from '@/hooks/use-clients';
import type { Client } from '@/lib/supabase';

interface AddClientModalProps {
  visible: boolean;
  onClose: () => void;
  client?: Client | null;
  defaultName?: string;
}

const COLORS = {
  bg: '#09090B', surface: '#18181B', border: '#27272A',
  text: '#FAFAFA', textDim: '#E4E4E7', muted: '#A1A1AA', subtle: '#52525B', primary: '#14B8A6',
};

const SWATCHES = ['#14B8A6', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#EF4444', '#22C55E', '#0EA5E9'];

export function AddClientModal({ visible, onClose, client, defaultName }: AddClientModalProps) {
  const isEdit = !!client;
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const [name, setName] = useState('');
  const [color, setColor] = useState(SWATCHES[0]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName(client?.name ?? defaultName ?? '');
    setColor(client?.color ?? SWATCHES[0]);
    setNotes(client?.notes ?? '');
    setError(null);
    setSaving(false);
  }, [visible, client]);

  const submit = async () => {
    setError(null);
    if (!name.trim()) return setError('Escribe el nombre del cliente.');
    setSaving(true);
    try {
      if (isEdit && client) await updateClient.mutateAsync({ id: client.id, name: name.trim(), color, notes: notes.trim() });
      else await createClient.mutateAsync({ name: name.trim(), color, notes: notes.trim() });
      onClose();
    } catch (e: any) {
      setError(e?.message || 'No se pudo guardar.');
    } finally { setSaving(false); }
  };

  const remove = async () => {
    if (!client) return;
    setSaving(true);
    try { await deleteClient.mutateAsync(client.id); onClose(); }
    catch (e: any) { setError(e?.message || 'No se pudo eliminar.'); setSaving(false); }
  };

  const webNoOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ maxHeight: '90%', backgroundColor: COLORS.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 22, paddingTop: 14, paddingBottom: 24, borderTopWidth: 1, borderColor: COLORS.border }}>
            <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, marginBottom: 12 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.text }}>{isEdit ? 'Editar cliente' : 'Nuevo cliente'}</Text>
              <Pressable onPress={onClose} hitSlop={12}><Text style={{ fontSize: 22, color: COLORS.muted }}>✕</Text></Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 12 }}>
              <Text style={styles.label}>Nombre</Text>
              <TextInput value={name} onChangeText={setName} placeholder="Ej: AutoMed" placeholderTextColor={COLORS.subtle} style={[styles.input, webNoOutline]} />

              <Text style={styles.label}>Color</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                {SWATCHES.map((c) => (
                  <Pressable key={c} onPress={() => setColor(c)} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: c, borderWidth: color === c ? 3 : 0, borderColor: '#fff' }} />
                ))}
              </View>

              <Text style={styles.label}>Notas (opcional)</Text>
              <TextInput value={notes} onChangeText={setNotes} placeholder="Rubro, contacto, tono de marca, contraseñas de acceso…" placeholderTextColor={COLORS.subtle} multiline style={[styles.input, { minHeight: 90, textAlignVertical: 'top' }, webNoOutline]} />

              {error && <View style={styles.alert}><Text style={{ color: '#FCA5A5', fontSize: 13, textAlign: 'center' }}>{error}</Text></View>}

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                {isEdit ? (
                  <Pressable onPress={remove} disabled={saving} style={{ width: 52, backgroundColor: 'rgba(239,68,68,0.10)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.35)', borderRadius: 14, paddingVertical: 14, alignItems: 'center', opacity: saving ? 0.5 : 1 }}>
                    <Text style={{ fontSize: 18 }}>🗑️</Text>
                  </Pressable>
                ) : (
                  <Pressable onPress={onClose} disabled={saving} style={{ flex: 1, backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingVertical: 14, alignItems: 'center', opacity: saving ? 0.5 : 1 }}>
                    <Text style={{ color: COLORS.textDim, fontWeight: '700', fontSize: 14 }}>Cancelar</Text>
                  </Pressable>
                )}
                <Pressable onPress={submit} disabled={saving} style={({ pressed }) => ({ flex: 1.6, backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center', opacity: saving ? 0.6 : pressed ? 0.9 : 1 })}>
                  {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>{isEdit ? 'Guardar' : 'Crear cliente'}</Text>}
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
  label: { color: COLORS.muted, fontSize: 12, fontWeight: '600' as const, marginBottom: 6, marginLeft: 2, textTransform: 'uppercase' as const, letterSpacing: 1 },
  input: { backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, color: COLORS.text, fontSize: 14, marginBottom: 16 },
  alert: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12, backgroundColor: 'rgba(239,68,68,0.10)', borderColor: 'rgba(239,68,68,0.35)' },
};
