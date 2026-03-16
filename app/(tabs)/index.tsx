import React, { useState } from 'react';
import { ScrollView, Text, View, Pressable, RefreshControl, Platform, Alert, Modal, TextInput } from 'react-native';
import { supabase } from '@/lib/supabase';
import { ScreenContainer } from '@/components/screen-container';
import { ProgressRing } from '@/components/progress-ring';
import { useColors } from '@/hooks/use-colors';
import { useFinancialSummary } from '@/hooks/use-transactions';
import { useTodayHealthSummary } from '@/hooks/use-health';
import { useDailyAffirmation } from '@/hooks/use-mind-wellness';
import { useHabits, useTodayHabitLogs, useHabitStreaks, useToggleHabit, useCreateHabit, useDeleteHabit } from '@/hooks/use-habits';
import { useTransactions, useFinancialSummary as useWeekFinancialSummary } from '@/hooks/use-transactions';
import { useHealthMetrics } from '@/hooks/use-health';
import { useSavingsGoals } from '@/hooks/use-savings-goals';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { AddTransactionModal } from '@/components/modals/add-transaction-modal';
import { AddHabitModal } from '@/components/modals/add-habit-modal';
import { useAuth } from '@/hooks/use-auth';

// ─── Mini Modals ─────────────────────────────────────────────────────────────

