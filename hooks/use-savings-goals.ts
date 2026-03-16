import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  color: string;
  created_at: string;
}

export function useSavingsGoals() {
  const { user } = useAuth({ autoFetch: false });
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: ['savings-goals', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as SavingsGoal[];
    },
  });
}

export function useCreateSavingsGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (goal: { name: string; target_amount: number; current_amount: number; color: string; user_id: string }) => {
      const { data, error } = await supabase.from('savings_goals').insert([goal]).select().single();
      if (error) throw error;
      return data as SavingsGoal;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['savings-goals'] }),
  });
}

export function useUpdateSavingsGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, current_amount }: { id: string; current_amount: number }) => {
      const { error } = await supabase
        .from('savings_goals')
        .update({ current_amount })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['savings-goals'] }),
  });
}

export function useDeleteSavingsGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('savings_goals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['savings-goals'] }),
  });
}
