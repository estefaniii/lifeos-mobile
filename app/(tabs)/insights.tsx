import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { FadeInView } from '@/components/fade-in-view';
import { useTasks } from '@/hooks/use-tasks';
import { usePosts } from '@/hooks/use-posts';
import { useNotes } from '@/hooks/use-notes';
import { useFinancialSummary } from '@/hooks/use-transactions';
import type { Task, Post } from '@/lib/supabase';

const COLORS = {
  bg: '#09090B', card: '#0F0F12', surface: '#18181B', border: '#27272A',
  text: '#FAFAFA', textDim: '#E4E4E7', muted: '#A1A1AA', subtle: '#52525B', primary: '#14B8A6',
};

const iso = (d: Date) => d.toISOString().split('T')[0];

export default function InsightsScreen() {
  const router = useRouter();
  const { data: tasks = [] } = useTasks();
  const { data: posts = [] } = usePosts();
  const { data: notes = [] } = useNotes();
  const { data: fin } = useFinancialSummary('week');

  const { start, today, plus7 } = useMemo(() => {
    const t = new Date();
    const s = new Date(); s.setDate(t.getDate() - 7);
    const p = new Date(); p.setDate(t.getDate() + 7);
    return { start: iso(s), today: iso(t), plus7: iso(p) };
  }, []);

  const closedTasks = tasks.filter((t) => t.done && (t.updated_at ?? '').slice(0, 10) >= start).length;
  const pendingTasks = tasks.filter((t) => !t.done).length;
  const published = posts.filter((p) => p.status === 'publicado' && p.publish_date >= start && p.publish_date <= today).length;
  const scheduled = posts.filter((p) => p.status !== 'publicado' && p.publish_date >= today && p.publish_date <= plus7).length;
  const newNotes = notes.filter((n) => (n.created_at ?? '').slice(0, 10) >= start).length;
  const income = fin?.income ?? 0;
  const expenses = fin?.expenses ?? 0;

  // Por cliente (tareas pendientes + posts próximos)
  const byClient = useMemo(() => {
    const map = new Map<string, { tasks: number; posts: number }>();
    tasks.forEach((t: Task) => {
      if (t.client && !t.done) {
        const e = map.get(t.client) ?? { tasks: 0, posts: 0 };
        e.tasks++; map.set(t.client, e);
      }
    });
    posts.forEach((p: Post) => {
      if (p.client && p.publish_date >= today && p.publish_date <= plus7) {
        const e = map.get(p.client) ?? { tasks: 0, posts: 0 };
        e.posts++; map.set(p.client, e);
      }
    });
    return Array.from(map.entries()).sort((a, b) => (b[1].tasks + b[1].posts) - (a[1].tasks + a[1].posts));
  }, [tasks, posts, today, plus7]);

  const money = (n: number) => '$' + Math.round(n).toLocaleString('es');

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView style={{ flex: 1, backgroundColor: COLORS.bg }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 60 }}>
        <Pressable onPress={() => router.push('/')} style={{ marginBottom: 8 }}>
          <Text style={{ color: COLORS.primary, fontSize: 14, fontWeight: '700' }}>‹ Inicio</Text>
        </Pressable>
        <Text style={{ color: COLORS.text, fontSize: 28, fontWeight: '800' }}>Resumen semanal</Text>
        <Text style={{ color: COLORS.muted, fontSize: 13, marginTop: 2, marginBottom: 20 }}>Cómo te fue en los últimos 7 días</Text>

        {/* Tiles */}
        <FadeInView style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          <Tile label="Tareas cerradas" value={String(closedTasks)} accent="#22C55E" icon="✅" />
          <Tile label="Tareas pendientes" value={String(pendingTasks)} accent="#F59E0B" icon="📋" />
          <Tile label="Publicadas (7d)" value={String(published)} accent="#8B5CF6" icon="🚀" />
          <Tile label="Programadas (próx.)" value={String(scheduled)} accent="#3B82F6" icon="📅" />
          <Tile label="Ingresos semana" value={money(income)} accent="#22C55E" icon="↑" />
          <Tile label="Gastos semana" value={money(expenses)} accent="#EF4444" icon="↓" />
          <Tile label="Notas nuevas" value={String(newNotes)} accent="#14B8A6" icon="📝" />
          <Tile label="Balance" value={money(income - expenses)} accent={income - expenses >= 0 ? '#22C55E' : '#EF4444'} icon="⚖️" />
        </FadeInView>

        {/* Por cliente */}
        {byClient.length > 0 && (
          <View style={{ marginTop: 22 }}>
            <Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Foco por cliente</Text>
            {byClient.map(([name, e]) => (
              <View key={name} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 8 }}>
                <Text style={{ color: COLORS.text, fontSize: 15, fontWeight: '700', flex: 1 }}>{name}</Text>
                <Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: '600' }}>{e.tasks} tarea{e.tasks === 1 ? '' : 's'} · {e.posts} post{e.posts === 1 ? '' : 's'}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={{ color: COLORS.subtle, fontSize: 11, textAlign: 'center', marginTop: 24, lineHeight: 16 }}>
          Los números se calculan en vivo desde tus tareas, publicaciones, finanzas y notas.
        </Text>
      </ScrollView>
    </ScreenContainer>
  );
}

function Tile({ label, value, accent, icon }: { label: string; value: string; accent: string; icon: string }) {
  return (
    <View style={{ width: '50%', padding: 6 }}>
      <View style={{ backgroundColor: COLORS.card, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, padding: 16, minHeight: 96 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: accent + '22', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 15 }}>{icon}</Text>
          </View>
        </View>
        <Text style={{ color: COLORS.text, fontSize: 24, fontWeight: '800' }}>{value}</Text>
        <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 2 }}>{label}</Text>
      </View>
    </View>
  );
}
