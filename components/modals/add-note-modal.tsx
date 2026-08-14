import React, { useEffect, useState } from 'react';
import {
  Modal, View, Text, TextInput, Pressable, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useCreateNote, useUpdateNote, useDeleteNote } from '@/hooks/use-notes';
import type { Note } from '@/lib/supabase';

interface AddNoteModalProps {
  visible: boolean;
  onClose: () => void;
  note?: Note | null;
  clientSuggestions?: string[];
  defaultClient?: string;
}

const COLORS = {
  bg: '#09090B', surface: '#18181B', border: '#27272A',
  text: '#FAFAFA', textDim: '#E4E4E7', muted: '#A1A1AA', subtle: '#52525B', primary: '#14B8A6',
};

const SWATCHES = ['#18181B', '#1E3A3A', '#3B2E1E', '#2E1E3B', '#3B1E2E', '#1E293B', '#23331E'];

export function AddNoteModal({ visible, onClose, note, clientSuggestions = [], defaultClient }: AddNoteModalProps) {
  const isEdit = !!note;
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState(SWATCHES[0]);
  const [pinned, setPinned] = useState(false);
  const [client, setClient] = useState('');
  const [archived, setArchived] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setTitle(note?.title ?? '');
    setContent(note?.content ?? '');
    setColor(note?.color ?? SWATCHES[0]);
    setPinned(note?.pinned ?? false);
    setClient(note?.client ?? defaultClient ?? '');
    setArchived(note?.archived ?? false);
    setError(null);
    setSaving(false);
  }, [visible, note, defaultClient]);

  const submit = async () => {
    setError(null);
    if (!title.trim() && !content.trim()) return setError('Escribe un título o algo de contenido.');
    setSaving(true);
    try {
      const payload = { title: title.trim() || 'Sin título', content: content.trim(), color, pinned, client: client.trim(), archived };
      if (isEdit && note) await updateNote.mutateAsync({ id: note.id, ...payload });
      else await createNote.mutateAsync(payload);
      onClose();
    } catch (e: any) {
      setError(e?.message || 'No se pudo guardar.');
    } finally { setSaving(false); }
  };

  const remove = async () => {
    if (!note) return;
    setSaving(true);
    try { await deleteNote.mutateAsync(note.id); onClose(); }
    catch (e: any) { setError(e?.message || 'No se pudo eliminar.'); setSaving(false); }
  };

  const webNoOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null;
  const uniqueClients = Array.from(new Set(clientSuggestions.filter(Boolean))).slice(0, 8);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ maxHeight: '92%', backgroundColor: COLORS.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 22, paddingTop: 14, paddingBottom: 24, borderTopWidth: 1, borderColor: COLORS.border }}>
            <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, marginBottom: 12 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.text }}>{isEdit ? 'Editar nota' : 'Nueva nota'}</Text>
              <Pressable onPress={() => setPinned((p) => !p)} hitSlop={10} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99, backgroundColor: pinned ? COLORS.primary : COLORS.bg, borderWidth: 1, borderColor: pinned ? COLORS.primary : COLORS.border }}>
                <Text style={{ color: pinned ? '#fff' : COLORS.muted, fontSize: 12, fontWeight: '700' }}>📌 {pinned ? 'Fijada' : 'Fijar'}</Text>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 12 }}>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Título"
                placeholderTextColor={COLORS.subtle}
                style={[{ backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, color: COLORS.text, fontSize: 16, fontWeight: '700', marginBottom: 12 }, webNoOutline]}
              />
              <TextInput
                value={content}
                onChangeText={setContent}
                placeholder="Escribe tu nota…"
                placeholderTextColor={COLORS.subtle}
                multiline
                style={[{ backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, color: COLORS.text, fontSize: 14, minHeight: 160, textAlignVertical: 'top', marginBottom: 16, lineHeight: 20 }, webNoOutline]}
              />

              <Text style={styles.label}>Color</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                {SWATCHES.map((c) => (
                  <Pressable key={c} onPress={() => setColor(c)} style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: c, borderWidth: color === c ? 2 : 1, borderColor: color === c ? COLORS.primary : COLORS.border }} />
                ))}
              </View>

              <Text style={styles.label}>Cliente (opcional)</Text>
              <TextInput
                value={client}
                onChangeText={setClient}
                placeholder="Vincular a un cliente"
                placeholderTextColor={COLORS.subtle}
                style={[{ backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, color: COLORS.text, fontSize: 14, marginBottom: uniqueClients.length ? 8 : 16 }, webNoOutline]}
              />
              {uniqueClients.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                  {uniqueClients.map((c) => (
                    <Pressable key={c} onPress={() => setClient(c === client ? '' : c)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99, backgroundColor: c === client ? COLORS.primary : COLORS.bg, borderWidth: 1, borderColor: c === client ? COLORS.primary : COLORS.border }}>
                      <Text style={{ color: c === client ? '#fff' : COLORS.muted, fontSize: 11, fontWeight: '600' }}>{c}</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {isEdit && (
                <Pressable onPress={() => setArchived((a) => !a)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16 }}>
                  <Text style={{ color: COLORS.textDim, fontSize: 14, fontWeight: '600' }}>🗄️ Archivada</Text>
                  <View style={{ width: 44, height: 26, borderRadius: 13, backgroundColor: archived ? COLORS.primary : COLORS.border, justifyContent: 'center', paddingHorizontal: 3 }}>
                    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', alignSelf: archived ? 'flex-end' : 'flex-start' }} />
                  </View>
                </Pressable>
              )}

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
                  {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>{isEdit ? 'Guardar' : 'Crear nota'}</Text>}
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
  alert: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12, backgroundColor: 'rgba(239,68,68,0.10)', borderColor: 'rgba(239,68,68,0.35)' },
};
