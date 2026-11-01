// Programas guiados de ejercicio: planes de varios días con el video de
// cada día. Tablas en supabase/programas-ejercicio.sql.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';

const useUserId = () => useAuth({ autoFetch: false }).user?.id ?? null;
const fechaLocal = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export type DiaPrograma = {
  dia: number;
  titulo: string;
  /** El enlace del video. Vacío en los días de descanso. */
  video?: string;
  descanso?: boolean;
  notas?: string;
};

export type Programa = {
  id: string;
  name: string;
  author: string | null;
  source_url: string | null;
  days: DiaPrograma[];
  is_active: boolean;
  created_at: string;
};

export function useProgramas() {
  const userId = useUserId();
  return useQuery({
    queryKey: ['programas', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercise_programs')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Programa[];
    },
  });
}

/** Qué días ya hizo, de todos sus programas. */
export function useDiasHechos() {
  const userId = useUserId();
  return useQuery({
    queryKey: ['programa-dias', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercise_program_done')
        .select('program_id, day, done_on')
        .eq('user_id', userId!);
      if (error) throw error;
      return (data ?? []) as { program_id: string; day: number; done_on: string }[];
    },
  });
}

export function useGuardarPrograma() {
  const qc = useQueryClient(), userId = useUserId();
  return useMutation({
    mutationFn: async (p: Partial<Programa> & { name: string }) => {
      if (!userId) throw new Error('Sesión no válida.');
      const fila = {
        user_id: userId,
        name: p.name.trim(),
        author: p.author?.trim() || null,
        source_url: p.source_url?.trim() || null,
        days: p.days ?? [],
        updated_at: new Date().toISOString(),
      };
      // Con id actualiza, sin id crea. Un solo camino para los dos casos:
      // dos funciones separadas se separaban más con cada campo nuevo.
      const { error } = p.id
        ? await supabase.from('exercise_programs').update(fila).eq('id', p.id).eq('user_id', userId)
        : await supabase.from('exercise_programs').insert([fila]);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['programas'] }),
  });
}

export function useBorrarPrograma() {
  const qc = useQueryClient(), userId = useUserId();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!userId) throw new Error('Sesión no válida.');
      const { error } = await supabase.from('exercise_programs').delete().eq('id', id).eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['programas'] }),
  });
}

/**
 * Marca o desmarca un día.
 *
 * La tabla tiene una clave única por (usuario, programa, día), así que
 * tocar dos veces no cuenta el día dos veces. Sin eso, la racha y el
 * conteo salían inflados con solo volver a entrar.
 */
export function useMarcarDia() {
  const qc = useQueryClient(), userId = useUserId();
  return useMutation({
    mutationFn: async ({ programId, dia, hecho }: { programId: string; dia: number; hecho: boolean }) => {
      if (!userId) throw new Error('Sesión no válida.');
      if (hecho) {
        const { error } = await supabase
          .from('exercise_program_done')
          .delete()
          .eq('user_id', userId).eq('program_id', programId).eq('day', dia);
        if (error) throw error;
        return;
      }
      const { error } = await supabase
        .from('exercise_program_done')
        .insert([{ user_id: userId, program_id: programId, day: dia, done_on: fechaLocal() }]);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['programa-dias'] }),
  });
}
