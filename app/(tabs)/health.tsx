import React, { useState } from 'react';
import { ScrollView, Text, View, Pressable, RefreshControl, Platform, Modal, TextInput, Alert } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { ProgressRing } from '@/components/progress-ring';
import { BarChart, LineChart } from '@/components/charts';
import { AddHealthModal } from '@/components/modals/add-health-modal';
import { useColors } from '@/hooks/use-colors';
import { useHealthMetrics, useTodayHealthMetrics, useManualHealthEntries } from '@/hooks/use-health';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { useHealthKitSync } from '@/hooks/use-healthkit-sync';

// ─── Activity Modal ───────────────────────────────────────────────────────────

function ActivityLogModal({ visible, onClose, activityType, userId, onSave }: {
  visible: boolean;
  onClose: () => void;
  activityType: 'gym' | 'yoga' | 'massage' | 'food';
  userId: string;
  onSave: () => void;
}) {
  const [minutes, setMinutes] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const config = {
    gym: { emoji: '💪', label: 'Gimnasio', color: '#F97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)' },
    yoga: { emoji: '🧘‍♀️', label: 'Yoga', color: '#10B981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' },
    massage: { emoji: '💆', label: 'Masaje', color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.3)' },
    food: { emoji: '🍎', label: 'Comida', color: '#EAB308', bg: 'rgba(234,179,8,0.12)', border: 'rgba(234,179,8,0.3)' },
  };
  const c = config[activityType];

  const handleSave = async () => {
    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const fields: any = {};
      if (activityType === 'gym') fields.gym_session = true;
      if (activityType === 'yoga') fields.yoga_session = true;
      if (activityType === 'massage') fields.massage_session = true;
      if (activityType === 'food') fields.meals_tracked = true;
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
      console.error('[Health Activity] Save error:', err);
    }
    setSaving(false);
    setMinutes('');
    setNotes('');
    onSave();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#18181B', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 36 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: c.bg, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 22 }}>{c.emoji}</Text>
            </View>
            <View>
              <Text style={{ color: '#FAFAFA', fontSize: 18, fontWeight: '800' }}>Registrar {c.label}</Text>
              <Text style={{ color: '#71717A', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, fontWeight: '700', marginTop: 2 }}>
                Sesión de hoy
              </Text>
            </View>
          </View>

          {(activityType === 'gym' || activityType === 'yoga') && (
            <View style={{ marginBottom: 14 }}>
              <Text style={{ color: '#A1A1AA', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                Duración (min) — opcional
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#27272A', borderRadius: 14, borderWidth: 1, borderColor: '#3F3F46', paddingHorizontal: 14 }}>
                <TextInput
                  style={{ flex: 1, color: '#FAFAFA', fontSize: 16, paddingVertical: 12 }}
                  placeholder="60"
                  placeholderTextColor="#52525B"
                  keyboardType="number-pad"
                  value={minutes}
                  onChangeText={setMinutes}
                />
                <Text style={{ color: '#71717A', fontWeight: '700' }}>min</Text>
              </View>
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
            <Pressable
              onPress={onClose}
              style={{ flex: 1, backgroundColor: '#27272A', borderRadius: 16, paddingVertical: 14, alignItems: 'center' }}
            >
              <Text style={{ color: '#A1A1AA', fontWeight: '700' }}>Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={saving}
              style={{ flex: 2, backgroundColor: c.color, borderRadius: 16, paddingVertical: 14, alignItems: 'center', opacity: saving ? 0.6 : 1 }}
            >
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>
                {saving ? 'Guardando...' : `✓ Registrar ${c.label}`}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Water Modal ──────────────────────────────────────────────────────────────

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
        <View style={{ backgroundColor: '#18181B', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 36 }}>
          <Text style={{ color: '#FAFAFA', fontSize: 18, fontWeight: '800', marginBottom: 4 }}>💧 Registrar Agua</Text>
          <Text style={{ color: '#71717A', fontSize: 11, marginBottom: 20, textTransform: 'uppercase', letterSpacing: 2, fontWeight: '700' }}>
            Total hoy: {currentWater} ml — Meta: 2000 ml
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
                <Text style={{ color: '#60A5FA', fontWeight: '800', fontSize: 15 }}>
                  +{ml >= 1000 ? `${ml / 1000}L` : `${ml}ml`}
                </Text>
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

// ─── Sleep Modal ──────────────────────────────────────────────────────────────

function SleepModal({ visible, onClose, userId, currentData, onSave }: {
  visible: boolean;
  onClose: () => void;
  userId: string;
  currentData: { sleepBedtime?: string | null; sleepWaketime?: string | null; sleepQuality?: number };
  onSave: () => void;
}) {
  const [bedHour, setBedHour] = useState('23');
  const [bedMin, setBedMin] = useState('00');
  const [wakeHour, setWakeHour] = useState('07');
  const [wakeMin, setWakeMin] = useState('00');
  const [quality, setQuality] = useState(3);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (visible && currentData) {
      if (currentData.sleepBedtime) {
        const [h, m] = currentData.sleepBedtime.split(':');
        setBedHour(h); setBedMin(m);
      }
      if (currentData.sleepWaketime) {
        const [h, m] = currentData.sleepWaketime.split(':');
        setWakeHour(h); setWakeMin(m);
      }
      if (currentData.sleepQuality) setQuality(currentData.sleepQuality);
    }
  }, [visible]);

  const calcMinutes = () => {
    const bed = parseInt(bedHour) * 60 + parseInt(bedMin);
    const wake = parseInt(wakeHour) * 60 + parseInt(wakeMin);
    return wake > bed ? wake - bed : (1440 - bed) + wake;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const sleepMins = calcMinutes();
      const fields = {
        sleep_minutes: sleepMins,
        sleep_bedtime: `${bedHour.padStart(2, '0')}:${bedMin.padStart(2, '0')}`,
        sleep_waketime: `${wakeHour.padStart(2, '0')}:${wakeMin.padStart(2, '0')}`,
        sleep_quality: quality,
      };

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
      console.error('[Sleep] Save error:', err);
    }
    setSaving(false);
    onSave();
    onClose();
  };

  const sleepHrs = (calcMinutes() / 60).toFixed(1);
  const qualityLabels = ['', 'Muy mal', 'Mal', 'Normal', 'Bien', 'Excelente'];
  const qualityColors = ['', '#EF4444', '#F97316', '#EAB308', '#10B981', '#14B8A6'];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#18181B', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 36 }}>
          <Text style={{ color: '#FAFAFA', fontSize: 18, fontWeight: '800', marginBottom: 4 }}>🌙 Registrar Sueño</Text>
          <Text style={{ color: '#71717A', fontSize: 11, marginBottom: 20, textTransform: 'uppercase', letterSpacing: 2, fontWeight: '700' }}>
            Total calculado: {sleepHrs}h
          </Text>

          {/* Bedtime */}
          <Text style={{ color: '#A1A1AA', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Hora de dormir
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#27272A', borderRadius: 14, borderWidth: 1, borderColor: '#3F3F46', paddingHorizontal: 14 }}>
              <TextInput
                style={{ flex: 1, color: '#FAFAFA', fontSize: 24, fontWeight: '800', paddingVertical: 10, textAlign: 'center' }}
                keyboardType="number-pad"
                maxLength={2}
                value={bedHour}
                onChangeText={(t) => { const n = parseInt(t); if (!isNaN(n) && n >= 0 && n <= 23) setBedHour(t); else if (t === '') setBedHour(''); }}
              />
            </View>
            <Text style={{ color: '#71717A', fontSize: 24, fontWeight: '800' }}>:</Text>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#27272A', borderRadius: 14, borderWidth: 1, borderColor: '#3F3F46', paddingHorizontal: 14 }}>
              <TextInput
                style={{ flex: 1, color: '#FAFAFA', fontSize: 24, fontWeight: '800', paddingVertical: 10, textAlign: 'center' }}
                keyboardType="number-pad"
                maxLength={2}
                value={bedMin}
                onChangeText={(t) => { const n = parseInt(t); if (!isNaN(n) && n >= 0 && n <= 59) setBedMin(t); else if (t === '') setBedMin(''); }}
              />
            </View>
            <Text style={{ color: '#8B5CF6', fontSize: 12, fontWeight: '800' }}>PM</Text>
          </View>

          {/* Wake time */}
          <Text style={{ color: '#A1A1AA', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Hora de despertar
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#27272A', borderRadius: 14, borderWidth: 1, borderColor: '#3F3F46', paddingHorizontal: 14 }}>
              <TextInput
                style={{ flex: 1, color: '#FAFAFA', fontSize: 24, fontWeight: '800', paddingVertical: 10, textAlign: 'center' }}
                keyboardType="number-pad"
                maxLength={2}
                value={wakeHour}
                onChangeText={(t) => { const n = parseInt(t); if (!isNaN(n) && n >= 0 && n <= 23) setWakeHour(t); else if (t === '') setWakeHour(''); }}
              />
            </View>
            <Text style={{ color: '#71717A', fontSize: 24, fontWeight: '800' }}>:</Text>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#27272A', borderRadius: 14, borderWidth: 1, borderColor: '#3F3F46', paddingHorizontal: 14 }}>
              <TextInput
                style={{ flex: 1, color: '#FAFAFA', fontSize: 24, fontWeight: '800', paddingVertical: 10, textAlign: 'center' }}
                keyboardType="number-pad"
                maxLength={2}
                value={wakeMin}
                onChangeText={(t) => { const n = parseInt(t); if (!isNaN(n) && n >= 0 && n <= 59) setWakeMin(t); else if (t === '') setWakeMin(''); }}
              />
            </View>
            <Text style={{ color: '#F59E0B', fontSize: 12, fontWeight: '800' }}>AM</Text>
          </View>

          {/* Quality */}
          <Text style={{ color: '#A1A1AA', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Calidad del sueño
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
            {[1, 2, 3, 4, 5].map((q) => (
              <Pressable
                key={q}
                onPress={() => setQuality(q)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 14,
                  alignItems: 'center',
                  backgroundColor: quality >= q ? `${qualityColors[q]}20` : '#27272A',
                  borderWidth: 2,
                  borderColor: quality >= q ? qualityColors[q] : '#3F3F46',
                }}
              >
                <Text style={{ fontSize: 18 }}>{q <= 2 ? '😴' : q === 3 ? '😐' : q === 4 ? '😊' : '🌟'}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={{ color: qualityColors[quality], fontSize: 12, fontWeight: '700', textAlign: 'center', marginBottom: 20 }}>
            {qualityLabels[quality]}
          </Text>

          {/* Actions */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: '#27272A', borderRadius: 16, paddingVertical: 14, alignItems: 'center' }}>
              <Text style={{ color: '#A1A1AA', fontWeight: '700' }}>Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={saving}
              style={{ flex: 2, backgroundColor: '#8B5CF6', borderRadius: 16, paddingVertical: 14, alignItems: 'center', opacity: saving ? 0.6 : 1 }}
            >
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>
                {saving ? 'Guardando...' : '🌙 Registrar Sueño'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Meal Plan ────────────────────────────────────────────────────────────────

const WEEKLY_PLAN = [
  { day: 'Lunes', meals: ['🥣 Avena + proteína + fruta', '🥗 Ensalada + pollo + arroz', '🍎 Frutos secos', '🐟 Salmón + verduras al vapor'] },
  { day: 'Martes', meals: ['🍳 Huevos + aguacate + tostada', '🌯 Wrap de atún + vegetales', '🍌 Plátano + mantequilla de maní', '🍗 Pollo + quinoa + brócoli'] },
  { day: 'Miércoles', meals: ['🥤 Smoothie proteico + nueces', '🍲 Lentejas + arroz + zanahoria', '🧃 Jugo verde + almendras', '🥩 Carne magra + patata + espinaca'] },
  { day: 'Jueves', meals: ['🥣 Yogur griego + granola + miel', '🍱 Arroz integral + pavo + pepino', '🍇 Frutas variadas', '🐠 Tilapia + vegetales asados'] },
  { day: 'Viernes', meals: ['🍳 Tortilla de claras + aguacate', '🥙 Ensalada mediterránea + pollo', '🥜 Mix de nueces', '🍗 Pollo al horno + ensalada verde'] },
  { day: 'Sábado', meals: ['🥞 Pancakes proteicos + miel', '🌮 Bowl de quinoa + vegetales', '🍓 Fresas + yogur', '🥩 Chuleta + arroz + espárragos'] },
  { day: 'Domingo', meals: ['🍌 Batido verde + tostada proteica', '🍜 Sopa de pollo con verduras', '🍎 Manzana + queso cottage', '🐟 Atún + pasta integral + pesto'] },
];

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function HealthScreen() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWaterModal, setShowWaterModal] = useState(false);
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [showMealPlan, setShowMealPlan] = useState(false);
  const [activityModal, setActivityModal] = useState<'gym' | 'yoga' | 'massage' | 'food' | null>(null);

  const { syncNow } = useHealthKitSync(user?.id);

  const { data: todayMetrics } = useTodayHealthMetrics();
  const { data: stepsData } = useHealthMetrics('steps', 7);
  const { data: sleepData } = useHealthMetrics('sleep_minutes', 7);
  const { data: manualEntries } = useManualHealthEntries(7);

  const stepsChartData = (stepsData || []).map((item) => ({
    x: new Date(item.date).toLocaleDateString('es-ES', { weekday: 'short' }),
    y: item.value,
  }));

  const sleepChartData = (sleepData || []).map((item) => ({
    x: new Date(item.date).toLocaleDateString('es-ES', { weekday: 'short' }),
    y: Math.round((item.value / 60) * 10) / 10,
  }));

  const stepsProgress = todayMetrics ? Math.min((todayMetrics.steps / 10000) * 100, 100) : 0;
  const sleepProgress = todayMetrics ? Math.min((todayMetrics.sleepHours / 8) * 100, 100) : 0;
  const exerciseProgress = todayMetrics ? Math.min((todayMetrics.exerciseMinutes / 30) * 100, 100) : 0;
  const waterProgress = todayMetrics ? Math.min((todayMetrics.water_ml / 2000) * 100, 100) : 0;

  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.refetchQueries();
    } finally {
      setIsRefreshing(false);
    }
  };

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['today-health-metrics'] });

  const glassCount = Math.floor((todayMetrics?.water_ml || 0) / 250);

  const today = new Date().getDay(); // 0=Sunday
  const dayIndex = today === 0 ? 6 : today - 1;
  const todayPlan = WEEKLY_PLAN[dayIndex];

  return (
    <ScreenContainer className="p-0">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View className="px-6 pt-6 pb-4 flex-row justify-between items-center">
          <View>
            <Text className="text-3xl font-bold text-foreground" style={{ color: '#FAFAFA' }}>Salud</Text>
            <Text className="text-sm text-muted mt-1" style={{ color: '#A1A1AA' }}>Tu bienestar en tiempo real</Text>
          </View>
          <Pressable
            onPress={() => setShowAddModal(true)}
            className="w-12 h-12 rounded-full bg-primary items-center justify-center shadow-lg shadow-primary/30 active:scale-95"
          >
            <Text className="text-background text-3xl font-bold" style={{ marginTop: -2 }}>+</Text>
          </Pressable>
        </View>

        {/* Progress Rings */}
        <View className="px-6 mb-6">
          <View className="glass-card rounded-3xl p-6">
            <Text className="text-base font-bold text-foreground mb-6" style={{ color: '#FAFAFA' }}>Progreso Hoy</Text>
            <View className="flex-row justify-around items-center">
              <ProgressRing progress={stepsProgress} label="Pasos" value={`${todayMetrics?.steps || 0}`} color={colors.primary} size={Platform.OS === 'web' ? 110 : 80} />
              <ProgressRing progress={sleepProgress} label="Sueño" value={`${todayMetrics?.sleepHours?.toFixed(1) || 0}h`} color={colors.success} size={Platform.OS === 'web' ? 110 : 80} />
              <ProgressRing progress={exerciseProgress} label="Ejercicio" value={`${todayMetrics?.exerciseMinutes || 0}m`} color={colors.warning} size={Platform.OS === 'web' ? 110 : 80} />
              <ProgressRing progress={waterProgress} label="Agua" value={`${todayMetrics?.water_ml || 0}ml`} color="#60A5FA" size={Platform.OS === 'web' ? 110 : 80} />
            </View>
          </View>
        </View>

        {/* Apple Health (iOS) */}
        {Platform.OS === 'ios' && (
          <View className="mx-6 mb-6 glass-card rounded-3xl p-5 flex-row justify-between items-center">
            <View className="flex-1">
              <Text className="text-sm font-bold text-primary">📱 Apple Health Conectado</Text>
              <Text className="text-xs text-muted mt-1" style={{ color: '#A1A1AA' }}>Pasos, sueño, calorías — auto-sync cada hora.</Text>
            </View>
            <Pressable
              onPress={async () => { await syncNow(); await queryClient.refetchQueries(); }}
              className="ml-4 bg-primary/10 border border-primary/20 rounded-2xl px-4 py-2 active:bg-primary/20"
            >
              <Text className="text-primary font-bold text-xs">SYNC</Text>
            </Pressable>
          </View>
        )}

        {/* Sleep Tracker */}
        <View className="px-6 mb-6">
          <View style={{
            backgroundColor: 'rgba(139,92,246,0.06)',
            borderWidth: 1,
            borderColor: 'rgba(139,92,246,0.15)',
            borderRadius: 28,
            padding: 20,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: '#FAFAFA', fontSize: 16, fontWeight: '800' }}>🌙 Sueño</Text>
              <Pressable
                onPress={() => setShowSleepModal(true)}
                style={{
                  backgroundColor: 'rgba(139,92,246,0.15)',
                  borderWidth: 1,
                  borderColor: 'rgba(139,92,246,0.3)',
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <Text style={{ color: '#A78BFA', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>
                  {todayMetrics?.sleepBedtime ? 'Editar' : '+ Registrar'}
                </Text>
              </Pressable>
            </View>

            {todayMetrics?.sleepBedtime ? (
              <>
                {/* Time display */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 16 }}>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ color: '#71717A', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Dormí</Text>
                    <Text style={{ color: '#C4B5FD', fontSize: 28, fontWeight: '800' }}>{todayMetrics.sleepBedtime}</Text>
                  </View>
                  <Text style={{ color: '#52525B', fontSize: 20 }}>→</Text>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ color: '#71717A', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Desperté</Text>
                    <Text style={{ color: '#FCD34D', fontSize: 28, fontWeight: '800' }}>{todayMetrics.sleepWaketime}</Text>
                  </View>
                </View>

                {/* Duration + Quality */}
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                  <View style={{
                    flex: 1,
                    backgroundColor: 'rgba(139,92,246,0.1)',
                    borderRadius: 16,
                    padding: 14,
                    alignItems: 'center',
                  }}>
                    <Text style={{ color: '#71717A', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Duración</Text>
                    <Text style={{ color: '#FAFAFA', fontSize: 22, fontWeight: '800' }}>{todayMetrics.sleepHours.toFixed(1)}h</Text>
                    <Text style={{ color: todayMetrics.sleepHours >= 7 ? '#10B981' : todayMetrics.sleepHours >= 5 ? '#F59E0B' : '#EF4444', fontSize: 10, fontWeight: '700', marginTop: 2 }}>
                      {todayMetrics.sleepHours >= 7 ? 'Óptimo' : todayMetrics.sleepHours >= 5 ? 'Aceptable' : 'Insuficiente'}
                    </Text>
                  </View>
                  <View style={{
                    flex: 1,
                    backgroundColor: 'rgba(139,92,246,0.1)',
                    borderRadius: 16,
                    padding: 14,
                    alignItems: 'center',
                  }}>
                    <Text style={{ color: '#71717A', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Calidad</Text>
                    <Text style={{ fontSize: 22 }}>
                      {todayMetrics.sleepQuality <= 2 ? '😴' : todayMetrics.sleepQuality === 3 ? '😐' : todayMetrics.sleepQuality === 4 ? '😊' : '🌟'}
                    </Text>
                    <Text style={{ color: '#A78BFA', fontSize: 10, fontWeight: '700', marginTop: 2 }}>
                      {['', 'Muy mal', 'Mal', 'Normal', 'Bien', 'Excelente'][todayMetrics.sleepQuality] || '—'}
                    </Text>
                  </View>
                </View>

                {/* Sleep quality progress bar */}
                <View style={{ height: 6, backgroundColor: 'rgba(139,92,246,0.1)', borderRadius: 99, overflow: 'hidden' }}>
                  <View style={{
                    height: '100%',
                    width: `${Math.min((todayMetrics.sleepHours / 8) * 100, 100)}%`,
                    backgroundColor: '#8B5CF6',
                    borderRadius: 99,
                  }} />
                </View>
                <Text style={{ color: '#71717A', fontSize: 9, textAlign: 'center', marginTop: 4, fontWeight: '600' }}>
                  Meta: 8 horas
                </Text>
              </>
            ) : (
              <Pressable
                onPress={() => setShowSleepModal(true)}
                style={{
                  backgroundColor: 'rgba(139,92,246,0.08)',
                  borderWidth: 1,
                  borderColor: 'rgba(139,92,246,0.2)',
                  borderRadius: 16,
                  padding: 20,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 28, marginBottom: 6 }}>🛏️</Text>
                <Text style={{ color: '#A1A1AA', fontSize: 13, fontWeight: '600' }}>¿Cómo dormiste anoche?</Text>
                <Text style={{ color: '#71717A', fontSize: 11, marginTop: 4 }}>Toca para registrar tu sueño</Text>
              </Pressable>
            )}

            {/* Weekly mini chart (last 7 days from sleepData) */}
            {sleepChartData.length > 1 && (
              <View style={{ marginTop: 16 }}>
                <Text style={{ color: '#71717A', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                  Últimos 7 días
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 50 }}>
                  {sleepChartData.map((d, i) => {
                    const maxH = 10;
                    const barH = Math.max(4, (d.y / maxH) * 50);
                    const color = d.y >= 7 ? '#8B5CF6' : d.y >= 5 ? '#F59E0B' : '#EF4444';
                    return (
                      <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                        <View style={{ height: barH, width: '100%', backgroundColor: `${color}40`, borderRadius: 6, borderWidth: 1, borderColor: `${color}60` }} />
                        <Text style={{ color: '#52525B', fontSize: 8, fontWeight: '700', marginTop: 3 }}>{d.x}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Hidratación */}
        <View className="px-6 mb-6">
          <View className="glass-card rounded-3xl p-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-base font-bold text-foreground" style={{ color: '#FAFAFA' }}>💧 Hidratación</Text>
              <Text className="text-sm font-bold text-blue-400">{todayMetrics?.water_ml || 0} / 2000 ml</Text>
            </View>
            {/* Cuadros de agua - color más claro */}
            <View className="flex-row gap-2 mb-4">
              {[1,2,3,4,5,6,7,8].map(i => (
                <Pressable
                  key={i}
                  onPress={() => setShowWaterModal(true)}
                  style={{ flex: 1 }}
                >
                  <View
                    className={`h-10 rounded-xl border ${
                      i <= glassCount
                        ? 'border-blue-400/60'
                        : 'border-blue-500/15'
                    }`}
                    style={{
                      backgroundColor: i <= glassCount
                        ? 'rgba(96,165,250,0.35)'
                        : 'rgba(59,130,246,0.06)',
                    }}
                  />
                </Pressable>
              ))}
            </View>
            {/* Barra de progreso */}
            <View className="h-1.5 w-full bg-blue-500/10 rounded-full overflow-hidden mb-3">
              <View
                className="h-full bg-blue-400/70 rounded-full"
                style={{ width: `${Math.min(waterProgress, 100)}%` }}
              />
            </View>
            <Pressable
              onPress={() => setShowWaterModal(true)}
              className="bg-blue-500/10 border border-blue-500/20 rounded-2xl py-3 items-center active:bg-blue-500/20"
            >
              <Text className="text-blue-400 font-bold text-xs uppercase tracking-widest">+ Registrar Agua</Text>
            </Pressable>
          </View>
        </View>

        {/* Actividades */}
        <View className="px-6 mb-6">
          <Text className="text-base font-bold text-foreground mb-4" style={{ color: '#FAFAFA' }}>Actividades Hoy</Text>
          <View className="flex-row flex-wrap -mx-1.5">
            {[
              { id: 'gym' as const, title: 'Gimnasio', icon: '💪', done: !!todayMetrics?.gymSessions, color: '#F97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.2)' },
              { id: 'yoga' as const, title: 'Yoga', icon: '🧘‍♀️', done: !!todayMetrics?.yogaSessions, color: '#10B981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' },
              { id: 'massage' as const, title: 'Masaje', icon: '💆', done: !!todayMetrics?.massageSessions, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.2)' },
              { id: 'food' as const, title: 'Comida', icon: '🍎', done: !!todayMetrics?.meals, color: '#EAB308', bg: 'rgba(234,179,8,0.1)', border: 'rgba(234,179,8,0.2)' },
            ].map((item) => (
              <View key={item.id} className="w-1/2 px-1.5 mb-3">
                <Pressable
                  onPress={() => setActivityModal(item.id)}
                  style={{ backgroundColor: item.bg, borderWidth: 1, borderColor: item.border, borderRadius: 20, padding: 16 }}
                  className="active:scale-95"
                >
                  <View className="flex-row justify-between items-start mb-3">
                    <Text style={{ fontSize: 26 }}>{item.icon}</Text>
                    {item.done && (
                      <View style={{ backgroundColor: item.color, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 }}>
                        <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>✓ HECHO</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ color: '#FAFAFA', fontWeight: '700', fontSize: 13, marginBottom: 4 }}>{item.title}</Text>
                  <Text style={{ color: item.color, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
                    {item.done ? 'Registrado hoy' : 'Toca para registrar'}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        </View>

        {/* Plan Nutricional */}
        <View className="px-6 mb-6">
          <View className="glass-card rounded-3xl p-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-base font-bold text-foreground" style={{ color: '#FAFAFA' }}>🍽️ Plan Nutricional Semanal</Text>
              <Pressable
                onPress={() => setShowMealPlan(!showMealPlan)}
                className="bg-success/10 border border-success/20 rounded-full px-3 py-1.5 active:bg-success/20"
              >
                <Text className="text-success font-bold text-[10px] uppercase">{showMealPlan ? 'Cerrar' : 'Ver Plan'}</Text>
              </Pressable>
            </View>

            {/* Menú de hoy siempre visible */}
            <View style={{ backgroundColor: 'rgba(16,185,129,0.08)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)', borderRadius: 16, padding: 16, marginBottom: 12 }}>
              <Text style={{ color: '#34D399', fontWeight: '800', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
                {todayPlan.day} — Hoy
              </Text>
              {todayPlan.meals.map((meal, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Text style={{ color: '#A1A1AA', fontWeight: '700', fontSize: 11, width: 66 }}>
                    {i === 0 ? 'Desayuno' : i === 1 ? 'Almuerzo' : i === 2 ? 'Merienda' : 'Cena'}:
                  </Text>
                  <Text style={{ color: '#E4E4E7', fontSize: 12, flex: 1 }}>{meal}</Text>
                </View>
              ))}
            </View>

            {/* Plan completo expandible */}
            {showMealPlan && (
              <View className="gap-3 mt-2">
                {WEEKLY_PLAN.filter(d => d.day !== todayPlan.day).map((day) => (
                  <View key={day.day} style={{ backgroundColor: 'rgba(39,39,42,0.6)', borderRadius: 16, padding: 16 }}>
                    <Text style={{ color: '#FAFAFA', fontWeight: '800', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>{day.day}</Text>
                    {day.meals.map((meal, i) => (
                      <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Text style={{ color: '#A1A1AA', fontWeight: '700', fontSize: 10, width: 66 }}>
                          {i === 0 ? 'Desayuno' : i === 1 ? 'Almuerzo' : i === 2 ? 'Merienda' : 'Cena'}:
                        </Text>
                        <Text style={{ color: '#D4D4D8', fontSize: 11, flex: 1 }}>{meal}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Macros */}
        <View className="px-6 mb-6">
          <View className="glass-card rounded-3xl p-6">
            <Text className="text-base font-bold text-foreground mb-5" style={{ color: '#FAFAFA' }}>Macros del Día</Text>
            <View className="gap-4">
              {[
                { label: 'Proteína', value: todayMetrics?.protein_g || 0, goal: 160, color: colors.primary },
                { label: 'Carbohidratos', value: todayMetrics?.carbs_g || 0, goal: 300, color: colors.success },
                { label: 'Grasas', value: todayMetrics?.fat_g || 0, goal: 80, color: colors.warning },
              ].map(({ label, value, goal, color }) => (
                <View key={label}>
                  <View className="flex-row justify-between mb-1.5">
                    <Text className="text-xs font-bold text-muted uppercase" style={{ color: '#A1A1AA' }}>{label}</Text>
                    <Text className="text-xs font-bold text-foreground" style={{ color: '#FAFAFA' }}>{value}g / {goal}g</Text>
                  </View>
                  <View className="h-2 w-full bg-border rounded-full overflow-hidden">
                    <View className="h-full rounded-full" style={{ width: `${Math.min((value / goal) * 100, 100)}%`, backgroundColor: color }} />
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Charts */}
        {stepsChartData.length > 0 && (
          <View className="px-6 mb-4">
            <BarChart data={stepsChartData} title="Pasos (7 días)" yLabel="Pasos" color={colors.primary} />
          </View>
        )}
        {sleepChartData.length > 0 && (
          <View className="px-6 mb-6">
            <LineChart data={sleepChartData} title="Sueño (7 días)" yLabel="Horas" color={colors.success} />
          </View>
        )}

        {/* IA Sugiere */}
        <View className="px-6 mb-6">
          <View className="glass-card rounded-3xl p-6">
            <Text className="font-bold text-foreground mb-4" style={{ color: '#FAFAFA' }}>IA Coach Sugiere 🧠</Text>
            <View className="gap-3">
              <View className="bg-background p-3 rounded-xl border border-border">
                <Text className="text-xs font-bold text-primary mb-1">MOVIMIENTO</Text>
                <Text className="text-sm text-foreground/80" style={{ color: 'rgba(250,250,250,0.8)' }}>
                  {todayMetrics?.steps && todayMetrics.steps < 5000
                    ? 'Llevas pocos pasos hoy. ¡Asume que ya eres esa persona activa!'
                    : todayMetrics?.steps && todayMetrics.steps >= 10000
                    ? '¡Objetivo de pasos completado! Excelente día activo.'
                    : '¡Buen ritmo! Estás cerca de tu meta de 10,000 pasos.'}
                </Text>
              </View>
              <View className="bg-background p-3 rounded-xl border border-border">
                <Text className="text-xs font-bold text-success mb-1">NUTRICIÓN</Text>
                <Text className="text-sm text-foreground/80" style={{ color: 'rgba(250,250,250,0.8)' }}>
                  {todayMetrics?.protein_g && todayMetrics.protein_g < 80
                    ? 'Prioriza la proteína en tu próxima comida para alcanzar tu meta.'
                    : 'Macros en buen camino. Mantén la consistencia.'}
                </Text>
              </View>
              <View className="bg-background p-3 rounded-xl border border-border">
                <Text className="text-xs font-bold text-blue-400 mb-1">HIDRATACIÓN</Text>
                <Text className="text-sm text-foreground/80" style={{ color: 'rgba(250,250,250,0.8)' }}>
                  {(todayMetrics?.water_ml || 0) < 1000
                    ? 'Menos de 1L de agua. Tu cuerpo necesita hidratarse más.'
                    : (todayMetrics?.water_ml || 0) >= 2000
                    ? '¡Objetivo de hidratación alcanzado! Excelente.'
                    : 'Buen progreso con el agua. Continúa bebiendo.'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Historial */}
        {manualEntries && manualEntries.length > 0 && (
          <View className="px-6 mb-6">
            <Text className="text-base font-bold text-foreground mb-4" style={{ color: '#FAFAFA' }}>Historial (7 días)</Text>
            <View className="gap-3">
              {manualEntries.map((entry) => {
                const label = new Date(entry.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
                const badges = [
                  entry.gym_session && '💪 Gym',
                  entry.yoga_session && '🧘 Yoga',
                  entry.massage_session && '💆 Masaje',
                  entry.meals_tracked && '🍎 Comida',
                ].filter(Boolean) as string[];

                return (
                  <View key={entry.id} className="bg-surface rounded-2xl p-4 border border-border">
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-sm font-bold text-foreground capitalize" style={{ color: '#FAFAFA' }}>{label}</Text>
                      <Text className="text-xs text-muted" style={{ color: '#A1A1AA' }}>{(entry.steps || 0).toLocaleString()} pasos</Text>
                    </View>
                    <View className="flex-row gap-4 mb-2">
                      <View>
                        <Text className="text-[9px] text-muted uppercase font-bold" style={{ color: '#A1A1AA' }}>Sueño</Text>
                        <Text className="text-xs font-semibold text-foreground" style={{ color: '#FAFAFA' }}>{entry.sleep_minutes ? `${(entry.sleep_minutes / 60).toFixed(1)}h` : '—'}</Text>
                      </View>
                      <View>
                        <Text className="text-[9px] text-muted uppercase font-bold" style={{ color: '#A1A1AA' }}>Agua</Text>
                        <Text className="text-xs font-semibold text-foreground" style={{ color: '#FAFAFA' }}>{entry.water_ml ? `${entry.water_ml}ml` : '—'}</Text>
                      </View>
                      <View>
                        <Text className="text-[9px] text-muted uppercase font-bold" style={{ color: '#A1A1AA' }}>Calorías</Text>
                        <Text className="text-xs font-semibold text-foreground" style={{ color: '#FAFAFA' }}>{entry.calories ? `${entry.calories}kcal` : '—'}</Text>
                      </View>
                    </View>
                    {badges.length > 0 && (
                      <View className="flex-row flex-wrap gap-1.5">
                        {badges.map((b) => (
                          <View key={b} className="bg-primary/10 rounded-full px-2 py-0.5">
                            <Text className="text-[9px] text-primary font-bold">{b}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* CTA */}
        <View className="px-6 mb-4">
          <Pressable
            onPress={() => setShowAddModal(true)}
            className="bg-primary rounded-2xl p-4 items-center shadow-lg shadow-primary/20 active:scale-95"
          >
            <Text className="text-background font-bold uppercase tracking-widest text-xs">+ Registro Manual Completo</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Modals */}
      {user && (
        <AddHealthModal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          userId={String(user.id)}
        />
      )}
      {user && (
        <WaterModal
          visible={showWaterModal}
          onClose={() => setShowWaterModal(false)}
          currentWater={todayMetrics?.water_ml || 0}
          userId={String(user.id)}
          onSave={invalidate}
        />
      )}
      {user && activityModal && (
        <ActivityLogModal
          visible={true}
          onClose={() => setActivityModal(null)}
          activityType={activityModal}
          userId={String(user.id)}
          onSave={invalidate}
        />
      )}
      {user && (
        <SleepModal
          visible={showSleepModal}
          onClose={() => setShowSleepModal(false)}
          userId={String(user.id)}
          currentData={{
            sleepBedtime: todayMetrics?.sleepBedtime,
            sleepWaketime: todayMetrics?.sleepWaketime,
            sleepQuality: todayMetrics?.sleepQuality,
          }}
          onSave={invalidate}
        />
      )}
    </ScreenContainer>
  );
}
