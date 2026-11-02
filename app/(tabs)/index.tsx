import React, { useState } from 'react';
import { ScrollView, Text, View, Pressable, RefreshControl, Platform, Alert, Modal, TextInput } from 'react-native';
import { supabase } from '@/lib/supabase';
import { ScreenContainer } from '@/components/screen-container';
import { ProgressRing } from '@/components/progress-ring';
import { useColors } from '@/hooks/use-colors';
import { useFinancialSummary } from '@/hooks/use-transactions';
import { useTodayHealthSummary } from '@/hooks/use-health';
import { useHabits, useTodayHabitLogs, useHabitStreaks, useToggleHabit, useCreateHabit, useDeleteHabit } from '@/hooks/use-habits';
import { useTransactions, useFinancialSummary as useWeekFinancialSummary } from '@/hooks/use-transactions';
import { useHealthMetrics } from '@/hooks/use-health';
import { useSavingsGoals } from '@/hooks/use-savings-goals';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { AddTransactionModal } from '@/components/modals/add-transaction-modal';
import { AddHabitModal } from '@/components/modals/add-habit-modal';
import { useAuth } from '@/hooks/use-auth';
import { useNotes } from '@/hooks/use-notes';
import { FadeInView } from '@/components/fade-in-view';
import { WaterModal } from '@/components/water-modal';
import { Titulo, TINTA } from '@/components/decor';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { fechaLocal } from '@/lib/registros';

