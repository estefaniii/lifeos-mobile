import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ScrollView, Text, View, Pressable, RefreshControl, Alert, Platform } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { BarChart, PieChart } from '@/components/charts';
import { AddProductivityModal } from '@/components/modals/add-productivity-modal';
import { AddProjectModal } from '@/components/modals/add-project-modal';
import { useColors } from '@/hooks/use-colors';
import { useProductivityByProject, useTodayProductivity, useProjects, useDeleteProject } from '@/hooks/use-productivity';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';

const TIMER_PRESETS = [
  { label: '25 min', minutes: 25 },
  { label: '45 min', minutes: 45 },
  { label: '60 min', minutes: 60 },
  { label: '90 min', minutes: 90 },
];

export default function ProductivityScreen() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);

  // Timer state
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [timerProject, setTimerProject] = useState<string | null>(null);
  const [elapsedWhenPaused, setElapsedWhenPaused] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch data
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: productivityByProject, isLoading: projectsStatsLoading } = useProductivityByProject(7);
  const { data: todayProductivity, isLoading: todayLoading } = useTodayProductivity();
  const deleteProject = useDeleteProject();

  // Prepare chart data
  const barChartData = (productivityByProject || []).map((item) => ({
    x: item.name.substring(0, 10),
    y: parseFloat(item.hours),
  }));

  const pieChartData = (todayProductivity?.byProject || []).map((item) => ({
    x: item.name,
    y: item.minutes,
  }));

  void (projectsLoading || projectsStatsLoading || todayLoading);

  // Timer logic
  const totalSeconds = timerMinutes * 60;
  const progress = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) : 0;
  const displayMin = Math.floor(secondsLeft / 60);
  const displaySec = secondsLeft % 60;

  const logSession = useCallback(async (durationMinutes: number) => {
    if (!user?.id || durationMinutes < 1) return;
    try {
      await supabase.from('productivity_logs').insert({
        user_id: user.id,
        project_id: timerProject || null,
        duration_minutes: durationMinutes,
        note: 'Pomodoro',
        date: new Date().toISOString().split('T')[0],
      });
      queryClient.invalidateQueries({ queryKey: ['today-productivity'] });
      queryClient.invalidateQueries({ queryKey: ['productivity-by-project'] });
    } catch (err) {
      console.warn('[Timer] Error logging session:', err);
    }
  }, [user?.id, timerProject, queryClient]);

  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setIsRunning(false);
            // Session complete
            logSession(timerMinutes);
            if (Platform.OS === 'web') {
              try {
                if (Notification.permission === 'granted') {
                  new Notification('LifeOS - Sesión Completa', {
                    body: `¡Completaste ${timerMinutes} minutos de focus!`,
                    icon: '/icon-192.png',
                  });
                }
              } catch {}
            }
            Alert.alert('Sesión Completa', `¡Completaste ${timerMinutes} minutos de focus! Tiempo registrado automáticamente.`);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, secondsLeft, timerMinutes, logSession]);

  const handleStart = () => {
    if (secondsLeft === 0) {
      setSecondsLeft(timerMinutes * 60);
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
    setElapsedWhenPaused(totalSeconds - secondsLeft);
  };

  const handleReset = () => {
    setIsRunning(false);
    // Log partial time if > 1 min was spent
    const elapsedMinutes = Math.floor((totalSeconds - secondsLeft) / 60);
    if (elapsedMinutes >= 1) {
      logSession(elapsedMinutes);
      Alert.alert('Sesión Parcial', `Se registraron ${elapsedMinutes} minutos de focus.`);
    }
    setSecondsLeft(timerMinutes * 60);
    setElapsedWhenPaused(0);
  };

  const selectPreset = (minutes: number) => {
    if (isRunning) return;
    setTimerMinutes(minutes);
    setSecondsLeft(minutes * 60);
    setElapsedWhenPaused(0);
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.refetchQueries();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <ScreenContainer className="p-0">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 }}>
          <Text style={{ color: '#FAFAFA', fontSize: 28, fontWeight: '800' }}>Productividad</Text>
          <Text style={{ color: '#A1A1AA', fontSize: 13, marginTop: 4 }}>Focus timer y seguimiento de proyectos</Text>
        </View>

        {/* Pomodoro Timer */}
        <View style={{
          marginHorizontal: 24,
          marginBottom: 20,
          backgroundColor: '#0f172a',
          borderRadius: 24,
          padding: 24,
          borderWidth: 1,
          borderColor: 'rgba(20,184,166,0.2)',
          alignItems: 'center',
        }}>
          <Text style={{ color: '#A1A1AA', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>
            FOCUS TIMER
          </Text>

          {/* Timer Presets */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
            {TIMER_PRESETS.map((preset) => (
              <Pressable
                key={preset.minutes}
                onPress={() => selectPreset(preset.minutes)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 20,
                  backgroundColor: timerMinutes === preset.minutes ? '#14B8A6' : '#1e293b',
                  opacity: isRunning ? 0.5 : 1,
                }}
              >
                <Text style={{
                  color: timerMinutes === preset.minutes ? '#020617' : '#94a3b8',
                  fontSize: 12,
                  fontWeight: '600',
                }}>
                  {preset.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Timer Display */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            {/* Circular progress ring */}
            <View style={{
              width: 180,
              height: 180,
              borderRadius: 90,
              borderWidth: 6,
              borderColor: '#1e293b',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}>
              {/* Progress overlay - using a simple approach */}
              <View style={{
                position: 'absolute',
                top: -6,
                left: -6,
                width: 180,
                height: 180,
                borderRadius: 90,
                borderWidth: 6,
                borderColor: 'transparent',
                borderTopColor: '#14B8A6',
                borderRightColor: progress > 0.25 ? '#14B8A6' : 'transparent',
                borderBottomColor: progress > 0.5 ? '#14B8A6' : 'transparent',
                borderLeftColor: progress > 0.75 ? '#14B8A6' : 'transparent',
                transform: [{ rotate: '-90deg' }],
              }} />
              <Text style={{ color: '#FAFAFA', fontSize: 42, fontWeight: '300', fontVariant: ['tabular-nums'] }}>
                {String(displayMin).padStart(2, '0')}:{String(displaySec).padStart(2, '0')}
              </Text>
              <Text style={{ color: '#71717A', fontSize: 11, marginTop: 2 }}>
                {isRunning ? 'Enfocado...' : secondsLeft === 0 ? '¡Completado!' : 'Listo'}
              </Text>
            </View>
          </View>

          {/* Project selector for timer */}
          {projects && projects.length > 0 && (
            <View style={{ marginBottom: 16, width: '100%' }}>
              <Text style={{ color: '#71717A', fontSize: 11, marginBottom: 6, textAlign: 'center' }}>Proyecto (opcional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, justifyContent: 'center', flexDirection: 'row' }}>
                <Pressable
                  onPress={() => !isRunning && setTimerProject(null)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                    borderRadius: 16,
                    backgroundColor: timerProject === null ? 'rgba(20,184,166,0.15)' : '#1e293b',
                    borderWidth: 1,
                    borderColor: timerProject === null ? 'rgba(20,184,166,0.3)' : 'transparent',
                  }}
                >
                  <Text style={{ color: timerProject === null ? '#14B8A6' : '#71717A', fontSize: 11 }}>Ninguno</Text>
                </Pressable>
                {projects.map((p) => (
                  <Pressable
                    key={p.id}
                    onPress={() => !isRunning && setTimerProject(p.id)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 5,
                      borderRadius: 16,
                      backgroundColor: timerProject === p.id ? 'rgba(20,184,166,0.15)' : '#1e293b',
                      borderWidth: 1,
                      borderColor: timerProject === p.id ? 'rgba(20,184,166,0.3)' : 'transparent',
                    }}
                  >
                    <Text style={{ color: timerProject === p.id ? '#14B8A6' : '#71717A', fontSize: 11 }}>{p.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Timer Controls */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {!isRunning ? (
              <Pressable
                onPress={handleStart}
                style={{
                  flex: 1,
                  backgroundColor: '#14B8A6',
                  borderRadius: 16,
                  paddingVertical: 14,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#020617', fontWeight: '700', fontSize: 15 }}>
                  {secondsLeft === 0 ? 'Reiniciar' : elapsedWhenPaused > 0 ? 'Continuar' : 'Iniciar'}
                </Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={handlePause}
                style={{
                  flex: 1,
                  backgroundColor: '#fbbf24',
                  borderRadius: 16,
                  paddingVertical: 14,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#020617', fontWeight: '700', fontSize: 15 }}>Pausar</Text>
              </Pressable>
            )}
            {(isRunning || elapsedWhenPaused > 0 || secondsLeft === 0) && (
              <Pressable
                onPress={handleReset}
                style={{
                  paddingHorizontal: 20,
                  backgroundColor: '#1e293b',
                  borderRadius: 16,
                  paddingVertical: 14,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#f87171', fontWeight: '700', fontSize: 15 }}>Reset</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Today's Summary */}
        <View style={{
          marginHorizontal: 24,
          marginBottom: 20,
          backgroundColor: '#14B8A6',
          borderRadius: 20,
          padding: 20,
        }}>
          <Text style={{ color: '#020617', fontSize: 11, fontWeight: '700', opacity: 0.7, marginBottom: 4 }}>
            PRODUCTIVIDAD HOY
          </Text>
          <Text style={{ color: '#020617', fontSize: 36, fontWeight: '800', marginBottom: 2 }}>
            {todayProductivity?.totalHours || 0}h
          </Text>
          <Text style={{ color: '#020617', fontSize: 13, opacity: 0.8 }}>
            {todayProductivity?.totalMinutes || 0} minutos dedicados
          </Text>
        </View>

        {/* Bar Chart: Hours per Project (Weekly) */}
        {barChartData.length > 0 && (
          <View style={{ paddingHorizontal: 24 }}>
            <BarChart
              data={barChartData}
              title="Horas por Proyecto (Últimos 7 Días)"
              yLabel="Horas"
              color={colors.primary}
            />
          </View>
        )}

        {/* Pie Chart: Time Distribution (Today) */}
        {pieChartData.length > 0 && (
          <View style={{ paddingHorizontal: 24 }}>
            <PieChart
              data={pieChartData}
              title="Distribución de Tiempo (Hoy)"
              colors={[colors.primary, colors.success, colors.warning, colors.error]}
            />
          </View>
        )}

        {/* Projects List */}
        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <Text style={{ color: '#FAFAFA', fontSize: 18, fontWeight: '700' }}>Tus Proyectos</Text>
            <Pressable onPress={() => setShowProjectModal(true)}>
              <Text style={{ color: '#14B8A6', fontSize: 13, fontWeight: '600' }}>+ Nuevo</Text>
            </Pressable>
          </View>

          {projects && projects.length > 0 ? (
            projects.map((project) => {
              const projectStats = productivityByProject?.find((p) => p.name === project.name);
              return (
                <View
                  key={project.id}
                  style={{
                    backgroundColor: '#0f172a',
                    borderRadius: 14,
                    padding: 16,
                    marginBottom: 10,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#FAFAFA', fontSize: 15, fontWeight: '600', flex: 1 }}>{project.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: '#14B8A6', fontSize: 17, fontWeight: '700' }}>
                        {projectStats?.hours || '0'}h
                      </Text>
                      <Text style={{ color: '#71717A', fontSize: 10 }}>esta semana</Text>
                    </View>
                    <Pressable
                      onPress={() => {
                        if (Platform.OS === 'web') {
                          if (confirm(`¿Eliminar "${project.name}"?`)) {
                            deleteProject.mutate(project.id);
                          }
                        } else {
                          Alert.alert('Eliminar proyecto', `¿Eliminar "${project.name}"?`, [
                            { text: 'Cancelar', style: 'cancel' },
                            { text: 'Eliminar', style: 'destructive', onPress: () => deleteProject.mutate(project.id) },
                          ]);
                        }
                      }}
                    >
                      <Text style={{ color: '#71717A', fontSize: 18 }}>✕</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })
          ) : (
            <Pressable
              onPress={() => setShowProjectModal(true)}
              style={{
                backgroundColor: '#0f172a',
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: '#27272A',
                borderRadius: 14,
                padding: 24,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#71717A', marginBottom: 6, fontSize: 13 }}>No hay proyectos creados</Text>
              <Text style={{ color: '#14B8A6', fontSize: 13, fontWeight: '600' }}>+ Crear primer proyecto</Text>
            </Pressable>
          )}
        </View>

        {/* Manual Log */}
        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <Pressable
            onPress={() => setShowAddModal(true)}
            style={{
              backgroundColor: '#1e293b',
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#27272A',
            }}
          >
            <Text style={{ color: '#94a3b8', fontWeight: '600', fontSize: 14 }}>Registrar Tiempo Manual</Text>
          </Pressable>
        </View>

        {user && projects && (
          <AddProductivityModal
            visible={showAddModal}
            onClose={() => setShowAddModal(false)}
            userId={String(user.id)}
            projects={projects}
          />
        )}
        {user && (
          <AddProjectModal
            visible={showProjectModal}
            onClose={() => setShowProjectModal(false)}
            userId={String(user.id)}
          />
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
