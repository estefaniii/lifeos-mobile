import React, { useState } from 'react';
import { ScrollView, Text, View, Pressable, RefreshControl, Platform, Modal, TextInput } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { LineChart } from '@/components/charts';
import { useColors } from '@/hooks/use-colors';
import { useHealthMetrics, useTodayHealthMetrics, useManualHealthEntries } from '@/hooks/use-health';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { WaterModal } from '@/components/water-modal';
import { useHealthKitSync } from '@/hooks/use-healthkit-sync';
import { fechaLocal } from '@/lib/registros';
import { Titulo, TINTA } from '@/components/decor';

// ─── Activity Modal ───────────────────────────────────────────────────────────

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
      const today = fechaLocal();
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
  const qualityColors = ['', '#EF4444', '#F97316', '#EAB308', '#10B981', '#FFB547'];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#1A1714', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 36 }}>
          <Text style={{ color: '#F5EFE8', fontSize: 18, fontWeight: '800', marginBottom: 4 }}>🌙 Registrar Sueño</Text>
          <Text style={{ color: '#A39A90', fontSize: 11, marginBottom: 20, fontWeight: '700' }}>
            Total calculado: {sleepHrs}h
          </Text>

          {/* Bedtime */}
          <Text style={{ color: '#A39A90', fontSize: 12, fontWeight: '700', marginBottom: 8 }}>
            Hora de dormir
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#2E2924', borderRadius: 14, borderWidth: 1, borderColor: '#3F3F46', paddingHorizontal: 14 }}>
              <TextInput
                style={{ flex: 1, color: '#F5EFE8', fontSize: 24, fontWeight: '800', paddingVertical: 10, textAlign: 'center' }}
                keyboardType="number-pad"
                maxLength={2}
                value={bedHour}
                onChangeText={(t) => { const n = parseInt(t); if (!isNaN(n) && n >= 0 && n <= 23) setBedHour(t); else if (t === '') setBedHour(''); }}
              />
            </View>
            <Text style={{ color: '#A39A90', fontSize: 24, fontWeight: '800' }}>:</Text>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#2E2924', borderRadius: 14, borderWidth: 1, borderColor: '#3F3F46', paddingHorizontal: 14 }}>
              <TextInput
                style={{ flex: 1, color: '#F5EFE8', fontSize: 24, fontWeight: '800', paddingVertical: 10, textAlign: 'center' }}
                keyboardType="number-pad"
                maxLength={2}
                value={bedMin}
                onChangeText={(t) => { const n = parseInt(t); if (!isNaN(n) && n >= 0 && n <= 59) setBedMin(t); else if (t === '') setBedMin(''); }}
              />
            </View>
            <Text style={{ color: '#8B5CF6', fontSize: 12, fontWeight: '800' }}>PM</Text>
          </View>

          {/* Wake time */}
          <Text style={{ color: '#A39A90', fontSize: 12, fontWeight: '700', marginBottom: 8 }}>
            Hora de despertar
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#2E2924', borderRadius: 14, borderWidth: 1, borderColor: '#3F3F46', paddingHorizontal: 14 }}>
              <TextInput
                style={{ flex: 1, color: '#F5EFE8', fontSize: 24, fontWeight: '800', paddingVertical: 10, textAlign: 'center' }}
                keyboardType="number-pad"
                maxLength={2}
                value={wakeHour}
                onChangeText={(t) => { const n = parseInt(t); if (!isNaN(n) && n >= 0 && n <= 23) setWakeHour(t); else if (t === '') setWakeHour(''); }}
              />
            </View>
            <Text style={{ color: '#A39A90', fontSize: 24, fontWeight: '800' }}>:</Text>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#2E2924', borderRadius: 14, borderWidth: 1, borderColor: '#3F3F46', paddingHorizontal: 14 }}>
              <TextInput
                style={{ flex: 1, color: '#F5EFE8', fontSize: 24, fontWeight: '800', paddingVertical: 10, textAlign: 'center' }}
                keyboardType="number-pad"
                maxLength={2}
                value={wakeMin}
                onChangeText={(t) => { const n = parseInt(t); if (!isNaN(n) && n >= 0 && n <= 59) setWakeMin(t); else if (t === '') setWakeMin(''); }}
              />
            </View>
            <Text style={{ color: '#F59E0B', fontSize: 12, fontWeight: '800' }}>AM</Text>
          </View>

          {/* Quality */}
          <Text style={{ color: '#A39A90', fontSize: 12, fontWeight: '700', marginBottom: 8 }}>
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
                  backgroundColor: quality >= q ? `${qualityColors[q]}20` : '#2E2924',
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
            <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: '#2E2924', borderRadius: 16, paddingVertical: 14, alignItems: 'center' }}>
              <Text style={{ color: '#A39A90', fontWeight: '700' }}>Cancelar</Text>
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



// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function HealthScreen() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showWaterModal, setShowWaterModal] = useState(false);
  const [showSleepModal, setShowSleepModal] = useState(false);

  const { syncNow } = useHealthKitSync(user?.id);

  const { data: todayMetrics } = useTodayHealthMetrics();
  const { data: sleepData } = useHealthMetrics('sleep_minutes', 7);
  const { data: manualEntries } = useManualHealthEntries(7);

  const sleepChartData = (sleepData || []).map((item) => ({
    x: new Date(item.date).toLocaleDateString('es-ES', { weekday: 'short' }),
    y: Math.round((item.value / 60) * 10) / 10,
  }));

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

  return (
    <ScreenContainer className="p-0">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 150 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        {/* Cabecera. El botón del menú queda arriba a la derecha */}
        <View style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16, paddingRight: 110 }}>
          <Titulo>Sueño y agua</Titulo>
          <Text style={{ color: TINTA.suave, fontSize: 15, marginTop: 6 }}>Cómo dormiste y cuánta agua tomaste.</Text>
        </View>

        {/* Apple Health (iOS) */}
        {Platform.OS === 'ios' && (
          <View className="mx-6 mb-6 glass-card rounded-3xl p-5 flex-row justify-between items-center">
            <View className="flex-1">
              <Text className="text-sm font-bold text-primary">📱 Apple Health Conectado</Text>
              <Text className="text-xs text-muted mt-1" style={{ color: '#A39A90' }}>Pasos, sueño, calorías — auto-sync cada hora.</Text>
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
              <Text style={{ color: '#F5EFE8', fontSize: 16, fontWeight: '800' }}>🌙 Sueño</Text>
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
                <Text style={{ color: '#A78BFA', fontSize: 12, fontWeight: '800' }}>
                  {todayMetrics?.sleepBedtime ? 'Editar' : '+ Registrar'}
                </Text>
              </Pressable>
            </View>

            {todayMetrics?.sleepBedtime ? (
              <>
                {/* Time display */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 16 }}>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ color: '#A39A90', fontSize: 12, fontWeight: '700', marginBottom: 4 }}>Dormí</Text>
                    <Text style={{ color: '#C4B5FD', fontSize: 28, fontWeight: '800' }}>{todayMetrics.sleepBedtime}</Text>
                  </View>
                  <Text style={{ color: '#52525B', fontSize: 20 }}>→</Text>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ color: '#A39A90', fontSize: 12, fontWeight: '700', marginBottom: 4 }}>Desperté</Text>
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
                    <Text style={{ color: '#A39A90', fontSize: 12, fontWeight: '700', marginBottom: 4 }}>Duración</Text>
                    <Text style={{ color: '#F5EFE8', fontSize: 22, fontWeight: '800' }}>{todayMetrics.sleepHours.toFixed(1)}h</Text>
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
                    <Text style={{ color: '#A39A90', fontSize: 12, fontWeight: '700', marginBottom: 4 }}>Calidad</Text>
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
                <Text style={{ color: '#A39A90', fontSize: 9, textAlign: 'center', marginTop: 4, fontWeight: '600' }}>
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
                <Text style={{ color: '#A39A90', fontSize: 13, fontWeight: '600' }}>¿Cómo dormiste anoche?</Text>
                <Text style={{ color: '#A39A90', fontSize: 11, marginTop: 4 }}>Toca para registrar tu sueño</Text>
              </Pressable>
            )}

            {/* Weekly mini chart (last 7 days from sleepData) */}
            {sleepChartData.length > 1 && (
              <View style={{ marginTop: 16 }}>
                <Text style={{ color: '#A39A90', fontSize: 12, fontWeight: '700', marginBottom: 8 }}>
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
              <Text className="text-base font-bold text-foreground" style={{ color: '#F5EFE8' }}>💧 Hidratación</Text>
              <Text className="text-sm font-bold text-blue-400">{Math.round((todayMetrics?.water_ml || 0) / 250)} / 8 vasos</Text>
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
              <Text className="text-blue-400 font-bold text-sm">+ Anotar agua</Text>
            </Pressable>
          </View>
        </View>

        {/* Charts */}
        {sleepChartData.length > 0 && (
          <View className="px-6 mb-6">
            <LineChart data={sleepChartData} title="Sueño (7 días)" yLabel="Horas" color={colors.success} />
          </View>
        )}

        {/* Historial */}
        {manualEntries && manualEntries.length > 0 && (
          <View className="px-6 mb-6">
            <Text className="text-base font-bold text-foreground mb-4" style={{ color: '#F5EFE8' }}>Últimos 7 días</Text>
            <View className="gap-3">
              {manualEntries.map((entry) => {
                const label = new Date(entry.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
                const badges = [
                  entry.gym_session && '💪 Gym',
                  entry.yoga_session && '🧘 Yoga',
                  entry.massage_session && '💆 Masaje',
                ].filter(Boolean) as string[];

                return (
                  <View key={entry.id} className="bg-surface rounded-2xl p-4 border border-border">
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-sm font-bold text-foreground capitalize" style={{ color: '#F5EFE8' }}>{label}</Text>
                    </View>
                    <View className="flex-row gap-4 mb-2">
                      <View>
                        <Text className="text-xs text-muted font-bold" style={{ color: '#A39A90' }}>Sueño</Text>
                        <Text className="text-xs font-semibold text-foreground" style={{ color: '#F5EFE8' }}>{entry.sleep_minutes ? `${(entry.sleep_minutes / 60).toFixed(1)}h` : '—'}</Text>
                      </View>
                      <View>
                        <Text className="text-xs text-muted font-bold" style={{ color: '#A39A90' }}>Agua</Text>
                        <Text className="text-xs font-semibold text-foreground" style={{ color: '#F5EFE8' }}>{entry.water_ml ? `${Math.round(entry.water_ml / 250)} vasos` : '—'}</Text>
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

      </ScrollView>

      {/* Modals */}
      {user && (
        <WaterModal
          visible={showWaterModal}
          onClose={() => setShowWaterModal(false)}
          currentWater={todayMetrics?.water_ml || 0}
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