function WaterModal({ visible, onClose, currentWater, userId, onSave }: {
  visible: boolean;
  onClose: () => void;
  currentWater: number;
  userId: string;
  onSave: () => void;
}) {
  const AMOUNTS = [150, 250, 350, 500, 750, 1000];
  const [saving, setSaving] = useState(false);

  const handleAdd = async (ml: number) => {
    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const newTotal = currentWater + ml;
      const { data: existing } = await supabase
        .from('health_metrics')
        .select('id')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle();

      if (existing) {
        await supabase.from('health_metrics').update({ water_ml: newTotal }).eq('id', existing.id);
      } else {
        await supabase.from('health_metrics').insert({ user_id: userId, date: today, water_ml: newTotal });
      }
    } catch (err) {
      console.error('[Water] Save error:', err);
    }
    setSaving(false);
    onSave();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#18181B', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24 }}>
          <Text style={{ color: '#FAFAFA', fontSize: 18, fontWeight: '800', marginBottom: 4 }}>💧 Registrar Agua</Text>
          <Text style={{ color: '#71717A', fontSize: 11, marginBottom: 20, textTransform: 'uppercase', letterSpacing: 2, fontWeight: '700' }}>
            Total hoy: {currentWater} ml
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
            {AMOUNTS.map((ml) => (
              <Pressable
                key={ml}
                onPress={() => handleAdd(ml)}
                disabled={saving}
                style={{
                  flex: 1,
                  minWidth: 90,
                  backgroundColor: 'rgba(59,130,246,0.12)',
                  borderWidth: 1,
                  borderColor: 'rgba(59,130,246,0.3)',
                  borderRadius: 16,
                  paddingVertical: 14,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#60A5FA', fontWeight: '800', fontSize: 15 }}>+{ml >= 1000 ? `${ml / 1000}L` : `${ml}ml`}</Text>
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
    const today = new Date().toISOString().split('T')[0];
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
      const today = new Date().toISOString().split('T')[0];
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
  const { data: affirmation } = useDailyAffirmation();

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
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        className="pb-32"
      >
        <View className="flex-1 px-4 sm:px-6 md:px-8 lg:px-12 py-8 max-w-7xl mx-auto w-full">

          {/* Header */}
          <View className="mb-10 flex-row justify-between items-end">
            <View>
              <Text className="text-sm font-black text-primary uppercase tracking-[4px] mb-1">LIFEOS ELITE</Text>
              <Text className="text-4xl font-bold text-foreground" style={{ color: '#FAFAFA' }}>
                Hola, {user?.name || user?.email?.split('@')[0] || 'Tú'} 👋
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/profile')}
              className="w-12 h-12 rounded-full bg-surface border border-border items-center justify-center"
            >
              <Text className="text-xl">{(user as any)?.gender === 'masculino' ? '👑' : '👸'}</Text>
            </Pressable>
          </View>

          {/* Grid Principal */}
          <View className="flex-row flex-wrap -mx-3">

            {/* Afirmación */}
            <View className="w-full lg:w-2/5 px-3 mb-6">
              <View className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[40px] p-10 shadow-2xl shadow-black/40 relative overflow-hidden h-full justify-center border border-slate-700/50">
                <View className="absolute -top-10 -right-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl opacity-60" />
                <Text className="text-[10px] font-black text-white/40 uppercase tracking-[5px] mb-6">AFIRMACIÓN MAESTRA</Text>
                <Text className="text-3xl font-bold text-white leading-[1.2] mb-8">
                  "{affirmation?.text || 'Asume el sentimiento del deseo cumplido.'}"
                </Text>
                <View className="flex-row items-center gap-3">
                  <View className="h-[1px] flex-1 bg-white/20" />
                  <Text className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Neville Goddard</Text>
                </View>
              </View>
            </View>

            {/* Métricas */}
            <View className="w-full lg:w-3/5 px-3 mb-6">
              <View className="glass-card rounded-[40px] p-8 h-full">
                <View className="flex-row justify-between items-center mb-8">
                  <Text className="text-xl font-bold text-foreground" style={{ color: '#FAFAFA' }}>Métricas Vitales</Text>
                  <View className="bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    <Text className="text-[10px] font-black text-emerald-500 tracking-tighter">EN VIVO</Text>
                  </View>
                </View>
                <View className="flex-row justify-around items-center">
                  <ProgressRing
                    progress={financesProgress}
                    label="Finanzas"
                    value={`$${financialSummary?.income || 0}`}
                    color={colors.success}
                    size={Platform.OS === 'web' ? 130 : 90}
                    onPress={() => router.push('/finances')}
                  />
                  <ProgressRing
                    progress={healthProgress}
                    label="Pasos"
                    value={`${healthSummary?.steps || 0}`}
                    color={colors.primary}
                    size={Platform.OS === 'web' ? 130 : 90}
                    onPress={() => router.push('/health')}
                  />
                  <ProgressRing
                    progress={productivityProgress}
                    label="Ejercicio"
                    value={`${healthSummary?.exerciseMinutes || 0}m`}
                    color={colors.warning}
                    size={Platform.OS === 'web' ? 130 : 90}
                    onPress={() => router.push('/health')}
                  />
                </View>
              </View>
            </View>

            {/* Registros Rápidos */}
            <View className="w-full px-3 mb-8">
              <Text className="text-sm font-black text-muted uppercase tracking-[3px] mb-4" style={{ color: '#A1A1AA' }}>REGISTROS RÁPIDOS</Text>
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => setShowWaterModal(true)}
                  className="flex-1 bg-blue-500/10 border border-blue-500/20 rounded-[24px] p-4 items-center active:scale-95"
                >
                  <Text className="text-2xl mb-1">💧</Text>
                  <Text className="font-bold text-blue-400 text-[9px] uppercase tracking-tight">Agua</Text>
                  <Text className="text-[8px] text-blue-400/60 mt-0.5">{healthSummary?.water_ml || 0}ml</Text>
                </Pressable>

                <Pressable
                  onPress={() => setShowMeditationModal(true)}
                  className="flex-1 bg-purple-500/10 border border-purple-500/20 rounded-[24px] p-4 items-center active:scale-95"
                >
                  <Text className="text-2xl mb-1">🧘</Text>
                  <Text className="font-bold text-purple-400 text-[9px] uppercase tracking-tight">Zen</Text>
                  <Text className="text-[8px] text-purple-400/60 mt-0.5">Registrar</Text>
                </Pressable>

                <Pressable
                  onPress={() => setShowGymModal(true)}
                  className="flex-1 bg-orange-500/10 border border-orange-500/20 rounded-[24px] p-4 items-center active:scale-95"
                >
                  <Text className="text-2xl mb-1">💪</Text>
                  <Text className="font-bold text-orange-400 text-[9px] uppercase tracking-tight">Gym</Text>
                  <Text className="text-[8px] text-orange-400/60 mt-0.5">{healthSummary?.gymSessions ? '✓ Hecho' : 'Registrar'}</Text>
                </Pressable>

                <Pressable
                  onPress={() => setShowYogaModal(true)}
                  className="flex-1 bg-emerald-500/10 border border-emerald-500/20 rounded-[24px] p-4 items-center active:scale-95"
                >
                  <Text className="text-2xl mb-1">🧘‍♀️</Text>
                  <Text className="font-bold text-emerald-400 text-[9px] uppercase tracking-tight">Yoga</Text>
                  <Text className="text-[8px] text-emerald-400/60 mt-0.5">{healthSummary?.yogaSessions ? '✓ Hecho' : 'Registrar'}</Text>
                </Pressable>
              </View>
              <Text className="text-[9px] text-muted/50 text-center mt-2" style={{ color: 'rgba(161,161,170,0.5)' }}>Toca para registrar</Text>
            </View>

            {/* Agua - indicador visual rápido */}
            <View className="w-full px-3 mb-6">
              <Pressable
                onPress={() => setShowWaterModal(true)}
                className="bg-blue-500/8 border border-blue-500/15 rounded-[24px] p-4"
              >
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-blue-400 font-bold text-sm">💧 Hidratación Hoy</Text>
                  <Text className="text-blue-400/80 text-xs font-bold">{healthSummary?.water_ml || 0} / 2000 ml</Text>
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
                <Text className="text-[9px] text-blue-400/50 text-center mt-2 font-medium">Toca para registrar</Text>
              </Pressable>
            </View>

            {/* Mis Hábitos */}
            <View className="w-full px-3 mb-8">
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ color: '#A1A1AA', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 3 }}>
                  MIS HÁBITOS
                </Text>
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
                  <Text style={{ color: '#14B8A6', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>Nuevo</Text>
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
            <View className="w-full px-3 mb-10">
              <View className="flex-row gap-4">
                <Pressable
                  onPress={() => openModal('expense')}
                  className="flex-1 bg-rose-500/10 border border-rose-500/20 rounded-[28px] p-6 items-center active:scale-95"
                >
                  <Text className="text-3xl mb-1">💸</Text>
                  <Text className="font-bold text-rose-400 text-[10px] uppercase tracking-widest mt-2">Gasto</Text>
                </Pressable>
                <Pressable
                  onPress={() => openModal('income')}
                  className="flex-1 bg-emerald-500/10 border border-emerald-500/20 rounded-[28px] p-6 items-center active:scale-95"
                >
                  <Text className="text-3xl mb-1">💰</Text>
                  <Text className="font-bold text-emerald-400 text-[10px] uppercase tracking-widest mt-2">Ingreso</Text>
                </Pressable>
                <Pressable
                  onPress={() => router.push('/ai-coach')}
                  className="flex-1 bg-indigo-500/10 border border-indigo-500/20 rounded-[28px] p-6 items-center active:scale-95"
                >
                  <Text className="text-3xl mb-1">🤖</Text>
                  <Text className="font-bold text-indigo-400 text-[10px] uppercase tracking-widest mt-2">IA Coach</Text>
                </Pressable>
              </View>
            </View>

            {/* C: Metas de Ahorro */}
            {savingsGoals && savingsGoals.length > 0 && (
              <View className="w-full px-3 mb-8">
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={{ color: '#A1A1AA', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 3 }}>
                    METAS DE AHORRO
                  </Text>
                  <Pressable onPress={() => router.push('/finances')} style={{
                    backgroundColor: 'rgba(245,158,11,0.15)',
                    borderWidth: 1,
                    borderColor: 'rgba(245,158,11,0.3)',
                    borderRadius: 12,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                  }}>
                    <Text style={{ color: '#F59E0B', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>Ver todas</Text>
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
            <View className="w-full px-3 mb-8">
              <Text style={{ color: '#A1A1AA', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 12 }}>
                RESUMEN SEMANAL
              </Text>
              <View style={{ backgroundColor: '#18181B', borderWidth: 1, borderColor: '#27272A', borderRadius: 24, padding: 16 }}>
                {/* Financial weekly */}
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                  <View style={{ flex: 1, backgroundColor: 'rgba(16,185,129,0.08)', borderRadius: 16, padding: 12, alignItems: 'center' }}>
                    <Text style={{ color: '#71717A', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Ingresos 7d</Text>
                    <Text style={{ color: '#10B981', fontSize: 18, fontWeight: '800' }}>${weekSummary?.income || 0}</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 16, padding: 12, alignItems: 'center' }}>
                    <Text style={{ color: '#71717A', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Gastos 7d</Text>
                    <Text style={{ color: '#EF4444', fontSize: 18, fontWeight: '800' }}>${weekSummary?.expenses || 0}</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: 'rgba(59,130,246,0.08)', borderRadius: 16, padding: 12, alignItems: 'center' }}>
                    <Text style={{ color: '#71717A', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Balance</Text>
                    <Text style={{ color: (weekSummary?.balance || 0) >= 0 ? '#10B981' : '#EF4444', fontSize: 18, fontWeight: '800' }}>
                      ${weekSummary?.balance || 0}
                    </Text>
                  </View>
                </View>

                {/* Steps mini chart */}
                {weekSteps && weekSteps.length > 0 && (
                  <View style={{ marginBottom: 14 }}>
                    <Text style={{ color: '#71717A', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
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
                    <Text style={{ color: '#71717A', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
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

            {/* Accesos a Módulos */}
            <View className="w-full px-3 mb-8">
              <Text className="text-sm font-black text-muted uppercase tracking-[3px] mb-6" style={{ color: '#A1A1AA' }}>MÓDULOS</Text>
              <View className="flex-row gap-4">
                <Pressable
                  onPress={() => router.push('/productivity')}
                  className="flex-1 glass-card rounded-[32px] p-6 flex-row items-center gap-4 active:scale-95"
                >
                  <View className="w-14 h-14 bg-primary/10 rounded-2xl items-center justify-center">
                    <Text className="text-3xl">🎯</Text>
                  </View>
                  <View>
                    <Text className="font-bold text-foreground" style={{ color: '#FAFAFA' }}>Productividad</Text>
                    <Text className="text-[10px] text-muted font-bold uppercase" style={{ color: '#A1A1AA' }}>Focus & Tareas</Text>
                  </View>
                </Pressable>
                <Pressable
                  onPress={() => router.push('/mind')}
                  className="flex-1 glass-card rounded-[32px] p-6 flex-row items-center gap-4 active:scale-95"
                >
                  <View className="w-14 h-14 bg-warning/10 rounded-2xl items-center justify-center">
                    <Text className="text-3xl">🧘</Text>
                  </View>
                  <View>
                    <Text className="font-bold text-foreground" style={{ color: '#FAFAFA' }}>Mente</Text>
                    <Text className="text-[10px] text-muted font-bold uppercase" style={{ color: '#A1A1AA' }}>Zen & Puntos</Text>
                  </View>
                </Pressable>
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
            userId={String(user.id)}
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
