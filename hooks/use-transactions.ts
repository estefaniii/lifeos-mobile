import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, type Transaction } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';

export function useTransactions(period: 'day' | 'week' | 'month' | 'year' = 'month') {
  const { user } = useAuth({ autoFetch: false });
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: ['transactions', period, userId],
    enabled: !!userId,
    queryFn: async () => {
      const now = new Date();
      let startDate = new Date();
      switch (period) {
        case 'day': startDate.setDate(now.getDate() - 1); break;
        case 'week': startDate.setDate(now.getDate() - 7); break;
        case 'month': startDate.setMonth(now.getMonth() - 1); break;
        case 'year': startDate.setFullYear(now.getFullYear() - 1); break;
      }

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId!)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) throw error;
      return data as Transaction[];
    },
  });
}

export function useFinancialSummary(period: 'day' | 'week' | 'month' | 'year' = 'month') {
  const { user } = useAuth({ autoFetch: false });
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: ['financial-summary', period, userId],
    enabled: !!userId,
    queryFn: async () => {
      const now = new Date();
      let startDate = new Date();
      switch (period) {
        case 'day': startDate.setDate(now.getDate() - 1); break;
        case 'week': startDate.setDate(now.getDate() - 7); break;
        case 'month': startDate.setMonth(now.getMonth() - 1); break;
        case 'year': startDate.setFullYear(now.getFullYear() - 1); break;
      }

      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, type')
        .eq('user_id', userId!)
        .gte('date', startDate.toISOString().split('T')[0]);

      if (!transactions) return { income: 0, expenses: 0, balance: 0 };

      const income = transactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const expenses = transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      return { income, expenses, balance: income - expenses };
    },
  });
}

export function useExpensesByCategory(period: 'day' | 'week' | 'month' | 'year' = 'month') {
  const { user } = useAuth({ autoFetch: false });
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: ['expenses-by-category', period, userId],
    enabled: !!userId,
    queryFn: async () => {
      const now = new Date();
      let startDate = new Date();
      switch (period) {
        case 'day': startDate.setDate(now.getDate() - 1); break;
        case 'week': startDate.setDate(now.getDate() - 7); break;
        case 'month': startDate.setMonth(now.getMonth() - 1); break;
        case 'year': startDate.setFullYear(now.getFullYear() - 1); break;
      }

      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, category')
        .eq('user_id', userId!)
        .eq('type', 'expense')
        .gte('date', startDate.toISOString().split('T')[0]);

      if (!transactions) return [];

      const grouped = transactions.reduce((acc: Record<string, number>, t: any) => {
        const categoryName = t.category || 'Otros';
        acc[categoryName] = (acc[categoryName] || 0) + Math.abs(t.amount);
        return acc;
      }, {});

      return Object.entries(grouped).map(([name, amount]) => ({
        name,
        amount: amount as number,
      }));
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, amount, note, category, type }: {
      id: number;
      amount: number;
      note?: string;
      category?: string;
      type?: 'income' | 'expense';
    }) => {
      const updates: any = {};
      if (amount !== undefined) updates.amount = type === 'expense' ? -Math.abs(amount) : Math.abs(amount);
      if (note !== undefined) updates.note = note;
      if (category !== undefined) updates.category = category;
      if (type !== undefined) updates.type = type;
      const { error } = await supabase.from('transactions').update(updates).eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-by-category'] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-by-category'] });
    },
  });
}
