import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, type Project, type ProductivityLog } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';

export function useProjects() {
  const { user } = useAuth({ autoFetch: false });
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: ['projects', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId!)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Project[];
    },
  });
}

export function useProductivityLogs(days: number = 7) {
  const { user } = useAuth({ autoFetch: false });
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: ['productivity-logs', days, userId],
    enabled: !!userId,
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('productivity_logs')
        .select('*, projects(name)')
        .eq('user_id', userId!)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) throw error;
      return data as any[];
    },
  });
}

export function useProductivityByProject(days: number = 7) {
  const { user } = useAuth({ autoFetch: false });
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: ['productivity-by-project', days, userId],
    enabled: !!userId,
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('productivity_logs')
        .select('project_id, duration_minutes, projects(name)')
        .eq('user_id', userId!)
        .gte('date', startDate.toISOString().split('T')[0]);

      if (error) throw error;

      const grouped = (data as any[]).reduce(
        (acc: Array<{ name: string; minutes: number }>, log) => {
          const projectName = log.projects?.name || 'Sin proyecto';
          const existing = acc.find((p) => p.name === projectName);
          if (existing) {
            existing.minutes += log.duration_minutes;
          } else {
            acc.push({ name: projectName, minutes: log.duration_minutes });
          }
          return acc;
        },
        []
      );

      return grouped.map((p) => ({ ...p, hours: (p.minutes / 60).toFixed(1) }));
    },
  });
}

export function useTodayProductivity() {
  const { user } = useAuth({ autoFetch: false });
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: ['today-productivity', userId],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];

      let query = supabase
        .from('productivity_logs')
        .select('project_id, duration_minutes, note, projects(name)')
        .eq('date', today);

      if (userId) query = query.eq('user_id', userId);

      const { data, error } = await query;
      if (error) throw error;

      const logs = data as any[];
      const totalMinutes = logs.reduce((sum, log) => sum + log.duration_minutes, 0);

      const byProject = logs.reduce(
        (acc: Array<{ name: string; minutes: number }>, log) => {
          const projectName = log.projects?.name || log.note || 'Sin clasificar';
          const existing = acc.find((p) => p.name === projectName);
          if (existing) {
            existing.minutes += log.duration_minutes;
          } else {
            acc.push({ name: projectName, minutes: log.duration_minutes });
          }
          return acc;
        },
        []
      );

      return { totalMinutes, totalHours: (totalMinutes / 60).toFixed(1), byProject };
    },
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, userId }: { name: string; userId: string }) => {
      const { data, error } = await supabase
        .from('projects')
        .insert([{ name, user_id: userId, status: 'active' }])
        .select()
        .single();
      if (error) throw error;
      return data as Project;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });
}
