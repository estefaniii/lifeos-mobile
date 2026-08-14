import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, type Client } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';

export function useClients() {
  const { user } = useAuth({ autoFetch: false });
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: ['clients', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', userId!)
        .order('name', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Client[];
    },
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  const { user } = useAuth({ autoFetch: false });
  const userId = user?.id ?? null;

  return useMutation({
    mutationFn: async (client: { name: string; color?: string; notes?: string }) => {
      if (!userId) throw new Error('Sesión no válida.');
      const { error } = await supabase.from('clients').insert([
        { user_id: userId, name: client.name, color: client.color || '#14B8A6', notes: client.notes || '' },
      ]);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Client> & { id: string }) => {
      const { error } = await supabase.from('clients').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });
}
