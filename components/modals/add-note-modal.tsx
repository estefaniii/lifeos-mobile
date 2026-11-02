import React, { useEffect, useState } from 'react';
import {
  Modal, View, Text, TextInput, Pressable, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useCreateNote, useUpdateNote, useDeleteNote } from '@/hooks/use-notes';
import type { Note } from '@/lib/supabase';
import { fechaLocal } from '@/lib/registros';
import { Titulo, TINTA } from '@/components/decor';

interface AddNoteModalProps {
  visible: boolean;
  onClose: () => void;
  note?: Note | null;
  clientSuggestions?: string[];
  defaultClient?: string;
}

const COLORS = {
  bg: TINTA.fondo, card: TINTA.tarjeta, alto: '#2A2521', border: TINTA.borde,
  text: TINTA.texto, muted: TINTA.suave, primary: '#8FB8FF', danger: '#FF7A6B',
};

// Fondos de nota: tonos oscuros cálidos para que el texto claro siempre se lea.
// El primero es el de la tarjeta; '#18181B' era el gris de antes y se trata igual.
export const SWATCHES = ['#1A1714', '#1F3330', '#3A2E1C', '#2D2440', '#3A1F2A', '#1E2A3D', '#2A3320'];
export const fondoNota = (c?: string | null) => (!c || c === '#18181B' ? SWATCHES[0] : c);
const todayISO = () => fechaLocal();
const shiftISO = (d: number) => { const x = new Date(); x.setDate(x.getDate() + d); return fechaLocal(x); };

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
  const [remindAt, setRemindAt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setTitle(note?.title ?? '');
    setContent(note?.content ?? '');
    setColor(fondoNota(note?.color));
    setPinned(note?.pinned ?? false);
    setClient(note?.client ?? defaultClient ?? '');
    setArchived(note?.archived ?? false);
    setRemindAt(note?.remind_at ?? '');
    setError(null);
    setSaving(false);
  }, [visible, note, defaultClient]);

  const submit = async () => {
    setError(null);
    if (!title.trim() && !content.trim()) return setError('Escribe un título o algo de contenido.');
    if (remindAt && !/^\d{4}-\d{2}-\d{2}$/.test(remindAt.trim())) return setError('El recordatorio debe ser AAAA-MM-DD (o vacío).');
    setSaving(true);
    try {
      const payload = { title: title.trim() || 'Sin título', content: content.trim(), color, pinned, client: client.trim(), archived, remind_at: remindAt.trim() || null };
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
        <View style={{ flex: 1, backgroundColor: 'rgba(8,6,5,0.72)', justifyContent: 'flex-end' }}>
          <View style={{ maxHeight: '92%', width: '100%', maxWidth: 640, alignSelf: 'center', backgroundColor: COLORS.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28, borderWidth: 1, borderBottomWidth: 0, borderColor: COLORS.border }}>
            <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, marginBottom: 14 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Titulo size={24} style={{ flex: 1 }}>{isEdit ? 'Editar nota' : 'Nueva nota'}</Titulo>
              <Pressable
                onPress={() => setPinned((p) => !p)}
                accessibilityRole="switch"
                accessibilityState={{ checked: pinned }}
                style={{ minHeight: 44, paddingHorizontal: 14, borderRadius: 99, justifyContent: 'center', backgroundColor: pinned ? COLORS.primary : COLORS.alto, borderWidth: 1, borderColor: pinned ? COLORS.primary : COLORS.border }}
              >
                <Text style={{ color: pinned ? COLORS.bg : COLORS.text, fontSize: 14, fontWeight: '700' }}>📌 {pinned ? 'Fijada' : 'Fijar'}</Text>
              </Pressable>
              <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Cerrar"
                style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.alto, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 18, color: COLORS.muted }}>✕</Text>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 8 }}>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Título"
                placeholderTextColor={COLORS.muted}
                style={[styles.campo, { paddingVertical: 14, fontSize: 17, fontWeight: '800', marginBottom: 12 }, webNoOutline]}
              />
              <TextInput
                value={content}
                onChangeText={setContent}
                placeholder="Escribe tu nota…"
                placeholderTextColor={COLORS.muted}
                multiline
                style={[styles.campo, { backgroundColor: color, paddingVertical: 14, fontSize: 15, minHeight: 160, textAlignVertical: 'top', marginBottom: 16, lineHeight: 22 }, webNoOutline]}
              />

              <Text style={styles.label}>Color</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                {SWATCHES.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setColor(c)}
                    accessibilityRole="button"
                    accessibilityLabel="Color de la nota"
                    accessibilityState={{ selected: color === c }}
                    style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: c, borderWidth: color === c ? 2 : 1, borderColor: color === c ? COLORS.text : COLORS.border }}
                  />
                ))}
              </View>

              <Text style={styles.label}>Recordatorio (opcional)</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                {[{ label: 'Hoy', v: todayISO() }, { label: 'Mañana', v: shiftISO(1) }, { label: 'En 7 días', v: shiftISO(7) }, { label: 'Quitar', v: '' }].map((q) => {
                  const active = remindAt === q.v;
                  return (
                    <Pressable
                      key={q.label}
                      onPress={() => setRemindAt(q.v)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      style={{ minHeight: 44, paddingHorizontal: 14, borderRadius: 99, justifyContent: 'center', backgroundColor: active ? COLORS.primary : COLORS.alto, borderWidth: 1, borderColor: active ? COLORS.primary : COLORS.border }}
                    >
                      <Text style={{ color: active ? COLORS.bg : COLORS.text, fontSize: 14, fontWeight: '700' }}>{q.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <TextInput value={remindAt} onChangeText={setRemindAt} placeholder="AAAA-MM-DD" placeholderTextColor={COLORS.muted} autoCapitalize="none" style={[styles.campo, { minHeight: 52, fontSize: 15, marginBottom: 16 }, webNoOutline]} />

              {isEdit && (
                <Pressable
                  onPress={() => setArchived((a) => !a)}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: archived }}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 56, backgroundColor: COLORS.alto, borderWidth: 1, borderColor: COLORS.border, borderRadius: 18, paddingHorizontal: 16, marginBottom: 16 }}
                >
                  <Text style={{ color: COLORS.text, fontSize: 15, fontWeight: '700' }}>Archivada</Text>
                  <View style={{ width: 48, height: 28, borderRadius: 14, backgroundColor: archived ? COLORS.primary : COLORS.border, justifyContent: 'center', paddingHorizontal: 3 }}>
                    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.text, alignSelf: archived ? 'flex-end' : 'flex-start' }} />
                  </View>
                </Pressable>
              )}

              {error && <View style={styles.alert}><Text style={{ color: COLORS.danger, fontSize: 14, textAlign: 'center' }}>{error}</Text></View>}

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                {isEdit ? (
                  <Pressable
                    onPress={remove}
                    disabled={saving}
                    accessibilityRole="button"
                    accessibilityLabel="Eliminar nota"
                    style={{ width: 52, minHeight: 52, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,122,107,0.45)', alignItems: 'center', justifyContent: 'center', opacity: saving ? 0.5 : 1 }}
                  >
                    <Text style={{ fontSize: 18 }}>🗑️</Text>
                  </Pressable>
                ) : (
                  <Pressable onPress={onClose} disabled={saving} accessibilityRole="button" style={{ flex: 1, minHeight: 52, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', opacity: saving ? 0.5 : 1 }}>
                    <Text style={{ color: COLORS.text, fontWeight: '800', fontSize: 15 }}>Cancelar</Text>
                  </Pressable>
                )}
                <Pressable onPress={submit} disabled={saving} accessibilityRole="button" style={({ pressed }) => ({ flex: 2, minHeight: 52, backgroundColor: COLORS.primary, borderRadius: 18, alignItems: 'center', justifyContent: 'center', opacity: saving ? 0.6 : pressed ? 0.85 : 1 })}>
                  {saving ? <ActivityIndicator color={COLORS.bg} /> : <Text style={{ color: COLORS.bg, fontWeight: '800', fontSize: 15 }}>{isEdit ? 'Guardar' : 'Crear nota'}</Text>}
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
  label: { color: COLORS.muted, fontSize: 14, marginBottom: 8, marginLeft: 2 },
  campo: { backgroundColor: COLORS.alto, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, paddingHorizontal: 16, color: COLORS.text },
  alert: { borderWidth: 1, borderRadius: 16, padding: 12, marginBottom: 12, backgroundColor: 'rgba(255,122,107,0.10)', borderColor: 'rgba(255,122,107,0.40)' },
};
