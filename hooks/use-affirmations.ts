import { useQuery } from '@tanstack/react-query';
import { supabase, type Affirmation } from '@/lib/supabase';

/**
 * Hook para obtener la afirmación del día
 * 
 * @returns Query result con la afirmación más reciente
 */
export function useTodayAffirmation() {
  return useQuery({
    queryKey: ['today-affirmation'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('affirmations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as Affirmation | null;
    },
  });
}

/**
 * Hook para obtener historial de afirmaciones
 * 
 * @param limit - Número de afirmaciones a recuperar
 * @returns Query result con afirmaciones
 */
export function useAffirmationHistory(limit: number = 7) {
  return useQuery({
    queryKey: ['affirmation-history', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('affirmations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Affirmation[];
    },
  });
}
