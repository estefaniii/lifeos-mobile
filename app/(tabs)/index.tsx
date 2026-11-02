import React, { useState } from 'react';
import { ScrollView, Text, View, Pressable, RefreshControl, Platform, Alert, Modal, TextInput } from 'react-native';
import { supabase } from '@/lib/supabase';
import { ScreenContainer } from '@/components/screen-container';
import { useTodayHealthSummary, useHealthMetrics } from '@/hooks/use-health';
import { useHabits, useTodayHabitLogs, useHabitStreaks, useToggleHabit, useCreateHabit, useDeleteHabit } from '@/hooks/use-habits';
import { useFinancialSummary as useWeekFinancialSummary } from '@/hooks/use-transactions';
import { useSavingsGoals } from '@/hooks/use-savings-goals';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { AddTransactionModal } from '@/components/modals/add-transaction-modal';
import { AddHabitModal } from '@/components/modals/add-habit-modal';
import { useAuth } from '@/hooks/use-auth';
import { useNotes } from '@/hooks/use-notes';
import { FadeInView } from '@/components/fade-in-view';
import { WaterModal } from '@/components/water-modal';
import { Titulo, Sticker, TINTA } from '@/components/decor';
import { fechaLocal, racha, hitoRacha } from '@/lib/registros';

// «Domingo, 1 de noviembre»: solo la primera letra en mayúscula
const fechaLarga = () => {
  const t = new Date().toLocaleDateString('es-PA', { weekday: 'long', day: 'numeric', month: 'long' });
  return t.charAt(0).toUpperCase() + t.slice(1);
};

// Paleta de Inicio: ámbar como acento y los colores de cada cosa
const AMBAR = '#FFB547';
const AGUA = '#7CC4FF';
const CORAL = '#FF7A6B';
const MENTA = '#5FD3A8';
const LILA = '#C9A7FF';
const ELEVADO = '#2A2521';
const TARJETA = { backgroundColor: TINTA.tarjeta, borderRadius: 26, borderWidth: 1, borderColor: TINTA.borde } as const;

// «L», «M»… de una fecha guardada como AAAA-MM-DD. A mediodía para que el
// desfase de Panamá no la pase al día anterior.
const diaCorto = (fecha: string) =>
  new Date(`${fecha}T12:00:00`).toLocaleDateString('es-PA', { weekday: 'narrow' });

// Hoja inferior de los registros rápidos
const HOJA = { backgroundColor: TINTA.tarjeta, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderBottomWidth: 0, borderColor: TINTA.borde, padding: 24, paddingBottom: 32 } as const;

// ─── Mini Modals ─────────────────────────────────────────────────────────────

