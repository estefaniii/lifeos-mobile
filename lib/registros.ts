// Lógica pura del historial: fechas locales y agrupar lo que hiciste por día.
// Sin Supabase ni React, para poder probarla sola (tests/registros.test.ts).

// «2026-11-01» en la hora del teléfono. toISOString() da la fecha UTC y en
// Panamá (UTC-5) lo de después de las 7 de la noche caía en el día siguiente.
export const fechaLocal = (d: Date = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

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
