import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { AddPostModal } from '@/components/modals/add-post-modal';
import { usePosts } from '@/hooks/use-posts';
import { platformMeta, statusMeta, STATUSES } from '@/constants/posts';
import type { Post, PostStatus } from '@/lib/supabase';

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
};

function formatDateHeader(iso: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const diff = Math.round((date.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  if (diff === -1) return 'Ayer';
  const fmt = date.toLocaleDateString('es', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  return fmt.charAt(0).toUpperCase() + fmt.slice(1);
}

export function PostsView() {
  const { data: posts, isLoading, refetch, isRefetching } = usePosts();
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Post | null>(null);
  const [clientFilter, setClientFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<PostStatus | null>(null);

  const all = posts ?? [];

  const clients = useMemo(
    () => Array.from(new Set(all.map((p) => p.client).filter(Boolean))).sort(),
    [all]
  );

  const filtered = useMemo(
    () =>
      all.filter(
        (p) =>
          (!clientFilter || p.client === clientFilter) &&
          (!statusFilter || p.status === statusFilter)
      ),
    [all, clientFilter, statusFilter]
  );

  const groups = useMemo(() => {
    const map = new Map<string, Post[]>();
    for (const p of filtered) {
      if (!map.has(p.publish_date)) map.set(p.publish_date, []);
      map.get(p.publish_date)!.push(p);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const openNew = () => {
    setEditing(null);
    setModalVisible(true);
  };
  const openEdit = (p: Post) => {
    setEditing(p);
    setModalVisible(true);
  };

  return (
    <>
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 }}>
          <Text style={{ color: COLORS.text, fontSize: 28, fontWeight: '800' }}>Publicaciones</Text>
          <Text style={{ color: COLORS.muted, fontSize: 13, marginTop: 2 }}>
            Calendario de contenido de tus clientes
          </Text>
        </View>

        {/* Filtros */}
        <View style={{ paddingLeft: 20, paddingTop: 10 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20, gap: 8 }}>
            <FilterChip label="Todos" active={!clientFilter} onPress={() => setClientFilter(null)} />
            {clients.map((c) => (
              <FilterChip key={c} label={c} active={clientFilter === c} onPress={() => setClientFilter(c)} />
            ))}
          </ScrollView>
        </View>
        <View style={{ paddingLeft: 20, paddingTop: 8 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20, gap: 8 }}>
            <FilterChip label="Todos los estados" active={!statusFilter} onPress={() => setStatusFilter(null)} />
            {STATUSES.map((s) => (
              <FilterChip
                key={s.key}
                label={`${s.icon} ${s.label}`}
                active={statusFilter === s.key}
                tint={s.color}
                onPress={() => setStatusFilter(s.key)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Lista */}
        {isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1, marginTop: 12 }}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />
            }
          >
            {groups.length === 0 ? (
              <EmptyState onAdd={openNew} hasPosts={all.length > 0} />
            ) : (
              groups.map(([date, items]) => (
                <View key={date} style={{ marginBottom: 22 }}>
                  <Text
                    style={{
                      color: COLORS.muted,
                      fontSize: 12,
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      marginBottom: 10,
                    }}
                  >
                    {formatDateHeader(date)}
                  </Text>
                  {items.map((p) => (
                    <PostCard key={p.id} post={p} onPress={() => openEdit(p)} />
                  ))}
                </View>
              ))
            )}
          </ScrollView>
        )}

        {/* FAB */}
        <Pressable
          onPress={openNew}
          style={({ pressed }) => ({
            position: 'absolute',
            right: 20,
            bottom: 24,
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: COLORS.primary,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35,
            shadowRadius: 12,
            elevation: 8,
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <Text style={{ color: '#fff', fontSize: 30, marginTop: -2 }}>+</Text>
        </Pressable>
      </View>

      <AddPostModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        post={editing}
        clientSuggestions={clients}
      />
    </>
  );
}

export default function PostsScreen() {
  return (
    <ScreenContainer containerClassName="bg-background">
      <PostsView />
    </ScreenContainer>
  );
}

function FilterChip({
  label,
  active,
  onPress,
  tint = COLORS.primary,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  tint?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 99,
        backgroundColor: active ? tint : COLORS.surface,
        borderWidth: 1,
        borderColor: active ? tint : COLORS.border,
      }}
    >
      <Text style={{ color: active ? '#fff' : COLORS.textDim, fontSize: 12, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

function PostCard({ post, onPress }: { post: Post; onPress: () => void }) {
  const pm = platformMeta(post.platform);
  const sm = statusMeta(post.status);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        backgroundColor: COLORS.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 14,
        marginBottom: 10,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {/* Icono plataforma */}
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          backgroundColor: pm.color + '22',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12,
        }}
      >
        <Text style={{ fontSize: 18 }}>{pm.icon}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: COLORS.muted, fontSize: 11, fontWeight: '700' }}>
            {post.client || 'Sin cliente'}
            {post.publish_time ? `  ·  ${post.publish_time}` : ''}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 99,
              backgroundColor: sm.color + '22',
            }}
          >
            <Text style={{ fontSize: 10 }}>{sm.icon}</Text>
            <Text style={{ color: sm.color, fontSize: 10, fontWeight: '700' }}>{sm.label}</Text>
          </View>
        </View>
        <Text style={{ color: COLORS.text, fontSize: 15, fontWeight: '700', marginTop: 4 }} numberOfLines={2}>
          {post.title}
        </Text>
        {!!post.content && (
          <Text style={{ color: COLORS.subtle, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
            {post.content}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

function EmptyState({ onAdd, hasPosts }: { onAdd: () => void; hasPosts: boolean }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 80, paddingHorizontal: 30 }}>
      <Text style={{ fontSize: 44, marginBottom: 12 }}>🗓️</Text>
      <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: '700', textAlign: 'center' }}>
        {hasPosts ? 'Nada con estos filtros' : 'Aún no hay publicaciones'}
      </Text>
      <Text style={{ color: COLORS.muted, fontSize: 13, textAlign: 'center', marginTop: 6, marginBottom: 18 }}>
        {hasPosts
          ? 'Prueba quitar el filtro de cliente o estado.'
          : 'Empieza a planificar el contenido de tus clientes.'}
      </Text>
      {!hasPosts && (
        <Pressable
          onPress={onAdd}
          style={{ backgroundColor: COLORS.primary, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 12 }}
        >
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>+ Nueva publicación</Text>
        </Pressable>
      )}
    </View>
  );
}
