import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, type Task, type TaskPriority } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';

export function useTasks() {
  const { user } = useAuth({ autoFetch: false });
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: ['tasks', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId!)
        .order('done', { ascending: true })
        .order('due_date', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as Task[];
    },
  });
}

export type NewTask = {
  client?: string;
  title: string;
  notes?: string;
  due_date?: string | null;
  priority: TaskPriority;
};

export function useCreateTask() {
  const queryClient = useQueryClient();
  const { user } = useAuth({ autoFetch: false });
  const userId = user?.id ?? null;

  return useMutation({
    mutationFn: async (task: NewTask) => {
      if (!userId) throw new Error('Sesión no válida.');
      const { error } = await supabase.from('tasks').insert([
        {
          user_id: userId,
          client: task.client || '',
          title: task.title,
          notes: task.notes || '',
          due_date: task.due_date || null,
          priority: task.priority,
          done: false,
        },
      ]);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<NewTask & { done: boolean }> & { id: string }) => {
      const updates: Record<string, any> = { updated_at: new Date().toISOString() };
      for (const [k, v] of Object.entries(patch)) {
        if (k === 'due_date') updates.due_date = v || null;
        else updates[k] = v;
      }
      const { error } = await supabase.from('tasks').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useToggleTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const { error } = await supabase
        .from('tasks')
        .update({ done, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
}
