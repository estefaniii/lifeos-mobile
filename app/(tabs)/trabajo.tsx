import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { PostsView } from '@/app/(tabs)/posts';
import { AddTaskModal } from '@/components/modals/add-task-modal';
import { AddClientModal } from '@/components/modals/add-client-modal';
import { AddPostModal } from '@/components/modals/add-post-modal';
import { AddNoteModal } from '@/components/modals/add-note-modal';
import { useTasks, useToggleTask } from '@/hooks/use-tasks';
import { usePosts } from '@/hooks/use-posts';
import { useClients } from '@/hooks/use-clients';
import { useNotes } from '@/hooks/use-notes';
import { platformMeta, statusMeta } from '@/constants/posts';
import type { Task, Post, Client, Note } from '@/lib/supabase';

const COLORS = {
  bg: '#09090B', card: '#0F0F12', surface: '#18181B', border: '#27272A',
  text: '#FAFAFA', textDim: '#E4E4E7', muted: '#A1A1AA', subtle: '#52525B', primary: '#14B8A6',
};
const PRIORITY_COLOR: Record<string, string> = { baja: '#3B82F6', media: '#F59E0B', alta: '#EF4444' };

const todayISO = () => new Date().toISOString().split('T')[0];
const isoShift = (d: number) => { const x = new Date(); x.setDate(x.getDate() + d); return x.toISOString().split('T')[0]; };
function dayLabel(iso: string) {
  const t = todayISO();
  if (iso === t) return 'Hoy';
  if (iso === isoShift(1)) return 'Mañana';
  const [y, m, d] = iso.split('-').map(Number);
  const s = new Date(y, m - 1, d).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'short' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

type Segment = 'hoy' | 'clientes' | 'calendario';

export default function TrabajoScreen() {
  const router = useRouter();
  const [segment, setSegment] = useState<Segment>('hoy');
  const { data: tasks = [], refetch: refetchTasks, isRefetching } = useTasks();
  const { data: posts = [] } = usePosts();
  const { data: clients = [] } = useClients();
  const { data: notes = [] } = useNotes();
  const toggleTask = useToggleTask();

  const [taskModal, setTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskDefaultClient, setTaskDefaultClient] = useState<string | undefined>(undefined);
  const [clientModal, setClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientDefaultName, setClientDefaultName] = useState<string | undefined>(undefined);
  const [postModal, setPostModal] = useState(false);
  const [noteModal, setNoteModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  const clientNames = useMemo(() => {
    const s = new Set<string>();
    clients.forEach((c) => c.name && s.add(c.name));
    posts.forEach((p) => p.client && s.add(p.client));
    tasks.forEach((t) => t.client && s.add(t.client));
    return Array.from(s).sort();
  }, [clients, posts, tasks]);

  const openNewTask = (client?: string) => { setEditingTask(null); setTaskDefaultClient(client); setTaskModal(true); };
  const openEditTask = (t: Task) => { setEditingTask(t); setTaskDefaultClient(undefined); setTaskModal(true); };

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: COLORS.text, fontSize: 28, fontWeight: '800' }}>Trabajo</Text>
          <Pressable
            onPress={() => router.push('/productivity')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 99, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border }}
          >
            <Text style={{ fontSize: 13 }}>⏱️</Text>
            <Text style={{ color: COLORS.textDim, fontSize: 12, fontWeight: '700' }}>Enfoque</Text>
          </Pressable>
        </View>

        {/* Segmented control */}
        <View style={{ flexDirection: 'row', gap: 6, backgroundColor: COLORS.surface, borderRadius: 14, padding: 4, marginHorizontal: 20, marginTop: 12, borderWidth: 1, borderColor: COLORS.border }}>
          {([['hoy', 'Hoy / Semana'], ['clientes', 'Clientes'], ['calendario', 'Calendario']] as [Segment, string][]).map(([key, label]) => {
            const active = segment === key;
            return (
              <Pressable key={key} onPress={() => { setSegment(key); setSelectedClient(null); }} style={{ flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center', backgroundColor: active ? COLORS.primary : 'transparent' }}>
                <Text style={{ color: active ? '#fff' : COLORS.muted, fontSize: 12, fontWeight: '700' }}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        {segment === 'hoy' && <WeekView tasks={tasks} posts={posts} onToggle={toggleTask} onEditTask={openEditTask} onEditPost={() => setSegment('calendario')} refetch={refetchTasks} isRefetching={isRefetching} onAdd={() => openNewTask()} />}
        {segment === 'clientes' && (
          selectedClient
            ? <ClientDetail name={selectedClient} clients={clients} tasks={tasks} posts={posts} notes={notes} onBack={() => setSelectedClient(null)} onToggle={toggleTask} onEditTask={openEditTask} onAddTask={() => openNewTask(selectedClient)} onAddPost={() => setPostModal(true)} onAddNote={() => setNoteModal(true)} onEditClient={(c) => { const real = c && c.id; setEditingClient(real ? c : null); setClientDefaultName(real ? undefined : c?.name); setClientModal(true); }} />
            : <ClientsList names={clientNames} clients={clients} tasks={tasks} posts={posts} onOpen={setSelectedClient} onAdd={() => { setEditingClient(null); setClientDefaultName(undefined); setClientModal(true); }} />
        )}
        {segment === 'calendario' && <View style={{ flex: 1, marginTop: 8 }}><PostsView embedded /></View>}

        {/* FAB (no en calendario, que tiene el suyo) */}
        {(segment === 'hoy' || (segment === 'clientes' && !selectedClient)) && (
          <Pressable
            onPress={() => segment === 'clientes' && !selectedClient ? (setEditingClient(null), setClientDefaultName(undefined), setClientModal(true)) : openNewTask(selectedClient ?? undefined)}
            style={({ pressed }) => ({ position: 'absolute', right: 20, bottom: 24, width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8, opacity: pressed ? 0.9 : 1 })}
          >
            <Text style={{ color: '#fff', fontSize: 30, marginTop: -2 }}>+</Text>
          </Pressable>
        )}
      </View>

      <AddTaskModal visible={taskModal} onClose={() => setTaskModal(false)} task={editingTask} defaultClient={taskDefaultClient} clientSuggestions={clientNames} />
      <AddClientModal visible={clientModal} onClose={() => setClientModal(false)} client={editingClient} defaultName={clientDefaultName} />
      <AddPostModal visible={postModal} onClose={() => setPostModal(false)} clientSuggestions={clientNames} />
      <AddNoteModal visible={noteModal} onClose={() => setNoteModal(false)} defaultClient={selectedClient ?? undefined} clientSuggestions={clientNames} />
    </ScreenContainer>
  );
}

function TaskRow({ task, onToggle, onEdit }: { task: Task; onToggle: ReturnType<typeof useToggleTask>; onEdit: (t: Task) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 8 }}>
      <Pressable onPress={() => onToggle.mutate({ id: task.id, done: !task.done })} hitSlop={8} style={{ width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: task.done ? COLORS.primary : COLORS.subtle, backgroundColor: task.done ? COLORS.primary : 'transparent', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
        {task.done && <Text style={{ color: '#fff', fontSize: 13, fontWeight: '900' }}>✓</Text>}
      </Pressable>
      <Pressable style={{ flex: 1 }} onPress={() => onEdit(task)}>
        <Text style={{ color: task.done ? COLORS.subtle : COLORS.text, fontSize: 14, fontWeight: '600', textDecorationLine: task.done ? 'line-through' : 'none' }} numberOfLines={2}>{task.title}</Text>
        {(task.client || task.priority) && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 }}>
            {!!task.client && <Text style={{ color: COLORS.muted, fontSize: 11, fontWeight: '600' }}>{task.client}</Text>}
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: PRIORITY_COLOR[task.priority] }} />
          </View>
        )}
      </Pressable>
    </View>
  );
}

