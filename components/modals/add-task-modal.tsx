import React, { useEffect, useState } from 'react';
import {
  Modal, View, Text, TextInput, Pressable, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/use-tasks';
import type { Task, TaskPriority } from '@/lib/supabase';

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  task?: Task | null;
  defaultClient?: string;
  clientSuggestions?: string[];
}

const COLORS = {
  bg: '#09090B', surface: '#18181B', border: '#27272A',
  text: '#FAFAFA', textDim: '#E4E4E7', muted: '#A1A1AA', subtle: '#52525B', primary: '#14B8A6',
};

const PRIORITIES: { key: TaskPriority; label: string; color: string }[] = [
  { key: 'baja', label: 'Baja', color: '#3B82F6' },
  { key: 'media', label: 'Media', color: '#F59E0B' },
  { key: 'alta', label: 'Alta', color: '#EF4444' },
];

const todayISO = () => new Date().toISOString().split('T')[0];
const shiftISO = (d: number) => { const x = new Date(); x.setDate(x.getDate() + d); return x.toISOString().split('T')[0]; };

export function AddTaskModal({ visible, onClose, task, defaultClient, clientSuggestions = [] }: AddTaskModalProps) {
  const isEdit = !!task;
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [title, setTitle] = useState('');
  const [client, setClient] = useState('');
  const [dueDate, setDueDate] = useState<string>('');
  const [priority, setPriority] = useState<TaskPriority>('media');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setTitle(task?.title ?? '');
    setClient(task?.client ?? defaultClient ?? '');
    setDueDate(task?.due_date ?? '');
    setPriority(task?.priority ?? 'media');
    setNotes(task?.notes ?? '');
    setError(null);
    setSaving(false);
  }, [visible, task, defaultClient]);

  const submit = async () => {
    setError(null);
    if (!title.trim()) return setError('Escribe la tarea.');
    if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate.trim()))
      return setError('La fecha debe ser AAAA-MM-DD (o déjala vacía).');
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        client: client.trim(),
        due_date: dueDate.trim() || null,
        priority,
        notes: notes.trim(),
      };
      if (isEdit && task) await updateTask.mutateAsync({ id: task.id, ...payload });
      else await createTask.mutateAsync(payload);
      onClose();
    } catch (e: any) {
      setError(e?.message || 'No se pudo guardar.');
    } finally { setSaving(false); }
  };

  const remove = async () => {
    if (!task) return;
    setSaving(true);
    try { await deleteTask.mutateAsync(task.id); onClose(); }
    catch (e: any) { setError(e?.message || 'No se pudo eliminar.'); setSaving(false); }
  };

  const webNoOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null;
  const clients = Array.from(new Set(clientSuggestions.filter(Boolean))).slice(0, 8);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ maxHeight: '92%', backgroundColor: COLORS.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 22, paddingTop: 14, paddingBottom: 24, borderTopWidth: 1, borderColor: COLORS.border }}>
            <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, marginBottom: 12 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.text }}>{isEdit ? 'Editar tarea' : 'Nueva tarea'}</Text>
              <Pressable onPress={onClose} hitSlop={12}><Text style={{ fontSize: 22, color: COLORS.muted }}>✕</Text></Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 12 }}>
              <Text style={styles.label}>Tarea</Text>
              <TextInput value={title} onChangeText={setTitle} placeholder="Ej: Diseñar carrusel de AutoMed" placeholderTextColor={COLORS.subtle} style={[styles.input, webNoOutline]} />

              <Text style={styles.label}>Cliente (opcional)</Text>
              <TextInput value={client} onChangeText={setClient} placeholder="Ej: AutoMed" placeholderTextColor={COLORS.subtle} style={[styles.input, webNoOutline]} />
              {clients.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                  {clients.map((c) => (
                    <Pressable key={c} onPress={() => setClient(c)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99, backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border }}>
                      <Text style={{ color: COLORS.muted, fontSize: 11, fontWeight: '600' }}>{c}</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              <Text style={styles.label}>Fecha límite (opcional)</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                {[{ label: 'Hoy', v: todayISO() }, { label: 'Mañana', v: shiftISO(1) }, { label: '+7 días', v: shiftISO(7) }, { label: 'Sin fecha', v: '' }].map((q) => {
                  const active = dueDate === q.v;
                  return (
                    <Pressable key={q.label} onPress={() => setDueDate(q.v)} style={{ paddingHorizontal: 11, paddingVertical: 7, borderRadius: 99, backgroundColor: active ? COLORS.primary : COLORS.bg, borderWidth: 1, borderColor: active ? COLORS.primary : COLORS.border }}>
                      <Text style={{ color: active ? '#fff' : COLORS.textDim, fontSize: 11, fontWeight: '600' }}>{q.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <TextInput value={dueDate} onChangeText={setDueDate} placeholder="AAAA-MM-DD" placeholderTextColor={COLORS.subtle} autoCapitalize="none" style={[styles.input, webNoOutline]} />

              <Text style={styles.label}>Prioridad</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                {PRIORITIES.map((p) => {
                  const active = priority === p.key;
                  return (
                    <Pressable key={p.key} onPress={() => setPriority(p.key)} style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: active ? p.color : COLORS.bg, borderWidth: 1, borderColor: active ? p.color : COLORS.border }}>
                      <Text style={{ color: active ? '#fff' : COLORS.textDim, fontSize: 13, fontWeight: '700' }}>{p.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.label}>Notas (opcional)</Text>
              <TextInput value={notes} onChangeText={setNotes} placeholder="Detalles, links, contexto…" placeholderTextColor={COLORS.subtle} multiline style={[styles.input, { minHeight: 64, textAlignVertical: 'top' }, webNoOutline]} />

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
                  {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>{isEdit ? 'Guardar cambios' : 'Agregar tarea'}</Text>}
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
