import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, TextInput, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { AddNoteModal } from '@/components/modals/add-note-modal';
import { useNotes } from '@/hooks/use-notes';
import { useClients } from '@/hooks/use-clients';
import type { Note } from '@/lib/supabase';

const COLORS = {
  bg: '#09090B', card: '#0F0F12', surface: '#18181B', border: '#27272A',
  text: '#FAFAFA', textDim: '#E4E4E7', muted: '#A1A1AA', subtle: '#52525B', primary: '#14B8A6',
};

export default function NotesScreen() {
  const router = useRouter();
  const { data: notes = [], refetch, isRefetching } = useNotes();
  const { data: clients = [] } = useClients();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [q, setQ] = useState('');
  const [clientFilter, setClientFilter] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const clientNames = useMemo(() => {
    const s = new Set<string>();
    clients.forEach((c) => c.name && s.add(c.name));
    notes.forEach((n) => n.client && s.add(n.client));
    return Array.from(s).sort();
  }, [clients, notes]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return notes.filter((n) => {
      if (showArchived ? !n.archived : n.archived) return false;
      if (clientFilter && n.client !== clientFilter) return false;
      if (term && !n.title.toLowerCase().includes(term) && !(n.content ?? '').toLowerCase().includes(term)) return false;
      return true;
    });
  }, [notes, q, clientFilter, showArchived]);

  const openNew = () => { setEditing(null); setModal(true); };
  const openEdit = (n: Note) => { setEditing(n); setModal(true); };
  const webNoOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null;

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          <Pressable onPress={() => router.push('/')} style={{ marginBottom: 8 }}>
            <Text style={{ color: COLORS.primary, fontSize: 14, fontWeight: '700' }}>‹ Inicio</Text>
          </Pressable>
          <Text style={{ color: COLORS.text, fontSize: 28, fontWeight: '800' }}>Notas</Text>
          <Text style={{ color: COLORS.muted, fontSize: 13, marginTop: 2 }}>Ideas, recordatorios y apuntes rápidos</Text>
        </View>

        {/* Búsqueda */}
        <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="🔍  Buscar en tus notas…"
            placeholderTextColor={COLORS.subtle}
            style={[{ backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, color: COLORS.text, fontSize: 14 }, webNoOutline]}
          />
        </View>

        {/* Filtros */}
        <View style={{ paddingLeft: 20, paddingTop: 10 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20, gap: 8, alignItems: 'center' }}>
            <Chip label="Todas" active={!clientFilter && !showArchived} onPress={() => { setClientFilter(null); setShowArchived(false); }} />
            {clientNames.map((c) => (
              <Chip key={c} label={c} active={clientFilter === c && !showArchived} onPress={() => { setShowArchived(false); setClientFilter(clientFilter === c ? null : c); }} />
            ))}
            <Chip label="🗄️ Archivadas" active={showArchived} onPress={() => { setClientFilter(null); setShowArchived((s) => !s); }} />
          </ScrollView>
        </View>

        <ScrollView
          style={{ flex: 1, marginTop: 14 }}
          contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 140 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />}
        >
          {filtered.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 70, paddingHorizontal: 30 }}>
              <Text style={{ fontSize: 44, marginBottom: 12 }}>📝</Text>
              <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: '700', textAlign: 'center' }}>
                {notes.length ? 'Nada con esa búsqueda' : 'Aún no hay notas'}
              </Text>
              <Text style={{ color: COLORS.muted, fontSize: 13, textAlign: 'center', marginTop: 6, marginBottom: 18 }}>
                {notes.length ? 'Prueba con otras palabras.' : 'Captura una idea con el botón +'}
              </Text>
              {!notes.length && (
                <Pressable onPress={openNew} style={{ backgroundColor: COLORS.primary, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 12 }}>
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>+ Nueva nota</Text>
                </Pressable>
              )}
            </View>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {filtered.map((n) => (
                <View key={n.id} style={{ width: '50%', padding: 6 }}>
                  <Pressable
                    onPress={() => openEdit(n)}
                    style={({ pressed }) => ({
                      backgroundColor: n.color || COLORS.card,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      padding: 14,
                      minHeight: 96,
                      opacity: pressed ? 0.85 : 1,
                    })}
                  >
                    {n.pinned && <Text style={{ position: 'absolute', top: 10, right: 12, fontSize: 12 }}>📌</Text>}
                    <Text style={{ color: COLORS.text, fontSize: 15, fontWeight: '700', marginBottom: 6, paddingRight: n.pinned ? 16 : 0 }} numberOfLines={2}>
                      {n.title}
                    </Text>
                    {!!n.content && (
                      <Text style={{ color: COLORS.muted, fontSize: 12, lineHeight: 17 }} numberOfLines={6}>
                        {n.content}
                      </Text>
                    )}
                    {!!n.client && (
                      <View style={{ alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, backgroundColor: 'rgba(20,184,166,0.15)' }}>
                        <Text style={{ color: COLORS.primary, fontSize: 10, fontWeight: '700' }}>{n.client}</Text>
                      </View>
                    )}
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        <Pressable
          onPress={openNew}
          style={({ pressed }) => ({
            position: 'absolute', right: 20, bottom: 24, width: 60, height: 60, borderRadius: 30,
            backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
            shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <Text style={{ color: '#fff', fontSize: 30, marginTop: -2 }}>+</Text>
        </Pressable>
      </View>

      <AddNoteModal visible={modal} onClose={() => setModal(false)} note={editing} clientSuggestions={clientNames} defaultClient={clientFilter ?? undefined} />
    </ScreenContainer>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, backgroundColor: active ? COLORS.primary : COLORS.surface, borderWidth: 1, borderColor: active ? COLORS.primary : COLORS.border }}
    >
      <Text style={{ color: active ? '#fff' : COLORS.textDim, fontSize: 12, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}
