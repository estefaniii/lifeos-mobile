// Registros con hora (life_logs) y el historial de todo lo que hiciste.
// El historial no copia nada: lee cada cosa de su propia tabla y la junta al leer.
// Tablas en supabase/registros-hobbies.sql.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { fechaLocal, deFecha, type Registro } from '@/lib/registros';

const useUserId = () => useAuth({ autoFetch: false }).user?.id ?? null;
export const ML_POR_VASO = 250;

type LifeLog = { id: string; kind: 'agua' | 'comida' | 'meditacion' | 'animo'; amount: number; label: string | null; logged_at: string };

// El total del día sigue en health_metrics.water_ml porque lo leen los anillos,
// Salud y el reporte mensual. Cada vaso, con su hora, vive en life_logs.
async function sumarAgua(userId: string, vasos: number) {
  const date = fechaLocal();
  const { data: fila } = await supabase.from('health_metrics').select('id, water_ml')
    .eq('user_id', userId).eq('date', date).maybeSingle();
  const total = Math.max(0, (fila?.water_ml ?? 0) + vasos * ML_POR_VASO);
  if (fila) await supabase.from('health_metrics').update({ water_ml: total }).eq('id', fila.id);
  else await supabase.from('health_metrics').insert({ user_id: userId, date, water_ml: total });
}

const refrescar = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ['historial'] });
  qc.invalidateQueries({ queryKey: ['life-logs'] });
  qc.invalidateQueries({ queryKey: ['health-metrics'] });
  qc.invalidateQueries({ queryKey: ['today-health-metrics'] });
};

// Los registros rápidos de hoy (para «último vaso a las 3:10 p. m.»)
export function useLifeLogsHoy() {
  const userId = useUserId();
  return useQuery({
    queryKey: ['life-logs', userId, fechaLocal()],
    enabled: !!userId,
    queryFn: async () => {
      const desde = new Date(); desde.setHours(0, 0, 0, 0);
      const { data, error } = await supabase.from('life_logs').select('*')
        .eq('user_id', userId!).gte('logged_at', desde.toISOString()).order('logged_at', { ascending: false });
      if (error) return [] as LifeLog[];   // tabla aún sin crear: la pantalla sigue funcionando
      return (data ?? []) as LifeLog[];
    },
  });
}

// Un toque = un registro con su hora
export function useRegistrar() {
  const qc = useQueryClient(), userId = useUserId();
  return useMutation({
    mutationFn: async (r: { kind: LifeLog['kind']; amount?: number; label?: string }) => {
      if (!userId) throw new Error('Sesión no válida.');
      const { error } = await supabase.from('life_logs').insert([{ user_id: userId, kind: r.kind, amount: r.amount ?? 1, label: r.label ?? null }]);
      // El total de agua se guarda aunque el registro con hora falle: no se pierde el vaso
      if (r.kind === 'agua') await sumarAgua(userId, r.amount ?? 1);
      if (error) throw error;
    },
    onSettled: () => refrescar(qc),
  });
}

export function useBorrarRegistro() {
  const qc = useQueryClient(), userId = useUserId();
  return useMutation({
    mutationFn: async (r: Registro) => {
      if (!userId) throw new Error('Sesión no válida.');
      const { error } = await supabase.from('life_logs').delete().eq('id', r.id);
      if (error) throw error;
      // Solo se descuenta si el vaso era de hoy: el total de otro día no se toca desde aquí
      if (r.tipo === 'agua' && fechaLocal(new Date(r.at)) === fechaLocal()) await sumarAgua(userId, -(r.cantidad ?? 1));
    },
    onSettled: () => refrescar(qc),
  });
}

