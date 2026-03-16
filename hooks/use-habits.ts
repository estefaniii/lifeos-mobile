import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';

export function useHabits() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: ['habits', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', userId!)
        .eq('is_active', true)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useTodayHabitLogs() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const today = new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: ['habit-logs', userId, today],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('user_id', userId!)
        .eq('date', today);
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useHabitStreaks() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: ['habit-streaks', userId],
    enabled: !!userId,
    queryFn: async () => {
      // Fetch last 30 days of logs to calculate streaks
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('habit_logs')
        .select('habit_id, date, completed')
        .eq('user_id', userId!)
        .eq('completed', true)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) throw error;

      // Calculate streaks per habit
      const streaks: Record<string, number> = {};
      const logsByHabit: Record<string, string[]> = {};

      for (const log of (data || [])) {
        if (!logsByHabit[log.habit_id]) logsByHabit[log.habit_id] = [];
        logsByHabit[log.habit_id].push(log.date);
      }

      for (const [habitId, dates] of Object.entries(logsByHabit)) {
        const uniqueDates = [...new Set(dates)].sort().reverse();
        let streak = 0;
        const today = new Date();

        for (let i = 0; i < uniqueDates.length; i++) {
          const expected = new Date(today);
          expected.setDate(expected.getDate() - i);
          const expectedStr = expected.toISOString().split('T')[0];

          if (uniqueDates[i] === expectedStr) {
            streak++;
          } else {
            break;
          }
        }

        streaks[habitId] = streak;
      }

      return streaks;
    },
  });
}

export function useToggleHabit() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ habitId, completed }: { habitId: string; completed: boolean }) => {
      const userId = user?.id;
      if (!userId) throw new Error('No user');
      const today = new Date().toISOString().split('T')[0];

      if (completed) {
        // Check if log exists
        const { data: existing } = await supabase
          .from('habit_logs')
          .select('id')
          .eq('user_id', userId)
          .eq('habit_id', habitId)
          .eq('date', today)
          .maybeSingle();

        if (existing) {
          await supabase.from('habit_logs').update({ completed: true }).eq('id', existing.id);
        } else {
          const { error } = await supabase.from('habit_logs').insert({
            user_id: userId,
            habit_id: habitId,
            date: today,
            completed: true,
          });
          if (error) throw error;
        }
      } else {
        // Uncheck: delete today's log
        await supabase
          .from('habit_logs')
          .delete()
          .eq('user_id', String(userId))
          .eq('habit_id', habitId)
          .eq('date', today);
      }
    },
    onSuccess: () => {
      const today = new Date().toISOString().split('T')[0];
      queryClient.invalidateQueries({ queryKey: ['habit-logs'] });
      queryClient.invalidateQueries({ queryKey: ['habit-streaks'] });
    },
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ name, emoji, color }: { name: string; emoji: string; color: string }) => {
      const userId = user?.id;
      if (!userId) throw new Error('No user');

      const { error } = await supabase.from('habits').insert({
        user_id: userId,
        name,
        emoji,
        color,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (habitId: string) => {
      // Soft delete: mark as inactive
      const { error } = await supabase
        .from('habits')
        .update({ is_active: false })
        .eq('id', habitId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
}
