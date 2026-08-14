import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, type Note } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';

export function useNotes() {
  const { user } = useAuth({ autoFetch: false });
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: ['notes', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId!)
        .order('pinned', { ascending: false })
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Note[];
    },
  });
}

export type NewNote = { title: string; content?: string; color?: string; pinned?: boolean; client?: string; archived?: boolean; remind_at?: string | null };

export function useCreateNote() {
  const queryClient = useQueryClient();
  const { user } = useAuth({ autoFetch: false });
  const userId = user?.id ?? null;

  return useMutation({
    mutationFn: async (note: NewNote) => {
      if (!userId) throw new Error('Sesión no válida.');
      const { error } = await supabase.from('notes').insert([
        {
          user_id: userId,
          title: note.title,
          content: note.content || '',
          color: note.color || '#18181B',
          pinned: note.pinned ?? false,
          client: note.client || '',
          remind_at: note.remind_at || null,
        },
      ]);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes'] }),
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<NewNote> & { id: string }) => {
      const { error } = await supabase
        .from('notes')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes'] }),
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes'] }),
  });
}
