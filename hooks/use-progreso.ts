// Fotos de progreso del cuerpo: privadas, en el bucket «progreso» (supabase/progreso-dia.sql).
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { fechaLocal } from '@/lib/registros';

const useUserId = () => useAuth({ autoFetch: false }).user?.id ?? null;
export type FotoProgreso = { id: string; path: string; taken_on: string; note: string | null; url: string | null };

export function useFotosProgreso() {
  const userId = useUserId();
  return useQuery({
    queryKey: ['progreso', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from('progress_photos').select('id, path, taken_on, note')
        .eq('user_id', userId!).order('taken_on', { ascending: false }).order('created_at', { ascending: false });
      if (error) throw error;
      const filas = data ?? [];
      if (!filas.length) return [] as FotoProgreso[];
      const { data: urls } = await supabase.storage.from('progreso').createSignedUrls(filas.map((f) => f.path), 3600);
      const por = Object.fromEntries((urls ?? []).map((u) => [u.path, u.signedUrl]));
      return filas.map((f) => ({ ...f, url: por[f.path] ?? null })) as FotoProgreso[];
    },
    staleTime: 50 * 60 * 1000,
  });
}

export function useProgresoActions() {
  const qc = useQueryClient(), userId = useUserId();
  const listo = () => qc.invalidateQueries({ queryKey: ['progreso'] });
  const subir = useMutation({
    mutationFn: async ({ uri, mime, nota }: { uri: string; mime?: string | null; nota?: string }) => {
      if (!userId) throw new Error('Sesión no válida.');
      const tipo = mime || 'image/jpeg';
      const path = `${userId}/${Date.now()}.${tipo.includes('png') ? 'png' : 'jpg'}`;
      const { error: e1 } = await supabase.storage.from('progreso').upload(path, await (await fetch(uri)).arrayBuffer(), { contentType: tipo });
      if (e1) throw e1;
      const { error: e2 } = await supabase.from('progress_photos').insert([{ user_id: userId, path, taken_on: fechaLocal(), note: nota || null }]);
      if (e2) { await supabase.storage.from('progreso').remove([path]); throw e2 }
    },
    onSuccess: listo,
  });
  const borrar = useMutation({
    mutationFn: async (f: FotoProgreso) => {
      await supabase.storage.from('progreso').remove([f.path]);
      const { error } = await supabase.from('progress_photos').delete().eq('id', f.id);
      if (error) throw error;
    },
    onSuccess: listo,
  });
  return { subir, borrar };
}
