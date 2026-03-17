import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { useEffect } from 'react';

export interface RecurringTransaction {
  id: string;
  user_id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  note: string;
  frequency: 'monthly' | 'weekly' | 'biweekly';
  day_of_month: number;
  is_active: boolean;
  last_applied: string | null;
  created_at: string;
}

export function useRecurringTransactions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['recurring', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('recurring_transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('day_of_month');
      if (error) throw error;
      return (data || []) as RecurringTransaction[];
    },
    enabled: !!user?.id,
  });
}

export function useCreateRecurring() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      user_id: string;
      type: 'income' | 'expense';
      amount: number;
      category: string;
      note: string;
      frequency: 'monthly' | 'weekly' | 'biweekly';
      day_of_month: number;
    }) => {
      const { error } = await supabase.from('recurring_transactions').insert({
        ...data,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
    },
  });
}

export function useDeleteRecurring() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('recurring_transactions')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
    },
  });
}

// Auto-apply recurring transactions that are due
export function useApplyRecurring() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

        const { data: recurrings } = await supabase
          .from('recurring_transactions')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (!recurrings) return;

        for (const r of recurrings) {
          // Check if already applied this month
          if (r.last_applied && r.last_applied.startsWith(currentMonth)) continue;

          // Check if today is the day (or past it this month)
          if (today.getDate() >= r.day_of_month) {
            // Apply the transaction
            await supabase.from('transactions').insert({
              user_id: user.id,
              type: r.type,
              amount: r.type === 'expense' ? -Math.abs(r.amount) : Math.abs(r.amount),
              category: r.category,
              note: `[Auto] ${r.note}`,
              date: todayStr,
            });

            // Mark as applied
            await supabase
              .from('recurring_transactions')
              .update({ last_applied: todayStr })
              .eq('id', r.id);
          }
        }

        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      } catch (err) {
        console.warn('[Recurring] Error applying:', err);
      }
    })();
  }, [user?.id]);
}
