import { useQuery } from '@tanstack/react-query';
import { supabase, type HealthMetric } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';

export function useHealthMetrics(
  metricType: 'sleep_minutes' | 'steps' | 'exercise_minutes',
  days: number = 7
) {
  const { user } = useAuth({ autoFetch: false });
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: ['health-metrics', metricType, days, userId],
    enabled: !!userId,
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('health_metrics')
        .select(`date, ${metricType}`)
        .eq('user_id', userId!)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;
      return (data || []).map((item: any) => ({
        date: item.date,
        value: item[metricType] || 0,
      }));
    },
  });
}

export function useTodayHealthMetrics() {
  const { user } = useAuth({ autoFetch: false });
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: ['today-health-metrics', userId],
    enabled: !!userId,
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];

      let query = supabase
        .from('health_metrics')
        .select('*')
        .eq('date', today)
        .limit(1);

      if (userId) query = (query as any).eq('user_id', userId);

      const { data, error } = await query;
      if (error) throw error;

      const metric = data?.[0] || {};
      return {
        steps: metric.steps || 0,
        sleepHours: (metric.sleep_minutes || 0) / 60,
        sleepMinutes: metric.sleep_minutes || 0,
        sleepBedtime: metric.sleep_bedtime || null,
        sleepWaketime: metric.sleep_waketime || null,
        sleepQuality: metric.sleep_quality || 0,
        exerciseMinutes: metric.exercise_minutes || 0,
        water_ml: metric.water_ml || 0,
        calories: metric.calories || 0,
        protein_g: metric.protein_g || 0,
        carbs_g: metric.carbs_g || 0,
        fat_g: metric.fat_g || 0,
        gymSessions: metric.gym_session ? 1 : 0,
        yogaSessions: metric.yoga_session ? 1 : 0,
        massageSessions: metric.massage_session ? 1 : 0,
        meals: metric.meals_tracked ? 1 : 0,
      };
    },
  });
}

export function useManualHealthEntries(days: number = 7) {
  const { user } = useAuth({ autoFetch: false });
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: ['manual-health-entries', days, userId],
    enabled: !!userId,
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('health_metrics')
        .select('*')
        .eq('user_id', userId!)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) throw error;
      return data as HealthMetric[];
    },
  });
}

export function useTodayHealthSummary() {
  return useTodayHealthMetrics();
}
