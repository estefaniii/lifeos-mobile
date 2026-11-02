// Función de Vercel que envía las notificaciones push.
//
// Dos maneras de llamarla:
//  - El aviso de cada 5 minutos (pg_cron en Supabase, scripts/programar-push.cjs):
//    `Authorization: Bearer <CRON_SECRET>`. Envía los recordatorios que tocan a todos.
//  - El botón «Probar» del Perfil: `Authorization: Bearer <token de Supabase>` y
//    `{ "prueba": true }`. Envía una notificación de prueba solo a esa persona.
//
// Variables en Vercel: DATABASE_URL, VAPID_PRIVATE_KEY, CRON_SECRET,
// EXPO_PUBLIC_VAPID_PUBLIC_KEY, EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY.
import webpush from 'web-push';
import postgres from 'postgres';
import { ahoraEn, conDefectos, pendientes, recordatorio } from '../lib/recordatorios';

type Req = { method?: string; headers: Record<string, string | string[] | undefined>; body?: any };
type Res = { status: (n: number) => Res; json: (b: unknown) => void };
type Sub = { id: string; user_id: string; endpoint: string; p256dh: string; auth: string };

const env = (k: string) => process.env[k] ?? '';

async function usuarioDelToken(token: string): Promise<string | null> {
  const r = await fetch(`${env('EXPO_PUBLIC_SUPABASE_URL')}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: env('EXPO_PUBLIC_SUPABASE_ANON_KEY') },
  });
  if (!r.ok) return null;
  return ((await r.json()) as { id?: string }).id ?? null;
}

// «Esta semana: 38 vasos de agua, 4 rutinas (2 h 10 min), 12 comidas y 3 h de hobbies.»
async function resumenSemana(sql: postgres.Sql, userId: string) {
  const [x] = await sql<{ vasos: number; rutinas: number; min_ej: number; comidas: number; min_hob: number }[]>`
    select
      coalesce((select sum(amount) from life_logs where user_id = ${userId} and kind = 'agua' and logged_at > now() - interval '7 days'), 0)::int as vasos,
      (select count(*) from exercise_sessions where user_id = ${userId} and done_on > current_date - 7)::int as rutinas,
      coalesce((select sum(minutes) from exercise_sessions where user_id = ${userId} and done_on > current_date - 7), 0)::int as min_ej,
      (select count(*) from life_logs where user_id = ${userId} and kind = 'comida' and logged_at > now() - interval '7 days')::int as comidas,
      coalesce((select sum(minutes) from hobby_sessions where user_id = ${userId} and done_at > now() - interval '7 days'), 0)::int as min_hob`;
  const h = (m: number) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}`);
  const partes = [
    x.vasos && `${x.vasos} vasos de agua`,
    x.rutinas && `${x.rutinas} ${x.rutinas === 1 ? 'rutina' : 'rutinas'} (${h(x.min_ej)})`,
    x.comidas && `${x.comidas} comidas marcadas`,
    x.min_hob && `${h(x.min_hob)} de hobbies`,
  ].filter(Boolean);
  return partes.length ? `Esta semana: ${partes.join(', ')}.` : 'Una semana tranquila. Mañana empieza otra: un vaso de agua y a moverse.';
}

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Solo POST' });
  const token = String(req.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Falta la autorización' });
  if (!env('VAPID_PRIVATE_KEY') || !env('DATABASE_URL')) return res.status(500).json({ error: 'Faltan variables en el servidor' });

  webpush.setVapidDetails('mailto:estefani@dmgurus.com', env('EXPO_PUBLIC_VAPID_PUBLIC_KEY'), env('VAPID_PRIVATE_KEY'));
  const sql = postgres(env('DATABASE_URL'), { ssl: 'require', prepare: false, max: 1 });

  // Envía a cada celular; los que ya no existen (404/410) se borran
  const enviar = async (subs: Sub[], datos: object) => {
    let ok = 0;
    for (const s of subs) {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(datos), { TTL: 3600 });
        ok++;
      } catch (e: any) {
        if (e?.statusCode === 404 || e?.statusCode === 410) await sql`delete from push_subscriptions where id = ${s.id}`;
      }
    }
    return ok;
  };

  try {
    // Prueba desde el Perfil
    if (token !== env('CRON_SECRET')) {
      const userId = await usuarioDelToken(token);
      if (!userId) return res.status(401).json({ error: 'Sesión no válida' });
      const subs = await sql<Sub[]>`select * from push_subscriptions where user_id = ${userId}`;
      if (!subs.length) return res.status(404).json({ error: 'Este usuario no tiene celulares suscritos' });
      const ok = await enviar(subs, { title: '✨ Así se verán tus avisos', body: 'Las notificaciones de LifeOS ya llegan a este celular.', url: '/profile', tag: 'prueba' });
      return res.status(200).json({ enviadas: ok });
    }

    // Aviso de cada 5 minutos
    const filas = await sql<{ user_id: string; reminders: any; timezone: string }[]>`
      select s.user_id, coalesce(u.reminders, '{}'::jsonb) as reminders, coalesce(u.timezone, 'America/Panama') as timezone
      from (select distinct user_id from push_subscriptions) s
      left join user_settings u on u.user_id = s.user_id`;
    let total = 0;
    for (const f of filas) {
      const tocan = pendientes(conDefectos(f.reminders), ahoraEn(f.timezone));
      if (!tocan.length) continue;
      const subs = await sql<Sub[]>`select * from push_subscriptions where user_id = ${f.user_id}`;
      for (const t of tocan) {
        // Si ya estaba la fila, otro aviso lo mandó: no se repite
        const nueva = await sql`insert into push_sent (user_id, tag, slot) values (${f.user_id}, ${t.clave}, ${t.slot})
          on conflict do nothing returning 1`;
        if (!nueva.length) continue;
        const r = recordatorio(t.clave);
        const cuerpo = t.clave === 'resumen' ? await resumenSemana(sql, f.user_id).catch(() => r.cuerpo) : r.cuerpo;
        total += await enviar(subs, { title: r.titulo, body: cuerpo, url: r.url, tag: r.clave });
      }
    }
    // Lo enviado hace más de una semana ya no hace falta para no repetir
    await sql`delete from push_sent where sent_at < now() - interval '7 days'`;
    return res.status(200).json({ enviadas: total });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? 'Error' });
  } finally {
    await sql.end({ timeout: 2 });
  }
}