// «Domingo, 1 de noviembre»: solo la primera letra en mayúscula
const fechaLarga = () => {
  const t = new Date().toLocaleDateString('es-PA', { weekday: 'long', day: 'numeric', month: 'long' });
  return t.charAt(0).toUpperCase() + t.slice(1);
};

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
        <View style={{ backgroundColor: '#18181B', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24 }}>
          <Text style={{ color: '#FAFAFA', fontSize: 18, fontWeight: '800', marginBottom: 4 }}>🧘 Registrar Meditación</Text>
          <Text style={{ color: '#71717A', fontSize: 11, marginBottom: 20, textTransform: 'uppercase', letterSpacing: 2, fontWeight: '700' }}>
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
                  backgroundColor: 'rgba(168,85,247,0.12)',
                  borderWidth: 1,
                  borderColor: 'rgba(168,85,247,0.3)',
                  borderRadius: 16,
                  paddingVertical: 14,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#C084FC', fontWeight: '800', fontSize: 15 }}>{min}m</Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={onClose} style={{ paddingVertical: 12, alignItems: 'center' }}>
            <Text style={{ color: '#71717A', fontWeight: '700', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2 }}>Cancelar</Text>
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
        <View style={{ backgroundColor: '#18181B', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24 }}>
          <Text style={{ color: '#FAFAFA', fontSize: 18, fontWeight: '800', marginBottom: 4 }}>
            {isGym ? '💪 Registrar Gym' : '🧘‍♀️ Registrar Yoga'}
          </Text>
          <Text style={{ color: '#71717A', fontSize: 11, marginBottom: 20, textTransform: 'uppercase', letterSpacing: 2, fontWeight: '700' }}>
            Duración en minutos (opcional)
          </Text>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#27272A',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#3F3F46',
            paddingHorizontal: 16,
            marginBottom: 16,
          }}>
            <TextInput
              style={{ flex: 1, color: '#FAFAFA', fontSize: 16, paddingVertical: 14 }}
              placeholder="60"
              placeholderTextColor="#52525B"
              keyboardType="number-pad"
              value={minutes}
              onChangeText={setMinutes}
            />
            <Text style={{ color: '#71717A', fontWeight: '700' }}>min</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
            <Pressable
              onPress={onClose}
              style={{ flex: 1, backgroundColor: '#27272A', borderRadius: 16, paddingVertical: 14, alignItems: 'center' }}
            >
              <Text style={{ color: '#A1A1AA', fontWeight: '700', fontSize: 13 }}>Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={handleLog}
              disabled={saving}
              style={{
                flex: 2,
                backgroundColor: isGym ? 'rgba(249,115,22,0.9)' : 'rgba(16,185,129,0.9)',
                borderRadius: 16,
                paddingVertical: 14,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#FAFAFA', fontWeight: '800', fontSize: 13 }}>
                {saving ? 'Guardando...' : 'Registrar ✓'}
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
  const colors = useColors();
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

  // Fetch data
  const { data: financialSummary } = useFinancialSummary('day');
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

  // Progress percentages
  const financesProgress = financialSummary && financialSummary.income > 0
    ? Math.min(Math.max((financialSummary.balance / financialSummary.income) * 100, 0), 100)
    : 0;
  const healthProgress = healthSummary
    ? Math.min((healthSummary.steps / 10000) * 100, 100)
    : 0;
  const productivityProgress = healthSummary
    ? Math.min((healthSummary.exerciseMinutes / 30) * 100, 100)
    : 0;
  const waterProgress = healthSummary
    ? Math.min(((healthSummary.water_ml || 0) / 2000) * 100, 100)
    : 0;

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
        <View style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 24, maxWidth: 600, alignSelf: 'center', width: '100%' }}>

          {/* Cabecera: saludo grande, la fecha y los accesos a Historial, Salud y Perfil */}
          <View style={{ marginBottom: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: TINTA.suave, fontSize: 14, fontWeight: '600', marginBottom: 4 }}>{fechaLarga()}</Text>
              <Titulo size={32}>Hola, {user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'tú'}</Titulo>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {([['/history', 'clock.arrow.circlepath', 'Historial'], ['/health', 'heart.fill', 'Salud'], ['/profile', 'person.fill', 'Perfil']] as const).map(([ruta, icono, nombre]) => (
                <Pressable
                  key={ruta}
                  onPress={() => router.push(ruta)}
                  accessibilityLabel={nombre}
                  style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: TINTA.tarjeta, borderWidth: 1, borderColor: TINTA.borde, alignItems: 'center', justifyContent: 'center' }}
                >
                  <IconSymbol name={icono} size={20} color={TINTA.texto} />
                </Pressable>
              ))}
            </View>
          </View>

          {/* Grid Principal */}
          <View style={{ flexDirection: 'column', gap: 16 }}>

            {/* Resumen del día */}
            {(pinnedNotes.length > 0 || reminderNotes.length > 0) && (
              <FadeInView style={{ backgroundColor: '#18181B', borderRadius: 28, padding: 20, borderWidth: 1, borderColor: 'rgba(63,63,70,0.5)' }}>
                <Titulo size={22} style={{ marginBottom: 14 }}>Tu día hoy</Titulo>

                {reminderNotes.length > 0 && (
                  <Pressable onPress={() => router.push('/notes')} style={{ marginBottom: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ color: '#F59E0B', fontSize: 13, fontWeight: '800' }}>⏰ Recordatorios</Text>
                      <Text style={{ color: '#52525B', fontSize: 16 }}>›</Text>
                    </View>
                    {reminderNotes.map((n) => (
                      <Text key={n.id} style={{ color: '#A1A1AA', fontSize: 13, marginBottom: 2 }} numberOfLines={1}>• {n.title}</Text>
                    ))}
                  </Pressable>
                )}

                {pinnedNotes.length > 0 && (
                  <Pressable onPress={() => router.push('/notes')}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ color: '#C084FC', fontSize: 13, fontWeight: '800' }}>📌 Notas fijadas</Text>
                      <Text style={{ color: '#52525B', fontSize: 16 }}>›</Text>
                    </View>
                    {pinnedNotes.map((n) => (
                      <Text key={n.id} style={{ color: '#A1A1AA', fontSize: 13, marginBottom: 2 }} numberOfLines={1}>• {n.title}</Text>
                    ))}
                  </Pressable>
                )}
              </FadeInView>
            )}

            {/* Métricas */}
            <View style={{
              backgroundColor: '#18181B',
              borderRadius: 28,
              padding: 20,
              borderWidth: 1,
              borderColor: '#27272A',
            }}>
              <Titulo size={22} style={{ marginBottom: 16 }}>Cómo vas hoy</Titulo>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
                <ProgressRing
                  progress={financesProgress}
                  label="Finanzas"
                  value={`$${financialSummary?.income || 0}`}
                  color={colors.success}
                  size={85}
                  onPress={() => router.push('/finances')}
                />
                <ProgressRing
                  progress={waterProgress}
                  label="Agua"
                  value={`${Math.round((healthSummary?.water_ml || 0) / 250)} 🥛`}
                  color="#60A5FA"
                  size={85}
                  onPress={() => router.push('/health')}
                />
                <ProgressRing
                  progress={productivityProgress}
                  label="Ejercicio"
                  value={`${healthSummary?.exerciseMinutes || 0}m`}
                  color={colors.warning}
                  size={85}
                  onPress={() => router.push('/health')}
                />
              </View>
            </View>

            {/* Registros rápidos: cada toque queda en el historial con su hora */}
            <View style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
                <Titulo size={22}>Anotar rápido</Titulo>
                <Pressable onPress={() => router.push('/history')} style={{ minHeight: 44, justifyContent: 'center' }}>
                  <Text style={{ color: '#FFB547', fontWeight: '800', fontSize: 14 }}>Ver historial ›</Text>
                </Pressable>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {([
                  ['💧', 'Agua', `${Math.round((healthSummary?.water_ml || 0) / 250)} vasos`, '#7CC4FF', () => setShowWaterModal(true)],
                  ['🧘', 'Meditar', 'minutos', '#C9A7FF', () => setShowMeditationModal(true)],
                  ['💪', 'Gym', healthSummary?.gymSessions ? 'hecho ✓' : 'anotar', '#FF7A6B', () => setShowGymModal(true)],
                  ['🧘‍♀️', 'Yoga', healthSummary?.yogaSessions ? 'hecho ✓' : 'anotar', '#5FD3A8', () => setShowYogaModal(true)],
                ] as const).map(([emoji, nombre, dato, color, abrir], k) => (
                  <Pressable
                    key={nombre}
                    onPress={abrir}
                    accessibilityRole="button"
                    accessibilityLabel={`Anotar ${nombre}`}
                    style={{ flex: 1, backgroundColor: TINTA.tarjeta, borderWidth: 1, borderColor: TINTA.borde, borderRadius: 22, paddingVertical: 14, alignItems: 'center', minHeight: 96 }}
                  >
                    <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: color, alignItems: 'center', justifyContent: 'center', marginBottom: 6, transform: [{ rotate: k % 2 ? '5deg' : '-5deg' }] }}>
                      <Text style={{ fontSize: 20 }}>{emoji}</Text>
                    </View>
                    <Text style={{ color: TINTA.texto, fontWeight: '800', fontSize: 13 }}>{nombre}</Text>
                    <Text style={{ color: TINTA.suave, fontSize: 11.5, marginTop: 1 }}>{dato}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Agua - indicador visual rápido */}
            <View style={{ marginBottom: 16 }}>
              <Pressable
                onPress={() => setShowWaterModal(true)}
                style={{ backgroundColor: 'rgba(59,130,246,0.06)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.15)', borderRadius: 20, padding: 14 }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ color: '#60A5FA', fontWeight: '700', fontSize: 14 }}>💧 Hidratación Hoy</Text>
                  <Text style={{ color: 'rgba(96,165,250,0.8)', fontSize: 12, fontWeight: '700' }}>{Math.round((healthSummary?.water_ml || 0) / 250)} / 8 vasos</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {[1,2,3,4,5,6,7,8].map(i => {
                    const filled = Math.floor((healthSummary?.water_ml || 0) / 250);
                    const isFilled = i <= filled;
                    return (
                      <View
                        key={i}
                        style={{
                          flex: 1,
                          height: 24,
                          borderRadius: 6,
                          backgroundColor: isFilled ? 'rgba(96,165,250,0.7)' : 'rgba(59,130,246,0.1)',
                          borderWidth: 1,
                          borderColor: isFilled ? 'rgba(96,165,250,0.4)' : 'rgba(59,130,246,0.2)',
                        }}
                      />
                    );
                  })}
                </View>
                <Text style={{ color: 'rgba(96,165,250,0.5)', fontSize: 9, textAlign: 'center', marginTop: 6, fontWeight: '500' }}>Toca para registrar</Text>
              </Pressable>
            </View>

            {/* Mis Hábitos */}
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Titulo size={22}>Mis hábitos</Titulo>
                <Pressable onPress={() => setShowHabitModal(true)} style={{
                  backgroundColor: 'rgba(20,184,166,0.15)',
                  borderWidth: 1,
                  borderColor: 'rgba(20,184,166,0.3)',
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                }}>
                  <Text style={{ color: '#14B8A6', fontSize: 14, fontWeight: '800' }}>+</Text>
                  <Text style={{ color: '#14B8A6', fontSize: 12, fontWeight: '800' }}>Nuevo</Text>
                </Pressable>
              </View>

              {(!habits || habits.length === 0) ? (
                <View style={{
                  backgroundColor: 'rgba(20,184,166,0.06)',
                  borderWidth: 1,
                  borderColor: 'rgba(20,184,166,0.15)',
                  borderRadius: 24,
                  padding: 24,
                  alignItems: 'center',
                }}>
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>🎯</Text>
                  <Text style={{ color: '#A1A1AA', fontSize: 13, fontWeight: '600', textAlign: 'center' }}>
                    Agrega tu primer hábito diario
                  </Text>
                  <Text style={{ color: '#71717A', fontSize: 11, marginTop: 4, textAlign: 'center' }}>
                    Leer, skincare, vitaminas, ejercicio...
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 8 }}>
                  {habits.map((habit: any) => {
                    const isCompleted = todayLogs?.some((l: any) => l.habit_id === habit.id && l.completed);
                    const streak = streaks?.[habit.id] || 0;

                    return (
                      <Pressable
                        key={habit.id}
                        onPress={() => toggleHabit.mutate({ habitId: habit.id, completed: !isCompleted })}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: isCompleted ? `${habit.color}15` : '#18181B',
                          borderWidth: 1,
                          borderColor: isCompleted ? `${habit.color}40` : '#27272A',
                          borderRadius: 20,
                          padding: 14,
                          gap: 12,
                        }}
                      >
                        {/* Checkbox */}
                        <View style={{
                          width: 32,
                          height: 32,
                          borderRadius: 10,
                          borderWidth: 2,
                          borderColor: isCompleted ? habit.color : '#3F3F46',
                          backgroundColor: isCompleted ? habit.color : 'transparent',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          {isCompleted && (
                            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>✓</Text>
                          )}
                        </View>

                        {/* Emoji + Name */}
                        <Text style={{ fontSize: 20 }}>{habit.emoji}</Text>
                        <Text style={{
                          flex: 1,
                          color: isCompleted ? '#71717A' : '#FAFAFA',
                          fontSize: 14,
                          fontWeight: '700',
                          textDecorationLine: isCompleted ? 'line-through' : 'none',
                        }}>
                          {habit.name}
                        </Text>

                        {/* Streak badge */}
                        {streak > 0 && (
                          <View style={{
                            backgroundColor: `${habit.color}20`,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 8,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 3,
                          }}>
                            <Text style={{ fontSize: 10 }}>🔥</Text>
                            <Text style={{ color: habit.color, fontSize: 11, fontWeight: '800' }}>{streak}</Text>
                          </View>
                        )}

                        {/* Delete */}
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
                          style={{ padding: 4 }}
                        >
                          <Text style={{ color: '#52525B', fontSize: 14 }}>🗑</Text>
                        </Pressable>
                      </Pressable>
                    );
                  })}

                  {/* Summary */}
                  {habits.length > 0 && (
                    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <Text style={{ color: '#71717A', fontSize: 11, fontWeight: '600' }}>
                        {todayLogs?.filter((l: any) => l.completed).length || 0}/{habits.length} completados hoy
                      </Text>
                      {todayLogs && habits.length > 0 && (todayLogs.filter((l: any) => l.completed).length === habits.length) && (
                        <Text style={{ fontSize: 14 }}>🎉</Text>
                      )}
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Acciones de Finanzas e IA */}
            <View style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable
                  onPress={() => openModal('expense')}
                  style={{ flex: 1, backgroundColor: 'rgba(244,63,94,0.1)', borderWidth: 1, borderColor: 'rgba(244,63,94,0.2)', borderRadius: 22, paddingVertical: 18, alignItems: 'center' }}
                >
                  <Text style={{ fontSize: 28, marginBottom: 4 }}>💸</Text>
                  <Text style={{ color: '#FB7185', fontWeight: '800', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Gasto</Text>
                </Pressable>
                <Pressable
                  onPress={() => openModal('income')}
                  style={{ flex: 1, backgroundColor: 'rgba(16,185,129,0.1)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)', borderRadius: 22, paddingVertical: 18, alignItems: 'center' }}
                >
                  <Text style={{ fontSize: 28, marginBottom: 4 }}>💰</Text>
                  <Text style={{ color: '#34D399', fontWeight: '800', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Ingreso</Text>
                </Pressable>
                
              </View>
            </View>

            {/* C: Metas de Ahorro */}
            {savingsGoals && savingsGoals.length > 0 && (
              <View style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Titulo size={22}>Metas de ahorro</Titulo>
                  <Pressable onPress={() => router.push('/finances')} style={{
                    backgroundColor: 'rgba(245,158,11,0.15)',
                    borderWidth: 1,
                    borderColor: 'rgba(245,158,11,0.3)',
                    borderRadius: 12,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                  }}>
                    <Text style={{ color: '#F59E0B', fontSize: 12, fontWeight: '800' }}>Ver todas</Text>
                  </Pressable>
                </View>
                <View style={{ gap: 10 }}>
                  {savingsGoals.slice(0, 3).map((goal: any) => {
                    const pct = goal.target_amount > 0 ? Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100)) : 0;
                    const goalColor = pct >= 100 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#3B82F6';
                    return (
                      <Pressable
                        key={goal.id}
                        onPress={() => router.push('/finances')}
                        style={{
                          backgroundColor: '#18181B',
                          borderWidth: 1,
                          borderColor: '#27272A',
                          borderRadius: 20,
                          padding: 16,
                        }}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <Text style={{ color: '#FAFAFA', fontSize: 14, fontWeight: '700', flex: 1 }} numberOfLines={1}>{goal.name}</Text>
                          <Text style={{ color: goalColor, fontSize: 12, fontWeight: '800' }}>{pct}%</Text>
                        </View>
                        <View style={{ height: 8, backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
                          <View style={{ height: '100%', width: `${pct}%`, backgroundColor: goalColor, borderRadius: 99 }} />
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ color: '#71717A', fontSize: 11, fontWeight: '600' }}>${goal.current_amount}</Text>
                          <Text style={{ color: '#52525B', fontSize: 11, fontWeight: '600' }}>Meta: ${goal.target_amount}</Text>
                        </View>
                        {pct >= 100 && (
                          <Text style={{ color: '#10B981', fontSize: 10, fontWeight: '700', marginTop: 4, textAlign: 'center' }}>
                            🎉 ¡Meta alcanzada!
                          </Text>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* D: Resumen Semanal */}
            <View style={{ marginBottom: 20 }}>
              <Titulo size={22} style={{ marginBottom: 12 }}>Resumen semanal</Titulo>
              <View style={{ backgroundColor: '#18181B', borderWidth: 1, borderColor: '#27272A', borderRadius: 24, padding: 16 }}>
                {/* Financial weekly */}
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                  <View style={{ flex: 1, backgroundColor: 'rgba(16,185,129,0.08)', borderRadius: 16, padding: 12, alignItems: 'center' }}>
                    <Text style={{ color: '#71717A', fontSize: 12, fontWeight: '700', marginBottom: 4 }}>Ingresos 7d</Text>
                    <Text style={{ color: '#10B981', fontSize: 18, fontWeight: '800' }}>${weekSummary?.income || 0}</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 16, padding: 12, alignItems: 'center' }}>
                    <Text style={{ color: '#71717A', fontSize: 12, fontWeight: '700', marginBottom: 4 }}>Gastos 7d</Text>
                    <Text style={{ color: '#EF4444', fontSize: 18, fontWeight: '800' }}>${weekSummary?.expenses || 0}</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: 'rgba(59,130,246,0.08)', borderRadius: 16, padding: 12, alignItems: 'center' }}>
                    <Text style={{ color: '#71717A', fontSize: 12, fontWeight: '700', marginBottom: 4 }}>Balance</Text>
                    <Text style={{ color: (weekSummary?.balance || 0) >= 0 ? '#10B981' : '#EF4444', fontSize: 18, fontWeight: '800' }}>
                      ${weekSummary?.balance || 0}
                    </Text>
                  </View>
                </View>

                {/* Steps mini chart */}
                {weekSteps && weekSteps.length > 0 && (
                  <View style={{ marginBottom: 14 }}>
                    <Text style={{ color: '#71717A', fontSize: 12, fontWeight: '700', marginBottom: 8 }}>
                      Pasos (7 días)
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 40 }}>
                      {weekSteps.map((d: any, i: number) => {
                        const maxVal = Math.max(...weekSteps.map((s: any) => s.value), 1);
                        const barH = Math.max(4, (d.value / maxVal) * 40);
                        const isToday = i === weekSteps.length - 1;
                        return (
                          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                            <View style={{
                              height: barH,
                              width: '100%',
                              backgroundColor: isToday ? 'rgba(20,184,166,0.5)' : 'rgba(20,184,166,0.2)',
                              borderRadius: 4,
                              borderWidth: isToday ? 1 : 0,
                              borderColor: 'rgba(20,184,166,0.6)',
                            }} />
                            <Text style={{ color: '#52525B', fontSize: 7, fontWeight: '700', marginTop: 2 }}>
                              {new Date(d.date).toLocaleDateString('es-ES', { weekday: 'narrow' })}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                    <Text style={{ color: '#52525B', fontSize: 9, textAlign: 'right', marginTop: 2 }}>
                      Promedio: {Math.round(weekSteps.reduce((s: number, d: any) => s + d.value, 0) / weekSteps.length)} pasos/día
                    </Text>
                  </View>
                )}

                {/* Sleep mini chart */}
                {weekSleep && weekSleep.length > 0 && (
                  <View>
                    <Text style={{ color: '#71717A', fontSize: 12, fontWeight: '700', marginBottom: 8 }}>
                      Sueño (7 días)
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 40 }}>
                      {weekSleep.map((d: any, i: number) => {
                        const hrs = d.value / 60;
                        const barH = Math.max(4, (hrs / 10) * 40);
                        const color = hrs >= 7 ? '#8B5CF6' : hrs >= 5 ? '#F59E0B' : '#EF4444';
                        return (
                          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                            <View style={{ height: barH, width: '100%', backgroundColor: `${color}40`, borderRadius: 4 }} />
                            <Text style={{ color: '#52525B', fontSize: 7, fontWeight: '700', marginTop: 2 }}>
                              {new Date(d.date).toLocaleDateString('es-ES', { weekday: 'narrow' })}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                    <Text style={{ color: '#52525B', fontSize: 9, textAlign: 'right', marginTop: 2 }}>
                      Promedio: {(weekSleep.reduce((s: number, d: any) => s + d.value, 0) / weekSleep.length / 60).toFixed(1)}h/noche
                    </Text>
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
