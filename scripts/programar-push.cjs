// Programa en Supabase (pg_cron + pg_net) el aviso de cada 5 minutos a /api/push.
// Lleva CRON_SECRET, por eso no va en el SQL que se sube: se lee de .env.
//   NODE_PATH="$(pwd)/node_modules" node scripts/programar-push.cjs
// Volver a correrlo reemplaza el trabajo (mismo nombre).
require('dotenv').config({ path: process.cwd() + '/.env' });
const postgres = require('postgres');

const URL = process.env.PUSH_URL || 'https://lifeos-mobilee.vercel.app/api/push';
const secreto = process.env.CRON_SECRET;
if (!secreto) throw new Error('Falta CRON_SECRET en .env');

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', prepare: false, onnotice: () => {} });
(async () => {
  const comando = `select net.http_post(url := '${URL}', headers := jsonb_build_object('Authorization', 'Bearer ${secreto}', 'Content-Type', 'application/json'), body := '{}'::jsonb, timeout_milliseconds := 20000)`;
  await sql`select cron.schedule('lifeos-push', '*/5 * * * *', ${comando})`;
  const [j] = await sql`select jobname, schedule, active from cron.job where jobname = 'lifeos-push'`;
  console.log('programado:', j);
  await sql.end();
})().catch(async (e) => { console.error('ERROR', e.message); await sql.end(); process.exit(1) });
