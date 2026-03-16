import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';

export function useDailyAffirmation() {
  const { user } = useAuth({ autoFetch: false });
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: ['daily-affirmation', userId],
    enabled: !!userId,
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];

      if (!userId) return null;

      const { data, error } = await supabase
        .from('affirmations')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    },
  });
}

export function useStressTrend(days: number = 7) {
  const { user } = useAuth({ autoFetch: false });
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: ['stress-trend', days, userId],
    enabled: !!userId,
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('mental_logs')
        .select('date, stress_level')
        .eq('user_id', userId!)
        .gte('date', startDate.toISOString().split('T')[0])
        .not('stress_level', 'is', null)
        .order('date', { ascending: true });

      if (error) throw error;
      return (data || []).map((item: any) => ({
        x: new Date(item.date).toLocaleDateString('es-ES', { weekday: 'short' }),
        y: item.stress_level,
      }));
    },
  });
}

export function useTodayMeditation() {
  const { user } = useAuth({ autoFetch: false });
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: ['today-meditation', userId],
    enabled: !!userId,
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];

      let query = supabase
        .from('mental_logs')
        .select('meditation_minutes')
        .eq('date', today);

      if (userId) query = (query as any).eq('user_id', userId);

      const { data, error } = await query;
      if (error) throw error;

      const total = (data || []).reduce((sum: number, item: any) => sum + (item.meditation_minutes || 0), 0);
      return { meditationMinutes: total };
    },
  });
}

export function useTodayMindWellness() {
  const { user } = useAuth({ autoFetch: false });
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: ['today-mind-wellness', userId],
    enabled: !!userId,
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];

      let query = supabase
        .from('mental_logs')
        .select('stress_level, meditation_minutes, note')
        .eq('date', today);

      if (userId) query = (query as any).eq('user_id', userId);

      const { data, error } = await query;
      if (error) throw error;

      const entries = data || [];
      const totalMeditation = entries.reduce((acc: number, curr: any) => acc + (curr.meditation_minutes || 0), 0);
      const latestStress = entries.length > 0 ? (entries as any[]).findLast((e: any) => e.stress_level !== null)?.stress_level : 0;
      const journalEntries = entries.filter((e: any) => e.note && e.note.trim() !== '').length;

      return {
        stressLevel: latestStress || 0,
        meditationMinutes: totalMeditation,
        journalEntries,
      };
    },
  });
}

export function useAddMindWellnessEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, type, value, stressLevel, note }: {
      userId: string;
      type: 'stress' | 'meditation' | 'journal';
      value?: number;
      stressLevel?: number;
      note?: string;
    }) => {
      const today = new Date().toISOString().split('T')[0];

      if (type === 'stress') {
        const { error } = await supabase.from('mental_logs').upsert({
          user_id: userId,
          stress_level: stressLevel,
          date: today,
        }, { onConflict: 'user_id,date' });
        if (error) throw error;
      } else if (type === 'meditation') {
        const { error } = await supabase.from('mental_logs').insert([{
          user_id: userId,
          meditation_minutes: value,
          date: today,
        }]);
        if (error) throw error;
      } else if (type === 'journal') {
        const { error } = await supabase.from('mental_logs').insert([{
          user_id: userId,
          note,
          date: today,
          meditation_minutes: 0,
        }]);
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['today-mind-wellness'] });
      if (variables.type === 'stress') {
        queryClient.invalidateQueries({ queryKey: ['stress-trend'] });
      }
    },
  });
}

export function useAffirmationHistory(limit: number = 10) {
  const { user } = useAuth({ autoFetch: false });
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: ['affirmation-history', limit, userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('affirmations')
        .select('*')
        .eq('user_id', userId!)
        .order('date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
  });
}

export function useDeleteAffirmation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('affirmations').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affirmation-history'] });
      queryClient.invalidateQueries({ queryKey: ['daily-affirmation'] });
    },
  });
}
