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

export type BudgetProgress = Budget & { spent: number; percentage: number };

/** Mismo nombre sin importar mayúsculas ni espacios: «comida » = «Comida». */
const claveCategoria = (c: string | null | undefined) => (c || 'Otros').trim().toLowerCase();

// La clave empieza por 'transactions' a propósito: los hooks de movimientos
// invalidan ['transactions'] al crear, editar o borrar, y React Query compara
// por prefijo. Así la barra del presupuesto se mueve sola al anotar un gasto.
const CLAVE_PROGRESO = 'transactions-budget-progress';

export function useBudgetProgress() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['transactions', CLAVE_PROGRESO, user?.id],
    queryFn: async (): Promise<BudgetProgress[]> => {
      if (!user?.id) return [];

      const { data: budgets, error: errorPresupuestos } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .order('category');
      if (errorPresupuestos) throw errorPresupuestos;
      if (!budgets || budgets.length === 0) return [];

      // Gastos de este mes, en la fecha del teléfono
      const now = new Date();
      const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('category, amount')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .gte('date', startOfMonth);
      if (error) throw error;

      // Postgres devuelve los numeric como texto: Number() antes de sumar
      const spentByCategory: Record<string, number> = {};
      (transactions || []).forEach((t: { category: string | null; amount: number | string }) => {
        const cat = claveCategoria(t.category);
        spentByCategory[cat] = (spentByCategory[cat] || 0) + Math.abs(Number(t.amount) || 0);
      });

      return (budgets as Budget[]).map((b) => {
        const limite = Number(b.limit_amount) || 0;
        const spent = spentByCategory[claveCategoria(b.category)] || 0;
        return { ...b, limit_amount: limite, spent, percentage: limite > 0 ? Math.round((spent / limite) * 100) : 0 };
      });
    },
    enabled: !!user?.id,
  });
}

/**
 * Crea el presupuesto de una categoría o cambia su límite si ya existe.
 * Se busca a mano en vez de usar upsert: el upsert necesita una restricción
 * única (user_id, category) que no está en los SQL del repo.
 */
export function useCreateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { user_id: string; category: string; limit_amount: number }) => {
      const { data: existentes, error: errorLeer } = await supabase
        .from('budgets').select('id, category').eq('user_id', data.user_id);
      if (errorLeer) throw errorLeer;
      const ya = (existentes || []).find((b: { category: string }) => claveCategoria(b.category) === claveCategoria(data.category));
      const { error } = ya
        ? await supabase.from('budgets').update({ limit_amount: data.limit_amount }).eq('id', ya.id)
        : await supabase.from('budgets').insert({ ...data, period: 'month' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['transactions', CLAVE_PROGRESO] });
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
      queryClient.invalidateQueries({ queryKey: ['transactions', CLAVE_PROGRESO] });
    },
  });
}
