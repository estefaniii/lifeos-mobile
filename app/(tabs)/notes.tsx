import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, TextInput, Platform } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { AddNoteModal, fondoNota } from '@/components/modals/add-note-modal';
import { Titulo, Sticker, TINTA, RADIO } from '@/components/decor';
import { FadeInView } from '@/components/fade-in-view';
import { useNotes } from '@/hooks/use-notes';
import type { Note } from '@/lib/supabase';
import { fechaLocal } from '@/lib/registros';
import { ACENTOS } from '@/constants/tabs';

// Notas: un solo acento (azul) para crear y filtrar.
const AZUL = ACENTOS.notas;
const ALTO = TINTA.elevada;
const todayISO = fechaLocal();

export default function NotesScreen() {
  const { data: notes = [], refetch, isRefetching } = useNotes();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [q, setQ] = useState('');
  const [clientFilter, setClientFilter] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const clientNames: string[] = [];

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
    <ScreenContainer className="p-0">
      <View style={{ flex: 1, backgroundColor: TINTA.fondo }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 150 }}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={AZUL} />}
        >
          <View style={{ paddingHorizontal: 20, paddingTop: 24, maxWidth: 640, width: '100%', alignSelf: 'center', gap: 16 }}>
            {/* Cabecera: deja libre la esquina del botón de menú */}
            <View style={{ paddingRight: 110, gap: 6 }}>
              <Titulo>Notas</Titulo>
              <Text style={{ color: TINTA.suave, fontSize: 15 }}>Ideas, recordatorios y apuntes rápidos.</Text>
            </View>

            {/* Búsqueda */}
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Buscar en tus notas…"
              placeholderTextColor={TINTA.suave}
              accessibilityLabel="Buscar en tus notas"
              style={[{ backgroundColor: TINTA.tarjeta, borderWidth: 1, borderColor: TINTA.borde, borderRadius: 18, paddingHorizontal: 16, minHeight: 50, color: TINTA.texto, fontSize: 15 }, webNoOutline]}
            />

            {/* Filtros */}
            <View style={{ flexDirection: 'row', backgroundColor: TINTA.tarjeta, borderRadius: 22, padding: 4, borderWidth: 1, borderColor: TINTA.borde }}>
              <Filtro label="Todas" active={!clientFilter && !showArchived} onPress={() => { setClientFilter(null); setShowArchived(false); }} />
              <Filtro label="Archivadas" active={showArchived} onPress={() => { setClientFilter(null); setShowArchived((s) => !s); }} />
            </View>

            {filtered.length === 0 ? (
              <View style={{ backgroundColor: TINTA.tarjeta, borderRadius: RADIO.tarjeta, borderWidth: 1, borderColor: TINTA.borde, alignItems: 'center', paddingVertical: 36, paddingHorizontal: 24, marginTop: 8 }}>
                <Sticker texto={notes.length ? 'nada por aquí' : 'hoja en blanco'} color={AZUL} giro={-5} style={{ position: 'absolute', top: -14, left: 20 }} />
                <Titulo size={22} style={{ textAlign: 'center' }}>
                  {notes.length ? 'Nada con esa búsqueda' : 'Aún no hay notas'}
                </Titulo>
                <Text style={{ color: TINTA.suave, fontSize: 15, textAlign: 'center', marginTop: 8 }}>
                  {notes.length ? 'Prueba con otras palabras.' : 'Apunta la primera idea que tengas en la cabeza.'}
                </Text>
                {!notes.length && (
                  <Pressable onPress={openNew} accessibilityRole="button"
                    style={({ pressed }) => ({ backgroundColor: AZUL, borderRadius: 18, minHeight: 52, paddingHorizontal: 24, justifyContent: 'center', marginTop: 20, opacity: pressed ? 0.85 : 1 })}>
                    <Text style={{ color: TINTA.sobreAcento, fontWeight: '800', fontSize: 15 }}>Escribir una nota</Text>
                  </Pressable>
                )}
              </View>
            ) : (
              <FadeInView style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 }}>
                {filtered.map((n) => {
                  const vence = !!n.remind_at && n.remind_at <= todayISO;
                  return (
                    <View key={n.id} style={{ width: '50%', padding: 5 }}>
                      <Pressable
                        onPress={() => openEdit(n)}
                        accessibilityRole="button"
                        style={({ pressed }) => ({
                          backgroundColor: fondoNota(n.color),
                          borderRadius: 24,
                          borderWidth: 1,
                          borderColor: TINTA.borde,
                          padding: 16,
                          minHeight: 120,
                          opacity: pressed ? 0.85 : 1,
                        })}
                      >
                        {n.pinned && <Text style={{ position: 'absolute', top: 12, right: 12, fontSize: 14 }} accessibilityLabel="Fijada">📌</Text>}
                        <Text style={{ color: TINTA.texto, fontSize: 16, fontWeight: '800', lineHeight: 21, marginBottom: 6, paddingRight: n.pinned ? 20 : 0 }} numberOfLines={2}>
                          {n.title}
                        </Text>
                        {!!n.content && (
                          <Text style={{ color: TINTA.suave, fontSize: 14, lineHeight: 20 }} numberOfLines={6}>
                            {n.content}
                          </Text>
                        )}
                        {(!!n.remind_at || !!n.client) && (
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                            {!!n.remind_at && (
                              <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, backgroundColor: vence ? AZUL : ALTO }}>
                                <Text style={{ color: vence ? TINTA.sobreAcento : TINTA.suave, fontSize: 12, fontWeight: '700' }}>⏰ {n.remind_at.slice(5)}</Text>
                              </View>
                            )}
                            {!!n.client && (
                              <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, backgroundColor: ALTO }}>
                                <Text style={{ color: TINTA.suave, fontSize: 12, fontWeight: '700' }}>{n.client}</Text>
                              </View>
                            )}
                          </View>
                        )}
                      </Pressable>
                    </View>
                  );
                })}
              </FadeInView>
            )}
          </View>
        </ScrollView>

        {/* Nueva nota: sobre el menú flotante de abajo */}
        <Pressable
          onPress={openNew}
          accessibilityRole="button"
          accessibilityLabel="Nueva nota"
          style={({ pressed }) => ({
            position: 'absolute', right: 20, bottom: 116, minHeight: 52, paddingHorizontal: 20, borderRadius: 20,
            backgroundColor: AZUL, borderWidth: 2, borderColor: TINTA.fondo, flexDirection: 'row', alignItems: 'center', gap: 6,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ color: TINTA.sobreAcento, fontSize: 22, fontWeight: '800', marginTop: -2 }}>+</Text>
          <Text style={{ color: TINTA.sobreAcento, fontSize: 15, fontWeight: '800' }}>Nota</Text>
        </Pressable>
      </View>

      <AddNoteModal visible={modal} onClose={() => setModal(false)} note={editing} />
    </ScreenContainer>
  );
}

function Filtro({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      style={{ flex: 1, minHeight: 44, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? AZUL : 'transparent' }}
    >
      <Text style={{ color: active ? TINTA.sobreAcento : TINTA.texto, fontSize: 14, fontWeight: '800' }}>{label}</Text>
    </Pressable>
  );
}
