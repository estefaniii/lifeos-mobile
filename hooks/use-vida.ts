// Ejercicio y comida: sesiones de ejercicio, plan semanal de comidas y lista de compras.
// Tablas en supabase/vida-personal.sql.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { PLAN_SUGERIDO, SLOTS, type Slot } from '@/constants/comida';

const useUserId = () => useAuth({ autoFetch: false }).user?.id ?? null;
const fechaLocal = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// ---------- ejercicio ----------
export type ExerciseSession = { id: string; zone: string; routine: string; minutes: number; done_on: string; exercises: string[] };

export function useExerciseSessions(dias = 30) {
  const userId = useUserId();
  return useQuery({
    queryKey: ['exercise-sessions', userId, dias],
    enabled: !!userId,
    queryFn: async () => {
      const desde = new Date(); desde.setDate(desde.getDate() - dias);
      const { data, error } = await supabase.from('exercise_sessions').select('*')
        .eq('user_id', userId!).gte('done_on', fechaLocal(desde)).order('done_on', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ExerciseSession[];
    },
  });
}

export function useLogExercise() {
  const qc = useQueryClient(), userId = useUserId();
  return useMutation({
    mutationFn: async (s: Omit<ExerciseSession, 'id' | 'done_on'>) => {
      if (!userId) throw new Error('Sesión no válida.');
      const { error } = await supabase.from('exercise_sessions').insert([{ ...s, user_id: userId, done_on: fechaLocal() }]);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exercise-sessions'] }),
  });
}

// ---------- plan de comidas ----------
export type MealRow = { day: number; slot: Slot; meal: string };

export function useMealPlan() {
  const userId = useUserId();
  return useQuery({
    queryKey: ['meal-plan', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from('meal_plan').select('day, slot, meal').eq('user_id', userId!);
      if (error) throw error;
      return (data ?? []) as MealRow[];
    },
  });
}

export function useSaveMeal() {
  const qc = useQueryClient(), userId = useUserId();
  return useMutation({
    mutationFn: async (rows: MealRow[]) => {
      if (!userId) throw new Error('Sesión no válida.');
      const { error } = await supabase.from('meal_plan')
        .upsert(rows.map((r) => ({ ...r, user_id: userId, updated_at: new Date().toISOString() })), { onConflict: 'user_id,day,slot' });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meal-plan'] }),
  });
}

// Copia el plan sugerido a tu plan editable
export const filasSugeridas = (): MealRow[] =>
  PLAN_SUGERIDO.flatMap((comidas, day) => SLOTS.map((slot, i) => ({ day, slot, meal: comidas[i] ?? '' })));

// ---------- lista de compras ----------
export type ShoppingItem = { id: string; name: string; done: boolean };

export function useShopping() {
  const userId = useUserId();
  return useQuery({
    queryKey: ['shopping', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from('shopping_items').select('id, name, done')
        .eq('user_id', userId!).order('done').order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ShoppingItem[];
    },
  });
}

export function useShoppingActions() {
  const qc = useQueryClient(), userId = useUserId();
  const listo = () => qc.invalidateQueries({ queryKey: ['shopping'] });
  const add = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from('shopping_items').insert([{ user_id: userId, name }]);
      if (error) throw error;
    },
    onSuccess: listo,
  });
  const toggle = useMutation({
    mutationFn: async (item: ShoppingItem) => {
      const { error } = await supabase.from('shopping_items').update({ done: !item.done }).eq('id', item.id);
      if (error) throw error;
    },
    onSuccess: listo,
  });
  const clearDone = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('shopping_items').delete().eq('user_id', userId!).eq('done', true);
      if (error) throw error;
    },
    onSuccess: listo,
  });
  return { add, toggle, clearDone };
}
