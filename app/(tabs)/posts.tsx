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

export function PostsView({ embedded = false }: { embedded?: boolean }) {
  const { data: posts, isLoading, refetch, isRefetching } = usePosts();
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Post | null>(null);
  const [clientFilter, setClientFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<PostStatus | null>(null);
  const [view, setView] = useState<'lista' | 'mes'>('lista');
  const [monthAnchor, setMonthAnchor] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

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
        {/* Header (se oculta cuando va embebido dentro del hub de Trabajo) */}
        {!embedded && (
          <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 }}>
            <Text style={{ color: COLORS.text, fontSize: 28, fontWeight: '800' }}>Publicaciones</Text>
            <Text style={{ color: COLORS.muted, fontSize: 13, marginTop: 2 }}>
              Calendario de contenido de tus clientes
            </Text>
          </View>
        )}

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

        {/* Toggle Lista / Mes */}
        <View style={{ flexDirection: 'row', gap: 6, marginHorizontal: 20, marginTop: 12, backgroundColor: COLORS.surface, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: COLORS.border }}>
          {(['lista', 'mes'] as const).map((v) => (
            <Pressable key={v} onPress={() => setView(v)} style={{ flex: 1, paddingVertical: 7, borderRadius: 9, alignItems: 'center', backgroundColor: view === v ? COLORS.primary : 'transparent' }}>
              <Text style={{ color: view === v ? '#fff' : COLORS.muted, fontSize: 12, fontWeight: '700' }}>{v === 'lista' ? '☰ Lista' : '🗓️ Mes'}</Text>
            </Pressable>
          ))}
        </View>

        {/* Contenido */}
        {isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : view === 'lista' ? (
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
        ) : (
          <MonthCalendar
            posts={filtered}
            anchor={monthAnchor}
            setAnchor={setMonthAnchor}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            onEditPost={openEdit}
          />
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

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function MonthCalendar({ posts, anchor, setAnchor, selectedDay, onSelectDay, onEditPost }: {
  posts: Post[];
  anchor: { y: number; m: number };
  setAnchor: (a: { y: number; m: number }) => void;
  selectedDay: string | null;
  onSelectDay: (d: string | null) => void;
  onEditPost: (p: Post) => void;
}) {
  const { y, m } = anchor;
  const pad = (n: number) => String(n).padStart(2, '0');
  const iso = (d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const firstOffset = (new Date(y, m, 1).getDay() + 6) % 7; // semana inicia lunes
  const todayISO = new Date().toISOString().split('T')[0];

  const byDate = new Map<string, Post[]>();
  const monthPrefix = `${y}-${pad(m + 1)}`;
  for (const p of posts) {
    if (p.publish_date.startsWith(monthPrefix)) {
      if (!byDate.has(p.publish_date)) byDate.set(p.publish_date, []);
      byDate.get(p.publish_date)!.push(p);
    }
  }

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prev = () => { onSelectDay(null); setAnchor(m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }); };
  const next = () => { onSelectDay(null); setAnchor(m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }); };
  const dayPosts = selectedDay ? (byDate.get(selectedDay) ?? []) : [];

  return (
    <ScrollView style={{ flex: 1, marginTop: 12 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 160 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 4 }}>
        <Pressable onPress={prev} hitSlop={10} style={{ padding: 6 }}><Text style={{ color: COLORS.primary, fontSize: 22, fontWeight: '800' }}>‹</Text></Pressable>
        <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: '800' }}>{MONTH_NAMES[m]} {y}</Text>
        <Pressable onPress={next} hitSlop={10} style={{ padding: 6 }}><Text style={{ color: COLORS.primary, fontSize: 22, fontWeight: '800' }}>›</Text></Pressable>
      </View>

      <View style={{ flexDirection: 'row', marginBottom: 6 }}>
        {WEEKDAYS.map((w, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ color: COLORS.subtle, fontSize: 11, fontWeight: '700' }}>{w}</Text>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((d, i) => {
          if (d === null) return <View key={`e${i}`} style={{ width: '14.2857%', aspectRatio: 1 }} />;
          const dISO = iso(d);
          const dayItems = byDate.get(dISO) ?? [];
          const isToday = dISO === todayISO;
          const isSel = dISO === selectedDay;
          return (
            <Pressable key={dISO} onPress={() => onSelectDay(isSel ? null : dISO)} style={{ width: '14.2857%', aspectRatio: 1, padding: 3 }}>
              <View style={{ flex: 1, borderRadius: 10, backgroundColor: isSel ? COLORS.primary : (dayItems.length ? COLORS.card : 'transparent'), borderWidth: isToday && !isSel ? 1 : 0, borderColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: isSel ? '#fff' : (isToday ? COLORS.primary : COLORS.textDim), fontSize: 13, fontWeight: isToday || isSel ? '800' : '500' }}>{d}</Text>
                {dayItems.length > 0 && (
                  <View style={{ flexDirection: 'row', gap: 2, marginTop: 2 }}>
                    {dayItems.slice(0, 3).map((p, idx) => (
                      <View key={idx} style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: isSel ? '#fff' : platformMeta(p.platform).color }} />
                    ))}
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={{ marginTop: 18 }}>
        {selectedDay ? (
          dayPosts.length ? (
            <>
              <Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>{formatDateHeader(selectedDay)}</Text>
              {dayPosts.map((p) => <PostCard key={p.id} post={p} onPress={() => onEditPost(p)} />)}
            </>
          ) : (
            <Text style={{ color: COLORS.subtle, fontSize: 13, textAlign: 'center', marginTop: 10 }}>Sin publicaciones ese día.</Text>
          )
        ) : (
          <Text style={{ color: COLORS.subtle, fontSize: 13, textAlign: 'center', marginTop: 10 }}>Toca un día para ver sus publicaciones.</Text>
        )}
      </View>
    </ScrollView>
  );
}
