// Lógica pura del historial: fechas locales y agrupar lo que hiciste por día.
// Sin Supabase ni React, para poder probarla sola (tests/registros.test.ts).

// La hora a la que empieza tu día (Perfil, user_settings.day_start_hour). Con 4,
// algo hecho a la 1 a. m. cuenta para el día anterior. Todos los «hoy» de la app
// pasan por fechaLocal(), así que el agua, los hábitos, el historial y las rachas
// usan la misma frontera. Se guarda también en el dispositivo para el primer render.
let horaInicio = 0;
const CLAVE_HORA = 'lifeos_hora_inicio_dia';
try {
  const g = typeof localStorage !== 'undefined' ? Number(localStorage.getItem(CLAVE_HORA)) : 0;
  if (g >= 0 && g <= 6) horaInicio = g;
} catch { /* sin almacenamiento: medianoche */ }

export function setHoraInicioDia(h: number) {
  horaInicio = Math.min(6, Math.max(0, Math.round(h || 0)));
  try { if (typeof localStorage !== 'undefined') localStorage.setItem(CLAVE_HORA, String(horaInicio)) } catch { /* nada */ }
}
export const horaInicioDia = () => horaInicio;

// «2026-11-01» en la hora del teléfono. toISOString() da la fecha UTC y en
// Panamá (UTC-5) lo de después de las 7 de la noche caía en el día siguiente.
export const fechaLocal = (d: Date = new Date()) => {
  const x = horaInicio ? new Date(d.getTime() - horaInicio * 3600_000) : d;
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};

// Una columna DATE («2026-11-01») se lee como ese día local, no como medianoche UTC
export const deFecha = (s: string) => {
  const [y, m, d] = s.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d, 12);
};

export const horaCorta = (iso: string) => {
  const d = new Date(iso);
  const h = d.getHours(), m = String(d.getMinutes()).padStart(2, '0');
  return `${h % 12 || 12}:${m} ${h < 12 ? 'a. m.' : 'p. m.'}`;
};

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function tituloDia(clave: string, hoy: Date = new Date()) {
  if (clave === fechaLocal(hoy)) return 'Hoy';
  const ayer = new Date(hoy); ayer.setDate(ayer.getDate() - 1);
  if (clave === fechaLocal(ayer)) return 'Ayer';
  const d = deFecha(clave);
  return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`;
}

export type TipoRegistro = 'agua' | 'comida' | 'meditacion' | 'animo' | 'ejercicio' | 'habito' | 'hobby';

export type Registro = {
  id: string;
  tipo: TipoRegistro;
  at: string;            // ISO con hora
  titulo: string;
  detalle?: string;
  cantidad?: number;     // vasos, minutos
  // Solo los registros rápidos (life_logs) se borran desde el historial;
  // el resto se cambia en su pantalla.
  borrable?: boolean;
};

export type Dia = {
  clave: string;
  titulo: string;
  registros: Registro[];
  resumen: { vasos: number; minutosEjercicio: number; comidas: number; habitos: number; minutosHobby: number };
};

export function agruparPorDia(registros: Registro[], hoy: Date = new Date()): Dia[] {
  const porDia = new Map<string, Registro[]>();
  for (const r of registros) {
    const clave = fechaLocal(new Date(r.at));
    if (!porDia.has(clave)) porDia.set(clave, []);
    porDia.get(clave)!.push(r);
  }
  return [...porDia.entries()]
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([clave, lista]) => {
      lista.sort((a, b) => (a.at < b.at ? 1 : -1));
      const suma = (t: TipoRegistro) => lista.filter((r) => r.tipo === t).reduce((s, r) => s + (r.cantidad ?? 0), 0);
      return {
        clave,
        titulo: tituloDia(clave, hoy),
        registros: lista,
        resumen: {
          vasos: suma('agua'),
          minutosEjercicio: suma('ejercicio'),
          comidas: lista.filter((r) => r.tipo === 'comida').length,
          habitos: lista.filter((r) => r.tipo === 'habito').length,
          minutosHobby: suma('hobby'),
        },
      };
    });
}

// Minutos de cada hobby en la semana en curso (lunes a domingo)
export function inicioSemana(hoy: Date = new Date()) {
  const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

export function minutosSemana(sesiones: { hobby_id: string; minutes: number; done_at: string }[], hoy: Date = new Date()) {
  const desde = inicioSemana(hoy).getTime();
  const out: Record<string, number> = {};
  for (const s of sesiones) {
    if (new Date(s.done_at).getTime() < desde) continue;
    out[s.hobby_id] = (out[s.hobby_id] ?? 0) + s.minutes;
  }
  return out;
}

export const duracion = (min: number) =>
  min < 60 ? `${min} min` : `${Math.floor(min / 60)} h${min % 60 ? ` ${min % 60} min` : ''}`;

/**
 * Días seguidos cumpliendo algo, contando hacia atrás desde hoy. Si hoy todavía
 * no se cumplió, la racha sigue viva desde ayer (no se rompe a las 8 de la mañana).
 */
export function racha(cumplidos: Iterable<string>, hoy: Date = new Date()) {
  const dias = new Set(cumplidos);
  const d = new Date(hoy);
  if (!dias.has(fechaLocal(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (dias.has(fechaLocal(d))) { n++; d.setDate(d.getDate() - 1) }
  return n;
}

// El sticker que toca por racha: 7, 14, 21, 30 días…
export const hitoRacha = (n: number) => [100, 60, 30, 21, 14, 7].find((h) => n >= h) ?? null;
