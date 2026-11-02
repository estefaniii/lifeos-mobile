// Los recordatorios de LifeOS y cuáles tocan ahora. Lógica pura: la usan el
// Perfil (para mostrarlos) y /api/push (para enviarlos), y tiene sus pruebas.
// Las afirmaciones no están aquí: son de Presence.

export type ClaveRecordatorio = 'agua' | 'comidas' | 'pausas' | 'habitos' | 'finanzas' | 'dormir' | 'resumen' | 'copia';
export type AjusteRecordatorio = { on: boolean; horas: string[] };
export type Recordatorios = Record<ClaveRecordatorio, AjusteRecordatorio>;

export const RECORDATORIOS: {
  clave: ClaveRecordatorio; emoji: string; nombre: string; titulo: string; cuerpo: string; url: string;
  horas: string[]; on: boolean;
  /** Solo esos días de la semana (0 = domingo) o del mes. Sin esto, todos los días. */
  diasSemana?: number[]; diasMes?: number[];
}[] = [
  { clave: 'agua', emoji: '💧', nombre: 'Tomar agua', titulo: '💧 Un vaso de agua', cuerpo: 'Tócalo y anótalo en LifeOS.', url: '/', horas: ['10:00', '12:00', '14:00', '16:00', '18:00'], on: true },
  { clave: 'comidas', emoji: '🍽️', nombre: 'Marcar comidas', titulo: '🍽️ ¿Ya comiste?', cuerpo: 'Marca lo que comiste en tu plan de hoy.', url: '/food', horas: ['13:30', '20:00'], on: true },
  { clave: 'pausas', emoji: '🏃‍♀️', nombre: 'Pausas activas', titulo: '🏃‍♀️ Pausa activa', cuerpo: 'Cinco minutos para moverte y estirarte.', url: '/exercise', horas: ['11:00', '15:30'], on: true },
  { clave: 'habitos', emoji: '🎯', nombre: 'Hábitos del día', titulo: '🎯 Tus hábitos', cuerpo: 'Buenos días. Mira qué hábitos tocan hoy.', url: '/', horas: ['09:00'], on: true },
  { clave: 'finanzas', emoji: '💰', nombre: 'Gastos del día', titulo: '💰 Gastos de hoy', cuerpo: '¿Anotaste lo que gastaste hoy?', url: '/finances', horas: ['20:30'], on: false },
  { clave: 'dormir', emoji: '🌙', nombre: 'Hora de dormir', titulo: '🌙 Hora de descansar', cuerpo: 'Deja el celular y a dormir bien.', url: '/', horas: ['22:30'], on: true },
  // El cuerpo del resumen lo arma /api/push con los números de tu semana
  { clave: 'resumen', emoji: '📊', nombre: 'Resumen del domingo', titulo: '📊 Tu semana', cuerpo: 'Mira cómo te fue esta semana.', url: '/history', horas: ['19:00'], on: true, diasSemana: [0] },
  { clave: 'copia', emoji: '📦', nombre: 'Copia del mes', titulo: '📦 Tu copia del mes', cuerpo: 'Descarga una copia de tus datos de LifeOS.', url: '/profile', horas: ['10:00'], on: true, diasMes: [1] },
];

export const recordatorio = (c: ClaveRecordatorio) => RECORDATORIOS.find((r) => r.clave === c)!;

// Lo guardado encima de lo que trae la app: un recordatorio nuevo sale con su valor de fábrica
export function conDefectos(guardado: Partial<Record<string, Partial<AjusteRecordatorio>>> | null | undefined): Recordatorios {
  const out = {} as Recordatorios;
  for (const r of RECORDATORIOS) {
    const g = guardado?.[r.clave];
    out[r.clave] = {
      on: typeof g?.on === 'boolean' ? g.on : r.on,
      horas: Array.isArray(g?.horas) && g!.horas!.length ? g!.horas!.filter(esHora) : r.horas,
    };
  }
  return out;
}

export const esHora = (h: unknown): h is string => typeof h === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(h);
const aMinutos = (h: string) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5));
export const deMinutos = (m: number) => {
  const x = ((m % 1440) + 1440) % 1440;
  return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`;
};

// «10:00» → «10:00 a. m.»
export const horaBonita = (h: string) => {
  const m = aMinutos(h), hh = Math.floor(m / 60);
  return `${hh % 12 || 12}:${String(m % 60).padStart(2, '0')} ${hh < 12 ? 'a. m.' : 'p. m.'}`;
};

// La fecha y la hora en una zona horaria, sin depender de la del servidor
export function ahoraEn(zona: string, ahora: Date = new Date()) {
  let partes: Intl.DateTimeFormatPart[];
  try {
    partes = new Intl.DateTimeFormat('en-CA', { timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(ahora);
  } catch {
    return ahoraEn('America/Panama', ahora);
  }
  const p = (t: string) => partes.find((x) => x.type === t)?.value ?? '00';
  const fecha = `${p('year')}-${p('month')}-${p('day')}`;
  const [y, m, d] = fecha.split('-').map(Number);
  return {
    fecha, minutos: Number(p('hour')) * 60 + Number(p('minute')),
    diaSemana: new Date(Date.UTC(y, m - 1, d)).getUTCDay(), diaMes: d,
  };
}

/**
 * Qué recordatorios tocan ahora. El aviso corre cada 5 minutos pero puede
 * llegar tarde: se acepta lo que cayó en los últimos `margen` minutos, y
 * push_sent (clave usuario + recordatorio + slot) evita mandarlo dos veces.
 */
export function pendientes(ajustes: Recordatorios, ahora: { fecha: string; minutos: number; diaSemana?: number; diaMes?: number }, margen = 15) {
  const out: { clave: ClaveRecordatorio; slot: string }[] = [];
  for (const r of RECORDATORIOS) {
    const a = ajustes[r.clave];
    if (!a?.on) continue;
    if (r.diasSemana && (ahora.diaSemana === undefined || !r.diasSemana.includes(ahora.diaSemana))) continue;
    if (r.diasMes && (ahora.diaMes === undefined || !r.diasMes.includes(ahora.diaMes))) continue;
    for (const h of a.horas) {
      const m = aMinutos(h);
      if (m <= ahora.minutos && ahora.minutos - m < margen) out.push({ clave: r.clave, slot: `${ahora.fecha} ${h}` });
    }
  }
  return out;
}