function PostRow({ post, onPress }: { post: Post; onPress: () => void }) {
  const pm = platformMeta(post.platform); const sm = statusMeta(post.status);
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 8 }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: pm.color + '22', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
        <Text style={{ fontSize: 15 }}>{pm.icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: COLORS.text, fontSize: 14, fontWeight: '600' }} numberOfLines={1}>{post.title}</Text>
        <Text style={{ color: COLORS.muted, fontSize: 11, marginTop: 2 }}>{post.client}{post.publish_time ? ` · ${post.publish_time}` : ''}</Text>
      </View>
      <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, backgroundColor: sm.color + '22' }}>
        <Text style={{ color: sm.color, fontSize: 10, fontWeight: '700' }}>{sm.label}</Text>
      </View>
    </Pressable>
  );
}

function WeekView({ tasks, posts, onToggle, onEditTask, onEditPost, refetch, isRefetching, onAdd }: any) {
  const overdue = tasks.filter((t: Task) => t.due_date && t.due_date < todayISO() && !t.done);
  const noDate = tasks.filter((t: Task) => !t.due_date && !t.done);
  const days = Array.from({ length: 7 }, (_, i) => isoShift(i));

  const hasAnything = overdue.length || noDate.length || days.some((d) =>
    tasks.some((t: Task) => t.due_date === d) || posts.some((p: Post) => p.publish_date === d));

  return (
    <ScrollView style={{ flex: 1, marginTop: 12 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />}>
      {!hasAnything && (
        <View style={{ alignItems: 'center', paddingTop: 70 }}>
          <Text style={{ fontSize: 42, marginBottom: 10 }}>🎯</Text>
          <Text style={{ color: COLORS.text, fontSize: 17, fontWeight: '700' }}>Semana despejada</Text>
          <Text style={{ color: COLORS.muted, fontSize: 13, marginTop: 6, textAlign: 'center' }}>Agrega tu primera tarea con el botón +</Text>
        </View>
      )}

      {overdue.length > 0 && (
        <View style={{ marginBottom: 20 }}>
          <Text style={[sectionStyle, { color: '#F87171' }]}>⚠️ Atrasadas</Text>
          {overdue.map((t: Task) => <TaskRow key={t.id} task={t} onToggle={onToggle} onEdit={onEditTask} />)}
        </View>
      )}

      {days.map((d) => {
        const dayTasks = tasks.filter((t: Task) => t.due_date === d);
        const dayPosts = posts.filter((p: Post) => p.publish_date === d);
        if (!dayTasks.length && !dayPosts.length) return null;
        return (
          <View key={d} style={{ marginBottom: 20 }}>
            <Text style={sectionStyle}>{dayLabel(d)}</Text>
            {dayTasks.map((t: Task) => <TaskRow key={t.id} task={t} onToggle={onToggle} onEdit={onEditTask} />)}
            {dayPosts.map((p: Post) => <PostRow key={p.id} post={p} onPress={onEditPost} />)}
          </View>
        );
      })}

      {noDate.length > 0 && (
        <View style={{ marginBottom: 20 }}>
          <Text style={sectionStyle}>Sin fecha</Text>
          {noDate.map((t: Task) => <TaskRow key={t.id} task={t} onToggle={onToggle} onEdit={onEditTask} />)}
        </View>
      )}
    </ScrollView>
  );
}

function ClientsList({ names, clients, tasks, posts, onOpen, onAdd }: any) {
  if (!names.length) {
    return (
      <View style={{ flex: 1, alignItems: 'center', paddingTop: 80, paddingHorizontal: 30 }}>
        <Text style={{ fontSize: 42, marginBottom: 10 }}>🏢</Text>
        <Text style={{ color: COLORS.text, fontSize: 17, fontWeight: '700' }}>Sin clientes todavía</Text>
        <Text style={{ color: COLORS.muted, fontSize: 13, marginTop: 6, marginBottom: 18, textAlign: 'center' }}>Crea una ficha para reunir tareas y posts de cada cliente.</Text>
        <Pressable onPress={onAdd} style={{ backgroundColor: COLORS.primary, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 12 }}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>+ Nuevo cliente</Text>
        </Pressable>
      </View>
    );
  }
  return (
    <ScrollView style={{ flex: 1, marginTop: 12 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}>
      {names.map((name: string) => {
        const rec = clients.find((c: Client) => c.name === name);
        const pending = tasks.filter((t: Task) => t.client === name && !t.done).length;
        const postCount = posts.filter((p: Post) => p.client === name).length;
        const color = rec?.color || COLORS.muted;
        return (
          <Pressable key={name} onPress={() => onOpen(name)} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 10 }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: color, marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: '700' }}>{name}</Text>
              <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 2 }}>{pending} tarea{pending === 1 ? '' : 's'} · {postCount} post{postCount === 1 ? '' : 's'}{rec ? '' : ' · sin ficha'}</Text>
            </View>
            <Text style={{ color: COLORS.subtle, fontSize: 20 }}>›</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function ClientDetail({ name, clients, tasks, posts, notes, onBack, onToggle, onEditTask, onAddTask, onAddPost, onAddNote, onEditClient }: any) {
  const rec: Client | undefined = clients.find((c: Client) => c.name === name);
  const clientTasks = tasks.filter((t: Task) => t.client === name);
  const clientPosts = posts.filter((p: Post) => p.client === name);
  const clientNotes = (notes ?? []).filter((n: Note) => n.client === name && !n.archived);
  return (
    <ScrollView style={{ flex: 1, marginTop: 12 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}>
      <Pressable onPress={onBack} style={{ marginBottom: 12 }}><Text style={{ color: COLORS.primary, fontSize: 14, fontWeight: '700' }}>‹ Clientes</Text></Pressable>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: rec?.color || COLORS.muted, marginRight: 10 }} />
        <Text style={{ color: COLORS.text, fontSize: 24, fontWeight: '800', flex: 1 }}>{name}</Text>
        <Pressable onPress={() => rec ? onEditClient(rec) : onEditClient({ id: '', user_id: '', name })} hitSlop={8}><Text style={{ color: COLORS.muted, fontSize: 13 }}>✎ {rec ? 'Editar' : 'Crear ficha'}</Text></Pressable>
      </View>

      {!!rec?.notes && (
        <View style={{ backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 18 }}>
          <Text style={{ color: COLORS.textDim, fontSize: 13, lineHeight: 19 }}>{rec.notes}</Text>
        </View>
      )}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: 4 }}>
        <Text style={sectionStyle}>Tareas</Text>
        <Pressable onPress={onAddTask}><Text style={{ color: COLORS.primary, fontSize: 13, fontWeight: '700' }}>+ Tarea</Text></Pressable>
      </View>
      {clientTasks.length ? clientTasks.map((t: Task) => <TaskRow key={t.id} task={t} onToggle={onToggle} onEdit={onEditTask} />)
        : <Text style={{ color: COLORS.subtle, fontSize: 13, marginBottom: 8 }}>Sin tareas.</Text>}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: 18 }}>
        <Text style={sectionStyle}>Publicaciones</Text>
        <Pressable onPress={onAddPost}><Text style={{ color: COLORS.primary, fontSize: 13, fontWeight: '700' }}>+ Post</Text></Pressable>
      </View>
      {clientPosts.length ? clientPosts.map((p: Post) => <PostRow key={p.id} post={p} onPress={() => {}} />)
        : <Text style={{ color: COLORS.subtle, fontSize: 13 }}>Sin publicaciones.</Text>}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: 18 }}>
        <Text style={sectionStyle}>Notas</Text>
        <Pressable onPress={onAddNote}><Text style={{ color: COLORS.primary, fontSize: 13, fontWeight: '700' }}>+ Nota</Text></Pressable>
      </View>
      {clientNotes.length ? clientNotes.map((n: Note) => (
        <View key={n.id} style={{ backgroundColor: n.color || COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 8 }}>
          <Text style={{ color: COLORS.text, fontSize: 14, fontWeight: '700' }} numberOfLines={1}>{n.title}</Text>
          {!!n.content && <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 3 }} numberOfLines={3}>{n.content}</Text>}
        </View>
      )) : <Text style={{ color: COLORS.subtle, fontSize: 13 }}>Sin notas.</Text>}
    </ScrollView>
  );
}

const sectionStyle = { color: COLORS.muted, fontSize: 12, fontWeight: '700' as const, textTransform: 'uppercase' as const, letterSpacing: 1 } as const;
