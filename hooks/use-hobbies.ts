// Hobbies con sus sesiones y obras en curso con fotos.
// Tablas y bucket «obras» en supabase/registros-hobbies.sql.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';

const useUserId = () => useAuth({ autoFetch: false }).user?.id ?? null;

export type Hobby = { id: string; name: string; kind: string; emoji: string; color: string; weekly_goal_min: number; active: boolean };
export type HobbySession = { id: string; hobby_id: string; work_id: string | null; minutes: number; note: string | null; done_at: string };
export type EstadoObra = 'idea' | 'en_proceso' | 'pausada' | 'terminada' | 'regalada' | 'vendida';
export type Obra = {
  id: string; hobby_id: string | null; name: string; description: string | null; status: EstadoObra;
  progress_pct: number; started_on: string | null; finished_on: string | null; updated_at: string;
  craft_work_images: { id: string; path: string; sort_order: number }[];
};

const listo = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ['hobbies'] });
  qc.invalidateQueries({ queryKey: ['hobby-sessions'] });
  qc.invalidateQueries({ queryKey: ['obras'] });
  qc.invalidateQueries({ queryKey: ['historial'] });
};

export function useHobbies() {
  const userId = useUserId();
  return useQuery({
    queryKey: ['hobbies', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from('hobbies').select('*').eq('user_id', userId!).eq('active', true).order('created_at');
      if (error) throw error;
      return (data ?? []) as Hobby[];
    },
  });
}

export function useHobbySessions(dias = 60) {
  const userId = useUserId();
  return useQuery({
    queryKey: ['hobby-sessions', userId, dias],
    enabled: !!userId,
    queryFn: async () => {
      const desde = new Date(); desde.setDate(desde.getDate() - dias);
      const { data, error } = await supabase.from('hobby_sessions').select('*')
        .eq('user_id', userId!).gte('done_at', desde.toISOString()).order('done_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as HobbySession[];
    },
  });
}

export function useObras() {
  const userId = useUserId();
  return useQuery({
    queryKey: ['obras', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from('craft_works').select('*, craft_work_images(id, path, sort_order)')
        .eq('user_id', userId!).order('updated_at', { ascending: false });
      if (error) throw error;
      return ((data ?? []) as Obra[]).map((o) => ({
        ...o, craft_work_images: [...(o.craft_work_images ?? [])].sort((a, b) => a.sort_order - b.sort_order),
      }));
    },
  });
}

// El bucket es privado: las fotos se ven con enlaces firmados de una hora
export function useFotosFirmadas(paths: string[]) {
  return useQuery({
    queryKey: ['obras-fotos', paths],
    enabled: paths.length > 0,
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from('obras').createSignedUrls(paths, 3600);
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((d) => [d.path, d.signedUrl])) as Record<string, string>;
    },
  });
}

export function useHobbyActions() {
  const qc = useQueryClient(), userId = useUserId();
  const sesion = () => { if (!userId) throw new Error('Sesión no válida.'); return userId };

  const crearHobby = useMutation({
    mutationFn: async (h: Pick<Hobby, 'name' | 'kind' | 'emoji' | 'color' | 'weekly_goal_min'>) => {
      const { error } = await supabase.from('hobbies').insert([{ ...h, user_id: sesion() }]);
      if (error) throw error;
    },
    onSuccess: () => listo(qc),
  });
  // Archivar en vez de borrar: las sesiones viejas siguen contando en el historial
  const archivarHobby = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('hobbies').update({ active: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => listo(qc),
  });
  const registrarSesion = useMutation({
    mutationFn: async (s: { hobby_id: string; minutes: number; note?: string; work_id?: string | null }) => {
      const { error } = await supabase.from('hobby_sessions').insert([{ ...s, note: s.note || null, work_id: s.work_id ?? null, user_id: sesion() }]);
      if (error) throw error;
    },
    onSuccess: () => listo(qc),
  });
  const borrarSesion = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('hobby_sessions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => listo(qc),
  });

  const crearObra = useMutation({
    mutationFn: async (o: { name: string; description?: string; hobby_id?: string | null; status?: EstadoObra }) => {
      const hoy = new Date();
      const started_on = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
      const { data, error } = await supabase.from('craft_works')
        .insert([{ ...o, description: o.description || null, hobby_id: o.hobby_id ?? null, started_on, user_id: sesion() }]).select('id').single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => listo(qc),
  });
  const cambiarObra = useMutation({
    mutationFn: async ({ id, ...cambios }: Partial<Omit<Obra, 'craft_work_images'>> & { id: string }) => {
      const extra: Record<string, unknown> = { updated_at: new Date().toISOString() };
      // Al terminarla se sella la fecha; al volver a abrirla se quita
      if (cambios.status) {
        const cerrada = ['terminada', 'regalada', 'vendida'].includes(cambios.status);
        extra.finished_on = cerrada ? new Date().toISOString().slice(0, 10) : null;
        if (cerrada) extra.progress_pct = 100;
      }
      const { error } = await supabase.from('craft_works').update({ ...cambios, ...extra }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => listo(qc),
  });
  const borrarObra = useMutation({
    mutationFn: async (o: Obra) => {
      const paths = o.craft_work_images.map((i) => i.path);
      if (paths.length) await supabase.storage.from('obras').remove(paths);
      const { error } = await supabase.from('craft_works').delete().eq('id', o.id);
      if (error) throw error;
    },
    onSuccess: () => listo(qc),
  });

  // Sube una foto (uri local del selector) a <user_id>/<obra>/<archivo>
  const subirFoto = useMutation({
    mutationFn: async ({ obra, uri, mime, orden }: { obra: string; uri: string; mime?: string | null; orden: number }) => {
      const uid = sesion();
      const tipo = mime || 'image/jpeg';
      const ext = tipo.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
      const path = `${uid}/${obra}/${Date.now()}.${ext}`;
      const cuerpo = await (await fetch(uri)).arrayBuffer();
      const { error: e1 } = await supabase.storage.from('obras').upload(path, cuerpo, { contentType: tipo });
      if (e1) throw e1;
      const { error: e2 } = await supabase.from('craft_work_images').insert([{ user_id: uid, work_id: obra, path, sort_order: orden }]);
      if (e2) { await supabase.storage.from('obras').remove([path]); throw e2 }
      await supabase.from('craft_works').update({ updated_at: new Date().toISOString() }).eq('id', obra);
    },
    onSuccess: () => listo(qc),
  });
  const borrarFoto = useMutation({
    mutationFn: async (img: { id: string; path: string }) => {
      await supabase.storage.from('obras').remove([img.path]);
      const { error } = await supabase.from('craft_work_images').delete().eq('id', img.id);
      if (error) throw error;
    },
    onSuccess: () => listo(qc),
  });

  return { crearHobby, archivarHobby, registrarSesion, borrarSesion, crearObra, cambiarObra, borrarObra, subirFoto, borrarFoto };
}
