import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  limit_amount: number;
  period: 'month' | 'week';
  created_at: string;
}

export function useBudgets() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['budgets', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .order('category');
      if (error) throw error;
      return (data || []) as Budget[];
    },
    enabled: !!user?.id,
  });
}

export function useBudgetProgress() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['budget-progress', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get budgets
      const { data: budgets } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id);
      if (!budgets || budgets.length === 0) return [];

      // Get this month's expenses by category
      const now = new Date();
      const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const { data: transactions } = await supabase
        .from('transactions')
        .select('category, amount')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .gte('date', startOfMonth);

      // Calculate spent per category
      const spentByCategory: Record<string, number> = {};
      (transactions || []).forEach((t: any) => {
        const cat = t.category || 'Otros';
        spentByCategory[cat] = (spentByCategory[cat] || 0) + Math.abs(t.amount);
      });

      return (budgets as Budget[]).map((b) => ({
        ...b,
        spent: spentByCategory[b.category] || 0,
        percentage: b.limit_amount > 0
          ? Math.round(((spentByCategory[b.category] || 0) / b.limit_amount) * 100)
          : 0,
      }));
    },
    enabled: !!user?.id,
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { user_id: string; category: string; limit_amount: number }) => {
      const { error } = await supabase.from('budgets').upsert(
        { ...data, period: 'month' },
        { onConflict: 'user_id,category' }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget-progress'] });
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('budgets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget-progress'] });
    },
  });
}