// Todo lo que hiciste en los últimos `dias` días, de todas las tablas
export function useHistorial(dias = 14) {
  const userId = useUserId();
  return useQuery({
    queryKey: ['historial', userId, dias],
    enabled: !!userId,
    queryFn: async (): Promise<{ registros: Registro[]; faltaTabla: boolean }> => {
      const desde = new Date(); desde.setHours(0, 0, 0, 0); desde.setDate(desde.getDate() - (dias - 1));
      const iso = desde.toISOString(), dia = fechaLocal(desde);
      const [logs, ejercicio, habitos, mente, hobby] = await Promise.all([
        supabase.from('life_logs').select('*').eq('user_id', userId!).gte('logged_at', iso),
        supabase.from('exercise_sessions').select('id, zone, routine, minutes, done_on, created_at').eq('user_id', userId!).gte('done_on', dia),
        supabase.from('habit_logs').select('id, date, created_at, habits(name, emoji)').eq('user_id', userId!).eq('completed', true).gte('date', dia),
        supabase.from('mental_logs').select('id, date, created_at, meditation_minutes, stress_level, note').eq('user_id', userId!).gte('date', dia),
        supabase.from('hobby_sessions').select('id, minutes, note, done_at, hobbies(name, emoji), craft_works(name)').eq('user_id', userId!).gte('done_at', iso),
      ]);

      // Si la fila no trae hora (datos viejos), se pone al mediodía de su día
      const hora = (created: string | null, date: string) =>
        created && fechaLocal(new Date(created)) === date.slice(0, 10) ? created : deFecha(date).toISOString();

      const out: Registro[] = [];
      for (const l of (logs.data ?? []) as LifeLog[]) {
        const n = Number(l.amount);
        out.push({
          id: l.id, tipo: l.kind, at: l.logged_at, borrable: true, cantidad: n,
          titulo: l.kind === 'agua' ? `${n} ${n === 1 ? 'vaso' : 'vasos'} de agua`
            : l.kind === 'comida' ? (l.label ?? 'Comida')
            : l.kind === 'meditacion' ? `Meditación · ${n} min` : (l.label ?? 'Ánimo'),
        });
      }
      for (const e of (ejercicio.data ?? []) as any[])
        out.push({ id: e.id, tipo: 'ejercicio', at: hora(e.created_at, e.done_on), titulo: e.routine, detalle: `${e.zone} · ${e.minutes} min`, cantidad: e.minutes });
      for (const h of (habitos.data ?? []) as any[])
        out.push({ id: h.id, tipo: 'habito', at: hora(h.created_at, h.date), titulo: `${h.habits?.emoji ?? '✓'} ${h.habits?.name ?? 'Hábito'}` });
      for (const m of (mente.data ?? []) as any[]) {
        if (m.meditation_minutes) out.push({ id: m.id, tipo: 'meditacion', at: hora(m.created_at, m.date), titulo: `Meditación · ${m.meditation_minutes} min`, cantidad: m.meditation_minutes });
        else if (m.stress_level) out.push({ id: m.id, tipo: 'animo', at: hora(m.created_at, m.date), titulo: `Estrés ${m.stress_level}/10`, detalle: m.note ?? undefined });
      }
      for (const s of (hobby.data ?? []) as any[])
        out.push({
          id: s.id, tipo: 'hobby', at: s.done_at, cantidad: s.minutes,
          titulo: `${s.hobbies?.emoji ?? '✨'} ${s.hobbies?.name ?? 'Hobby'} · ${s.minutes} min`,
          detalle: [s.craft_works?.name, s.note].filter(Boolean).join(' · ') || undefined,
        });

      return { registros: out, faltaTabla: !!logs.error || !!hobby.error };
    },
  });
}

// ─── Liberar espacio ─────────────────────────────────────────────────────────
// Lo que más crece con los meses. Solo registros del día a día: nunca dinero,
// hábitos (su definición), recetas, hobbies, obras ni notas.
export const HISTORIAL_BORRABLE = [
  { tabla: 'life_logs', columna: 'logged_at', nombre: 'Agua, comidas y meditación anotadas', esFecha: false },
  { tabla: 'habit_logs', columna: 'date', nombre: 'Hábitos marcados', esFecha: true },
  { tabla: 'exercise_sessions', columna: 'done_on', nombre: 'Rutinas de ejercicio hechas', esFecha: true },
  { tabla: 'hobby_sessions', columna: 'done_at', nombre: 'Ratos de hobby', esFecha: false },
  { tabla: 'mental_logs', columna: 'date', nombre: 'Estrés y meditación', esFecha: true },
  { tabla: 'health_metrics', columna: 'date', nombre: 'Sueño y agua por día', esFecha: true },
] as const;

const limite = (meses: number, esFecha: boolean) => {
  const d = new Date(); d.setMonth(d.getMonth() - meses);
  return esFecha ? fechaLocal(d) : d.toISOString();
};

export function useEspacio(meses: number) {
  const userId = useUserId();
  return useQuery({
    queryKey: ['espacio', userId, meses],
    enabled: !!userId,
    queryFn: async () => {
      const filas = await Promise.all(HISTORIAL_BORRABLE.map(async (t) => {
        const { count } = await supabase.from(t.tabla).select('*', { count: 'exact', head: true })
          .eq('user_id', userId!).lt(t.columna, limite(meses, t.esFecha));
        return { ...t, cuantas: count ?? 0 };
      }));
      return filas;
    },
  });
}

export function useLiberarEspacio() {
  const qc = useQueryClient(), userId = useUserId();
  return useMutation({
    mutationFn: async (meses: number) => {
      if (!userId) throw new Error('Sesión no válida.');
      for (const t of HISTORIAL_BORRABLE) {
        const { error } = await supabase.from(t.tabla).delete().eq('user_id', userId).lt(t.columna, limite(meses, t.esFecha));
        if (error) throw new Error(`${t.nombre}: ${error.message}`);
      }
    },
    onSettled: () => qc.invalidateQueries(),
  });
}
