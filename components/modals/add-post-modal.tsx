import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useCreatePost, useUpdatePost, useDeletePost } from '@/hooks/use-posts';
import { PLATFORMS, STATUSES } from '@/constants/posts';
import type { Post, PostPlatform, PostStatus } from '@/lib/supabase';

interface AddPostModalProps {
  visible: boolean;
  onClose: () => void;
  post?: Post | null; // si se pasa, es modo edición
  clientSuggestions?: string[];
}

const COLORS = {
  bg: '#09090B',
  card: '#0F0F12',
  surface: '#18181B',
  border: '#27272A',
  text: '#FAFAFA',
  textDim: '#E4E4E7',
  muted: '#A1A1AA',
  subtle: '#52525B',
  primary: '#14B8A6',
  danger: '#EF4444',
};

function todayISO() {
  return new Date().toISOString().split('T')[0];
}
function shiftISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function AddPostModal({ visible, onClose, post, clientSuggestions = [] }: AddPostModalProps) {
  const isEdit = !!post;
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();
  const deletePost = useDeletePost();

  const [client, setClient] = useState('');
  const [platform, setPlatform] = useState<PostPlatform>('instagram');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [publishDate, setPublishDate] = useState(todayISO());
  const [publishTime, setPublishTime] = useState('');
  const [status, setStatus] = useState<PostStatus>('idea');
  const [link, setLink] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setClient(post?.client ?? '');
    setPlatform(post?.platform ?? 'instagram');
    setTitle(post?.title ?? '');
    setContent(post?.content ?? '');
    setPublishDate(post?.publish_date ?? todayISO());
    setPublishTime(post?.publish_time ?? '');
    setStatus(post?.status ?? 'idea');
    setLink(post?.link ?? '');
    setError(null);
    setSaving(false);
  }, [visible, post]);

  const submit = async () => {
    setError(null);
    if (!client.trim()) return setError('Escribe el cliente.');
    if (!title.trim()) return setError('Escribe un título o idea.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(publishDate.trim()))
      return setError('La fecha debe tener formato AAAA-MM-DD.');

    setSaving(true);
    try {
      const payload = {
        client: client.trim(),
        platform,
        title: title.trim(),
        content: content.trim(),
        publish_date: publishDate.trim(),
        publish_time: publishTime.trim() || null,
        status,
        link: link.trim() || null,
      };
      if (isEdit && post) {
        await updatePost.mutateAsync({ id: post.id, ...payload });
      } else {
        await createPost.mutateAsync(payload);
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'No se pudo guardar la publicación.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!post) return;
    setSaving(true);
    try {
      await deletePost.mutateAsync(post.id);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'No se pudo eliminar.');
      setSaving(false);
    }
  };

  const webNoOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null;
  const uniqueClients = Array.from(new Set(clientSuggestions.filter(Boolean))).slice(0, 8);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View
            style={{
              maxHeight: '94%',
              backgroundColor: COLORS.surface,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingHorizontal: 22,
              paddingTop: 14,
              paddingBottom: 24,
              borderTopWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <View
              style={{
                alignSelf: 'center',
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: COLORS.border,
                marginBottom: 12,
              }}
            />

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.text }}>
                {isEdit ? 'Editar publicación' : 'Nueva publicación'}
              </Text>
              <Pressable onPress={onClose} hitSlop={12}>
                <Text style={{ fontSize: 22, color: COLORS.muted }}>✕</Text>
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 12 }}
            >
              {/* Cliente */}
              <Text style={styles.label}>Cliente</Text>
              <TextInput
                value={client}
                onChangeText={setClient}
                placeholder="Ej: AutoMed"
                placeholderTextColor={COLORS.subtle}
                style={[styles.input, webNoOutline]}
              />
              {uniqueClients.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                  {uniqueClients.map((c) => (
                    <Pressable
                      key={c}
                      onPress={() => setClient(c)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 99,
                        backgroundColor: COLORS.bg,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                      }}
                    >
                      <Text style={{ color: COLORS.muted, fontSize: 11, fontWeight: '600' }}>{c}</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {/* Red social */}
              <Text style={styles.label}>Red social</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {PLATFORMS.map((p) => {
                  const active = platform === p.key;
                  return (
                    <Pressable
                      key={p.key}
                      onPress={() => setPlatform(p.key)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingHorizontal: 12,
                        paddingVertical: 9,
                        borderRadius: 99,
                        backgroundColor: active ? p.color : COLORS.bg,
                        borderWidth: 1,
                        borderColor: active ? p.color : COLORS.border,
                      }}
                    >
                      <Text style={{ fontSize: 13 }}>{p.icon}</Text>
                      <Text style={{ color: active ? '#fff' : COLORS.textDim, fontSize: 12, fontWeight: '600' }}>
                        {p.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Título / idea */}
              <Text style={styles.label}>Título / idea</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Ej: Reel — 3 tips para cuidar tu carro"
                placeholderTextColor={COLORS.subtle}
                style={[styles.input, webNoOutline]}
              />

              {/* Contenido */}
              <Text style={styles.label}>Contenido / copy (opcional)</Text>
              <TextInput
                value={content}
                onChangeText={setContent}
                placeholder="Texto del post, hashtags, notas de producción…"
                placeholderTextColor={COLORS.subtle}
                multiline
                style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }, webNoOutline]}
              />

              {/* Fecha */}
              <Text style={styles.label}>Fecha de publicación</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                {[
                  { label: 'Hoy', val: todayISO() },
                  { label: 'Mañana', val: shiftISO(1) },
                  { label: '+7 días', val: shiftISO(7) },
                ].map((q) => {
                  const active = publishDate === q.val;
                  return (
                    <Pressable
                      key={q.label}
                      onPress={() => setPublishDate(q.val)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                        borderRadius: 99,
                        backgroundColor: active ? COLORS.primary : COLORS.bg,
                        borderWidth: 1,
                        borderColor: active ? COLORS.primary : COLORS.border,
                      }}
                    >
                      <Text style={{ color: active ? '#fff' : COLORS.textDim, fontSize: 12, fontWeight: '600' }}>
                        {q.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                <TextInput
                  value={publishDate}
                  onChangeText={setPublishDate}
                  placeholder="AAAA-MM-DD"
                  placeholderTextColor={COLORS.subtle}
                  autoCapitalize="none"
                  style={[styles.input, { flex: 2, marginBottom: 0 }, webNoOutline]}
                />
                <TextInput
                  value={publishTime}
                  onChangeText={setPublishTime}
                  placeholder="HH:MM"
                  placeholderTextColor={COLORS.subtle}
                  autoCapitalize="none"
                  style={[styles.input, { flex: 1, marginBottom: 0 }, webNoOutline]}
                />
              </View>

              {/* Estado */}
              <Text style={styles.label}>Estado</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {STATUSES.map((s) => {
                  const active = status === s.key;
                  return (
                    <Pressable
                      key={s.key}
                      onPress={() => setStatus(s.key)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingHorizontal: 12,
                        paddingVertical: 9,
                        borderRadius: 99,
                        backgroundColor: active ? s.color : COLORS.bg,
                        borderWidth: 1,
                        borderColor: active ? s.color : COLORS.border,
                      }}
                    >
                      <Text style={{ fontSize: 13 }}>{s.icon}</Text>
                      <Text style={{ color: active ? '#fff' : COLORS.textDim, fontSize: 12, fontWeight: '600' }}>
                        {s.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Link */}
              <Text style={styles.label}>Link (opcional)</Text>
              <TextInput
                value={link}
                onChangeText={setLink}
                placeholder="https://… (post publicado o material)"
                placeholderTextColor={COLORS.subtle}
                autoCapitalize="none"
                style={[styles.input, webNoOutline]}
              />

              {error && (
                <View style={styles.alert}>
                  <Text style={{ color: '#FCA5A5', fontSize: 13, textAlign: 'center' }}>{error}</Text>
                </View>
              )}

              {/* Acciones */}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                {isEdit ? (
                  <Pressable
                    onPress={remove}
                    disabled={saving}
                    style={{
                      width: 52,
                      backgroundColor: 'rgba(239,68,68,0.10)',
                      borderWidth: 1,
                      borderColor: 'rgba(239,68,68,0.35)',
                      borderRadius: 14,
                      paddingVertical: 14,
                      alignItems: 'center',
                      opacity: saving ? 0.5 : 1,
                    }}
                  >
                    <Text style={{ fontSize: 18 }}>🗑️</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={onClose}
                    disabled={saving}
                    style={{
                      flex: 1,
                      backgroundColor: COLORS.bg,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      borderRadius: 14,
                      paddingVertical: 14,
                      alignItems: 'center',
                      opacity: saving ? 0.5 : 1,
                    }}
                  >
                    <Text style={{ color: COLORS.textDim, fontWeight: '700', fontSize: 14 }}>Cancelar</Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={submit}
                  disabled={saving}
                  style={({ pressed }) => ({
                    flex: 1.6,
                    backgroundColor: COLORS.primary,
                    borderRadius: 14,
                    paddingVertical: 14,
                    alignItems: 'center',
                    opacity: saving ? 0.6 : pressed ? 0.9 : 1,
                  })}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>
                      {isEdit ? 'Guardar cambios' : 'Agregar al calendario'}
                    </Text>
                  )}
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
  label: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '600' as const,
    marginBottom: 6,
    marginLeft: 2,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.text,
    fontSize: 14,
    marginBottom: 16,
  },
  alert: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    backgroundColor: 'rgba(239,68,68,0.10)',
    borderColor: 'rgba(239,68,68,0.35)',
  },
};