function MeditationModal({ visible, onClose, userId, onSave }: {
  visible: boolean;
  onClose: () => void;
  userId: string;
  onSave: () => void;
}) {
  const OPTIONS = [5, 10, 15, 20, 30, 45];
  const [saving, setSaving] = useState(false);

  const handleLog = async (minutes: number) => {
    setSaving(true);
    const today = fechaLocal();
    await supabase.from('mental_logs').insert([{
      user_id: userId,
      meditation_minutes: minutes,
      date: today,
    }]);
    setSaving(false);
    onSave();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
        <View style={HOJA}>
          <Titulo size={24}>Anotar meditación</Titulo>
          <Text style={{ color: TINTA.suave, fontSize: 14, marginTop: 4, marginBottom: 20 }}>
            ¿Cuántos minutos?
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
            {OPTIONS.map((min) => (
              <Pressable
                key={min}
                onPress={() => handleLog(min)}
                disabled={saving}
                style={{
                  flex: 1,
                  minWidth: 80,
                  minHeight: 52,
                  backgroundColor: ELEVADO,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: saving ? 0.5 : 1,
                }}
              >
                <Text style={{ color: LILA, fontWeight: '800', fontSize: 16 }}>{min} min</Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={onClose} accessibilityRole="button" style={{ minHeight: 52, borderRadius: 26, borderWidth: 1, borderColor: TINTA.borde, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: TINTA.texto, fontWeight: '700', fontSize: 15 }}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function ActivityModal({ visible, onClose, type, userId, onSave }: {
  visible: boolean;
  onClose: () => void;
  type: 'gym' | 'yoga';
  userId: string;
  onSave: () => void;
}) {
  const [minutes, setMinutes] = useState('');
  const [saving, setSaving] = useState(false);

  const isGym = type === 'gym';

  const handleLog = async () => {
    setSaving(true);
    try {
      const today = fechaLocal();
      const fields: any = {};
      if (isGym) fields.gym_session = true;
      else fields.yoga_session = true;
      if (minutes) fields.exercise_minutes = parseInt(minutes) || 0;

      const { data: existing } = await supabase
        .from('health_metrics')
        .select('id')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle();

      if (existing) {
        await supabase.from('health_metrics').update(fields).eq('id', existing.id);
      } else {
        await supabase.from('health_metrics').insert({ user_id: userId, date: today, ...fields });
      }
    } catch (err) {
      console.error('[Activity] Save error:', err);
    }
    setSaving(false);
    setMinutes('');
    onSave();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
        <View style={HOJA}>
          <Titulo size={24}>{isGym ? 'Anotar gym' : 'Anotar yoga'}</Titulo>
          <Text style={{ color: TINTA.suave, fontSize: 14, marginTop: 4, marginBottom: 20 }}>
            Cuánto duró, si quieres anotarlo
          </Text>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: ELEVADO,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: TINTA.borde,
            paddingHorizontal: 16,
            marginBottom: 16,
          }}>
            <TextInput
              style={{ flex: 1, color: TINTA.texto, fontSize: 16, minHeight: 52 }}
              placeholder="60"
              placeholderTextColor={TINTA.suave}
              keyboardType="number-pad"
              value={minutes}
              onChangeText={setMinutes}
            />
            <Text style={{ color: TINTA.suave, fontWeight: '700', fontSize: 15 }}>min</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              style={{ flex: 1, minHeight: 52, borderRadius: 26, borderWidth: 1, borderColor: TINTA.borde, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ color: TINTA.texto, fontWeight: '700', fontSize: 15 }}>Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={handleLog}
              disabled={saving}
              style={{
                flex: 2,
                minHeight: 52,
                backgroundColor: isGym ? CORAL : MENTA,
                borderRadius: 26,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: saving ? 0.6 : 1,
              }}
            >
              <Text style={{ color: TINTA.fondo, fontWeight: '800', fontSize: 15 }}>
                {saving ? 'Guardando…' : 'Anotar'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { user } = useAuth();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'expense'>('expense');

  // Quick register modals
  const [showWaterModal, setShowWaterModal] = useState(false);
  const [showMeditationModal, setShowMeditationModal] = useState(false);
  const [showGymModal, setShowGymModal] = useState(false);
  const [showYogaModal, setShowYogaModal] = useState(false);
  const [showHabitModal, setShowHabitModal] = useState(false);

  // Habits
  const { data: habits } = useHabits();
  const { data: todayLogs } = useTodayHabitLogs();
  const { data: streaks } = useHabitStreaks();
  const toggleHabit = useToggleHabit();
  const createHabit = useCreateHabit();
  const deleteHabit = useDeleteHabit();

  const { data: healthSummary } = useTodayHealthSummary();

  // Resumen del día (notas personales)
  const { data: allNotes = [] } = useNotes();
  const todayStr = fechaLocal();
  const reminderNotes = allNotes.filter((n) => !n.archived && !!n.remind_at && (n.remind_at as string) <= todayStr).slice(0, 3);
  const pinnedNotes = allNotes.filter((n) => n.pinned && !n.archived).slice(0, 3);

  // C: Savings Goals
  const { data: savingsGoals } = useSavingsGoals();

  // D: Weekly dashboard data
  const { data: weekSummary } = useWeekFinancialSummary('week');
  const { data: weekSteps } = useHealthMetrics('steps', 7);
  const { data: weekSleep } = useHealthMetrics('sleep_minutes', 7);

  const vasos = Math.floor((healthSummary?.water_ml || 0) / 250);
  // Días seguidos con 8 vasos o más (hoy cuenta en cuanto se llega)
  const { data: aguaDias } = useHealthMetrics('water_ml', 120);
  const rachaAgua = racha((aguaDias ?? []).filter((d) => d.value >= 2000).map((d) => String(d.date).slice(0, 10)));
  const hitoAgua = hitoRacha(rachaAgua);
  const habitosHechos = todayLogs?.filter((l: any) => l.completed).length || 0;
  const todosHechos = !!habits?.length && habitosHechos === habits.length;

  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.refetchQueries();
    } finally {
      setIsRefreshing(false);
    }
  };

  const invalidateHealth = () => {
    queryClient.invalidateQueries({ queryKey: ['today-health-metrics'] });
    queryClient.invalidateQueries({ queryKey: ['today-mind-wellness'] });
  };

  const openModal = (type: 'income' | 'expense') => {
    setModalType(type);
    setShowAddModal(true);
  };

  return (
    <ScreenContainer className="p-0">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 150 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        className="pb-4"
      >
          <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 24, maxWidth: 640, alignSelf: 'center', width: '100%' }}>

          {/* Cabecera: la fecha y el saludo. Historial, Sueño y agua y Perfil están en el menú de arriba */}
          <View style={{ marginBottom: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingRight: 110 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: TINTA.suave, fontSize: 14, fontWeight: '600', marginBottom: 4 }}>{fechaLarga()}</Text>
              <Titulo size={32}>Hola, {user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'tú'}</Titulo>
            </View>
          </View>

          {/* Grid Principal */}
          <View style={{ flexDirection: 'column', gap: 24 }}>

            {/* Resumen del día */}
            {(pinnedNotes.length > 0 || reminderNotes.length > 0) && (
              <FadeInView style={{ ...TARJETA, padding: 20 }}>
                <Titulo size={22} style={{ marginBottom: 14 }}>Tu día hoy</Titulo>

                {reminderNotes.length > 0 && (
                  <Pressable onPress={() => router.push('/notes')} accessibilityRole="link" style={{ marginBottom: 14, minHeight: 44 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ color: AMBAR, fontSize: 14, fontWeight: '800' }}>⏰ Recordatorios</Text>
                      <Text style={{ color: TINTA.suave, fontSize: 18 }}>›</Text>
                    </View>
                    {reminderNotes.map((n) => (
                      <Text key={n.id} style={{ color: TINTA.texto, fontSize: 14, lineHeight: 21 }} numberOfLines={1}>• {n.title}</Text>
                    ))}
                  </Pressable>
                )}

                {pinnedNotes.length > 0 && (
                  <Pressable onPress={() => router.push('/notes')} accessibilityRole="link" style={{ minHeight: 44 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ color: LILA, fontSize: 14, fontWeight: '800' }}>📌 Notas fijadas</Text>
                      <Text style={{ color: TINTA.suave, fontSize: 18 }}>›</Text>
                    </View>
                    {pinnedNotes.map((n) => (
                      <Text key={n.id} style={{ color: TINTA.texto, fontSize: 14, lineHeight: 21 }} numberOfLines={1}>• {n.title}</Text>
                    ))}
                  </Pressable>
                )}
              </FadeInView>
            )}

            {/* Registros rápidos: cada toque queda en el historial con su hora */}
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Titulo size={22}>Anotar rápido</Titulo>
                <Pressable onPress={() => router.push('/history')} style={{ minHeight: 44, justifyContent: 'center' }}>
                  <Text style={{ color: AMBAR, fontWeight: '800', fontSize: 14 }}>Ver historial ›</Text>
                </Pressable>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {([
                  ['💧', 'Agua', `${vasos} ${vasos === 1 ? 'vaso' : 'vasos'}`, AGUA, () => setShowWaterModal(true)],
                  ['🧘', 'Meditar', 'minutos', LILA, () => setShowMeditationModal(true)],
                  ['💪', 'Gym', healthSummary?.gymSessions ? 'hecho ✓' : 'anotar', CORAL, () => setShowGymModal(true)],
                  ['🧘‍♀️', 'Yoga', healthSummary?.yogaSessions ? 'hecho ✓' : 'anotar', MENTA, () => setShowYogaModal(true)],
                ] as const).map(([emoji, nombre, dato, color, abrir], k) => (
                  <Pressable
                    key={nombre}
                    onPress={abrir}
                    accessibilityRole="button"
                    accessibilityLabel={`Anotar ${nombre}`}
                    style={{ flex: 1, backgroundColor: TINTA.tarjeta, borderWidth: 1, borderColor: TINTA.borde, borderRadius: 24, paddingVertical: 14, paddingHorizontal: 4, alignItems: 'center', minHeight: 96 }}
                  >
                    <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: color, alignItems: 'center', justifyContent: 'center', marginBottom: 6, transform: [{ rotate: k % 2 ? '5deg' : '-5deg' }] }}>
                      <Text style={{ fontSize: 20 }}>{emoji}</Text>
                    </View>
                    <Text style={{ color: TINTA.texto, fontWeight: '800', fontSize: 13 }} numberOfLines={1}>{nombre}</Text>
                    <Text style={{ color: TINTA.suave, fontSize: 12, marginTop: 1 }} numberOfLines={1}>{dato}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Hidratación: ocho vasos, se rellenan al anotar */}
            <Pressable
              onPress={() => setShowWaterModal(true)}
              accessibilityRole="button"
              accessibilityLabel={`Hidratación: ${vasos} de 8 vasos. Toca para anotar`}
              style={{ ...TARJETA, padding: 18 }}
            >
              {hitoAgua && <Sticker texto={`¡${hitoAgua} días!`} color={AGUA} giro={6} style={{ position: 'absolute', top: -12, right: 18 }} />}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Titulo size={22}>Hidratación</Titulo>
                  <Text style={{ color: TINTA.suave, fontSize: 13, marginTop: 2 }}>
                    {rachaAgua >= 2 ? `🔥 ${rachaAgua} días seguidos con 8 vasos` : 'Toca para anotar un vaso'}
                  </Text>
                </View>
                <Text style={{ color: AGUA, fontSize: 15, fontWeight: '800' }}>{vasos} de 8</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <View key={i} style={{ flex: 1, height: 28, borderRadius: 8, backgroundColor: i <= vasos ? AGUA : ELEVADO }} />
                ))}
              </View>
            </Pressable>

            {/* Mis hábitos */}
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Titulo size={22}>Mis hábitos</Titulo>
                <Pressable
                  onPress={() => setShowHabitModal(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Nuevo hábito"
                  style={{ minHeight: 44, paddingHorizontal: 16, borderRadius: 22, backgroundColor: AMBAR, justifyContent: 'center' }}
                >
                  <Text style={{ color: TINTA.fondo, fontSize: 14, fontWeight: '800' }}>+ Nuevo</Text>
                </Pressable>
              </View>

              {(!habits || habits.length === 0) ? (
                <Pressable onPress={() => setShowHabitModal(true)} accessibilityRole="button" style={{ ...TARJETA, borderStyle: 'dashed', padding: 24, alignItems: 'center' }}>
                  <Text style={{ fontSize: 30, marginBottom: 8 }}>🎯</Text>
                  <Text style={{ color: TINTA.texto, fontSize: 15, fontWeight: '700', textAlign: 'center' }}>
                    Agrega tu primer hábito diario
                  </Text>
                  <Text style={{ color: TINTA.suave, fontSize: 13, marginTop: 4, textAlign: 'center' }}>
                    Leer, skincare, vitaminas, ejercicio…
                  </Text>
                </Pressable>
              ) : (
                <View style={{ ...TARJETA, paddingVertical: 6, paddingHorizontal: 14, marginTop: todosHechos ? 8 : 0 }}>
                  {todosHechos && <Sticker texto="¡todo hecho!" giro={5} style={{ position: 'absolute', top: -14, right: 18 }} />}
                  {habits.map((habit: any, k: number) => {
                    const isCompleted = todayLogs?.some((l: any) => l.habit_id === habit.id && l.completed);
                    const streak = streaks?.[habit.id] || 0;

                    return (
                      <View
                        key={habit.id}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderTopWidth: k ? 1 : 0, borderTopColor: TINTA.borde }}
                      >
                        <Pressable
                          onPress={() => toggleHabit.mutate({ habitId: habit.id, completed: !isCompleted })}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: !!isCompleted }}
                          accessibilityLabel={habit.name}
                          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 58 }}
                        >
                          <View style={{
                            width: 30,
                            height: 30,
                            borderRadius: 10,
                            borderWidth: 2,
                            borderColor: isCompleted ? habit.color : TINTA.borde,
                            backgroundColor: isCompleted ? habit.color : 'transparent',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            {isCompleted && <Text style={{ color: TINTA.fondo, fontSize: 16, fontWeight: '900' }}>✓</Text>}
                          </View>
                          <Text style={{ fontSize: 20 }}>{habit.emoji}</Text>
                          <Text
                            numberOfLines={2}
                            style={{
                              flex: 1,
                              color: isCompleted ? TINTA.suave : TINTA.texto,
                              fontSize: 15,
                              fontWeight: '700',
                              textDecorationLine: isCompleted ? 'line-through' : 'none',
                            }}
                          >
                            {habit.name}
                          </Text>
                          {streak > 0 && (
                            <View style={{ backgroundColor: ELEVADO, paddingHorizontal: 10, minHeight: 28, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <Text style={{ fontSize: 12 }}>🔥</Text>
                              <Text style={{ color: TINTA.texto, fontSize: 13, fontWeight: '800' }}>{streak}</Text>
                            </View>
                          )}
                        </Pressable>

                        <Pressable
                          onPress={() => {
                            if (Platform.OS === 'web') {
                              if (confirm(`¿Eliminar "${habit.name}"?`)) deleteHabit.mutate(habit.id);
                            } else {
                              Alert.alert('Eliminar', `¿Eliminar "${habit.name}"?`, [
                                { text: 'No', style: 'cancel' },
                                { text: 'Sí', style: 'destructive', onPress: () => deleteHabit.mutate(habit.id) },
                              ]);
                            }
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={`Eliminar ${habit.name}`}
                          style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Text style={{ color: TINTA.suave, fontSize: 18 }}>×</Text>
                        </Pressable>
                      </View>
                    );
                  })}
                  <Text style={{ color: TINTA.suave, fontSize: 13, fontWeight: '600', textAlign: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: TINTA.borde }}>
                    {habitosHechos} de {habits.length} hechos hoy
                  </Text>
                </View>
              )}
            </View>

            {/* Dinero: anotar un gasto o un ingreso */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {([
                ['expense', '💸', 'Anotar gasto', CORAL],
                ['income', '💰', 'Anotar ingreso', MENTA],
              ] as const).map(([tipo, emoji, texto, color], k) => (
                <Pressable
                  key={tipo}
                  onPress={() => openModal(tipo)}
                  accessibilityRole="button"
                  style={{ ...TARJETA, flex: 1, padding: 16, minHeight: 104, justifyContent: 'space-between', gap: 10 }}
                >
                  <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: color, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: k ? '5deg' : '-5deg' }] }}>
                    <Text style={{ fontSize: 21 }}>{emoji}</Text>
                  </View>
                  <Text style={{ color: TINTA.texto, fontSize: 15, fontWeight: '800' }}>{texto}</Text>
                </Pressable>
              ))}
            </View>

            {/* Metas de ahorro */}
            {savingsGoals && savingsGoals.length > 0 && (
              <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Titulo size={22}>Metas de ahorro</Titulo>
                  <Pressable onPress={() => router.push('/finances')} accessibilityRole="link" style={{ minHeight: 44, justifyContent: 'center' }}>
                    <Text style={{ color: AMBAR, fontSize: 14, fontWeight: '800' }}>Ver todas ›</Text>
                  </Pressable>
                </View>
                <Pressable onPress={() => router.push('/finances')} accessibilityRole="button" style={{ ...TARJETA, paddingVertical: 6, paddingHorizontal: 18 }}>
                  {savingsGoals.slice(0, 3).map((goal: any, k: number) => {
                    const pct = goal.target_amount > 0 ? Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100)) : 0;
                    const goalColor = pct >= 100 ? MENTA : AMBAR;
                    return (
                      <View key={goal.id} style={{ paddingVertical: 14, borderTopWidth: k ? 1 : 0, borderTopColor: TINTA.borde }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                          <Text style={{ color: TINTA.texto, fontSize: 15, fontWeight: '700', flex: 1 }} numberOfLines={1}>{goal.name}</Text>
                          <Text style={{ color: goalColor, fontSize: 14, fontWeight: '800' }}>{pct >= 100 ? '¡Lograda!' : `${pct}%`}</Text>
                        </View>
                        <View style={{ height: 8, backgroundColor: ELEVADO, borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
                          <View style={{ height: '100%', width: `${pct}%`, backgroundColor: goalColor, borderRadius: 4 }} />
                        </View>
                        <Text style={{ color: TINTA.suave, fontSize: 13 }}>${goal.current_amount} de ${goal.target_amount}</Text>
                      </View>
                    );
                  })}
                </Pressable>
              </View>
            )}

            {/* Resumen semanal */}
            <View>
              <Titulo size={22} style={{ marginBottom: 12 }}>Resumen semanal</Titulo>
              <View style={{ ...TARJETA, padding: 18 }}>
                {/* Dinero de los últimos 7 días: tres columnas, sin cajas dentro de la tarjeta */}
                <View style={{ flexDirection: 'row' }}>
                  {([
                    ['Ingresos', weekSummary?.income || 0, MENTA],
                    ['Gastos', weekSummary?.expenses || 0, CORAL],
                    ['Balance', weekSummary?.balance || 0, (weekSummary?.balance || 0) >= 0 ? MENTA : CORAL],
                  ] as const).map(([nombre, valor, color], k) => (
                    <View key={nombre} style={{ flex: 1, paddingLeft: k ? 12 : 0, borderLeftWidth: k ? 1 : 0, borderLeftColor: TINTA.borde }}>
                      <Text style={{ color: TINTA.suave, fontSize: 13, fontWeight: '600', marginBottom: 4 }}>{nombre}</Text>
                      <Text numberOfLines={1} adjustsFontSizeToFit style={{ color, fontSize: 19, fontWeight: '800' }}>${valor}</Text>
                    </View>
                  ))}
                </View>
                <Text style={{ color: TINTA.suave, fontSize: 12.5, marginTop: 6 }}>Últimos 7 días</Text>

                {weekSteps && weekSteps.length > 0 && (
                  <View style={{ marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: TINTA.borde }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10, gap: 8 }}>
                      <Text style={{ color: TINTA.texto, fontSize: 15, fontWeight: '700' }}>Pasos</Text>
                      <Text style={{ color: TINTA.suave, fontSize: 13 }}>
                        {Math.round(weekSteps.reduce((s: number, d: any) => s + d.value, 0) / weekSteps.length)} al día
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
                      {weekSteps.map((d: any, i: number) => {
                        const maxVal = Math.max(...weekSteps.map((s: any) => s.value), 1);
                        const barH = Math.max(4, (d.value / maxVal) * 48);
                        const isToday = i === weekSteps.length - 1;
                        return (
                          <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                            <View style={{ height: 48, width: '100%', justifyContent: 'flex-end', backgroundColor: ELEVADO, borderRadius: 6, overflow: 'hidden' }}>
                              <View style={{ height: barH, backgroundColor: AMBAR, opacity: isToday ? 1 : 0.55, borderRadius: 6 }} />
                            </View>
                            <Text style={{ color: TINTA.suave, fontSize: 12, fontWeight: '700' }}>{diaCorto(d.date)}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}

                {weekSleep && weekSleep.length > 0 && (
                  <View style={{ marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: TINTA.borde }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10, gap: 8 }}>
                      <Text style={{ color: TINTA.texto, fontSize: 15, fontWeight: '700' }}>Sueño</Text>
                      <Text style={{ color: TINTA.suave, fontSize: 13 }}>
                        {(weekSleep.reduce((s: number, d: any) => s + d.value, 0) / weekSleep.length / 60).toFixed(1)} h por noche
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
                      {weekSleep.map((d: any, i: number) => {
                        const hrs = d.value / 60;
                        const barH = Math.max(4, Math.min(hrs / 10, 1) * 48);
                        const color = hrs >= 7 ? LILA : hrs >= 5 ? AMBAR : CORAL;
                        return (
                          <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                            <View style={{ height: 48, width: '100%', justifyContent: 'flex-end', backgroundColor: ELEVADO, borderRadius: 6, overflow: 'hidden' }}>
                              <View style={{ height: barH, backgroundColor: color, borderRadius: 6 }} />
                            </View>
                            <Text style={{ color: TINTA.suave, fontSize: 12, fontWeight: '700' }}>{diaCorto(d.date)}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>
            </View>

          </View>
        </View>

        {/* Modals */}
        {user && (
          <AddTransactionModal
            visible={showAddModal}
            onClose={() => setShowAddModal(false)}
            userId={String(user.id)}
            initialType={modalType}
          />
        )}
        {user && (
          <WaterModal
            visible={showWaterModal}
            onClose={() => setShowWaterModal(false)}
            currentWater={healthSummary?.water_ml || 0}
            onSave={invalidateHealth}
          />
        )}
        {user && (
          <MeditationModal
            visible={showMeditationModal}
            onClose={() => setShowMeditationModal(false)}
            userId={String(user.id)}
            onSave={() => queryClient.invalidateQueries({ queryKey: ['today-mind-wellness'] })}
          />
        )}
        {user && (
          <ActivityModal
            visible={showGymModal}
            onClose={() => setShowGymModal(false)}
            type="gym"
            userId={String(user.id)}
            onSave={invalidateHealth}
          />
        )}
        {user && (
          <ActivityModal
            visible={showYogaModal}
            onClose={() => setShowYogaModal(false)}
            type="yoga"
            userId={String(user.id)}
            onSave={invalidateHealth}
          />
        )}
        <AddHabitModal
          visible={showHabitModal}
          onClose={() => setShowHabitModal(false)}
          onSave={({ name, emoji, color }) => createHabit.mutate({ name, emoji, color })}
        />
      </ScrollView>
    </ScreenContainer>
  );
}
