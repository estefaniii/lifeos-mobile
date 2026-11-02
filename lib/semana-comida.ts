// Lógica pura de «Armar mi semana»: repartir las recetas elegidas por los 7 días,
// juntar sus ingredientes en una sola lista de compras y saber qué comidas de hoy ya marcaste.
// Sin React ni Supabase, para poder probarla sin el teléfono.
import { SLOTS, SLOT_LABEL, type Slot } from '../constants/comida';

export type FilaPlan = { day: number; slot: Slot; meal: string };
type RecetaMin = { titulo: string; porciones: number; ingredientes: string[] };

// ---------- repartir ----------

// Mezcla Fisher-Yates con un azar inyectable (las pruebas pasan uno fijo)
export function mezclar<T>(lista: T[], azar: () => number = Math.random): T[] {
  const out = [...lista];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Reparte las opciones de un momento por los días. Ronda tras ronda: así cada receta sale
// un número parecido de veces y, con dos o más opciones, nunca la misma dos días seguidos.
export function repartirMomento(opciones: string[], dias = 7, azar: () => number = Math.random): string[] {
  const unicas = [...new Set(opciones.filter(Boolean))];
  if (unicas.length === 0) return [];
  const orden = mezclar(unicas, azar);
  return Array.from({ length: dias }, (_, d) => orden[d % orden.length]);
}

// Las filas de meal_plan para los momentos que tienen algo elegido (los demás no se tocan)
export function repartirSemana(elegidas: Partial<Record<Slot, string[]>>, azar: () => number = Math.random): FilaPlan[] {
  return SLOTS.flatMap((slot) =>
    repartirMomento(elegidas[slot] ?? [], 7, azar).map((meal, day) => ({ day, slot, meal })));
}

// Al tocar un hueco en la revisión: pasa a la siguiente opción elegida de ese momento
export function siguienteOpcion(opciones: string[], actual: string): string {
  if (opciones.length === 0) return actual;
  const i = opciones.indexOf(actual);
  return opciones[(i + 1) % opciones.length];
}

export const haySeguidas = (dias: string[]) => dias.some((m, d) => d > 0 && m && m === dias[d - 1]);

// ---------- ingredientes ----------

// «1 1/2», «1/2», «3», «2,5» → número
const RE_CANTIDAD = /^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?)\s+(.+)$/;

function leerNumero(s: string): number {
  const mixto = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixto) return Number(mixto[1]) + Number(mixto[2]) / Number(mixto[3]);
  const frac = s.match(/^(\d+)\/(\d+)$/);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  return Number(s.replace(',', '.'));
}

export function leerIngrediente(linea: string): { cantidad: number | null; resto: string } {
  const t = linea.trim().replace(/\s+/g, ' ');
  const m = t.match(RE_CANTIDAD);
  if (!m) return { cantidad: null, resto: t };
  return { cantidad: leerNumero(m[1]), resto: m[2] };
}

// Clave que no distingue mayúsculas, tildes ni singular/plural: «Dientes de ajo» = «diente de ajo»
export function claveIngrediente(resto: string): string {
  return resto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ/ ]/g, ' ').split(' ').filter(Boolean)
    .map((p) => (p.length > 3 ? p.replace(/(es|s)$/, '').replace(/[aeo]$/, '') : p))
    .join(' ');
}

const FRACCIONES: [number, string][] = [[0.25, '1/4'], [1 / 3, '1/3'], [0.5, '1/2'], [2 / 3, '2/3'], [0.75, '3/4']];

export function formatoCantidad(n: number): string {
  const entero = Math.floor(n + 1e-9);
  const resto = n - entero;
  if (resto < 1e-6) return String(entero);
  const f = FRACCIONES.find(([v]) => Math.abs(v - resto) < 0.01);
  if (f) return entero ? `${entero} ${f[1]}` : f[1];
  return String(Math.round(n * 100) / 100).replace('.', ',');
}

const UNIDADES_FIJAS = new Set(['g', 'kg', 'ml', 'l', 'oz', 'lb']);

const NEXOS = new Set(['de', 'del', 'en', 'o', 'y', 'con', 'sin', 'para', 'a', 'al']);

function pluralPalabra(w: string): string {
  if (/s$/i.test(w)) return w;
  if (/[aeiouáéó]$/i.test(w)) return `${w}s`;
  if (/z$/i.test(w)) return `${w.slice(0, -1)}ces`;
  if (/[nlrdj]$/i.test(w)) return `${w.replace(/[áéíóú](?=[a-zñ]*$)/i, (v) => v.normalize('NFD')[0])}es`;
  return w;
}

// Plural del nombre y sus adjetivos, hasta el primer nexo:
// «taza de avena» → «tazas de avena», «pimentón rojo» → «pimentones rojos», «limón» → «limones»
export function pluralizar(texto: string): string {
  const palabras = texto.split(' ');
  if (!palabras[0] || UNIDADES_FIJAS.has(palabras[0].toLowerCase())) return texto;
  let corte = palabras.findIndex((w, k) => k > 0 && (NEXOS.has(w.toLowerCase()) || w.startsWith('(')));
  if (corte === -1) corte = palabras.length;
  return palabras.map((w, k) => (k < corte ? pluralPalabra(w) : w)).join(' ');
}

// Une varias listas de ingredientes en una línea por ingrediente:
// - con cantidad se suman («2 dientes de ajo» + «3 dientes de ajo» → «5 dientes de ajo»)
// - sin cantidad e iguales se cuentan («Cilantro ×3»: sale en tres recetas)
// - lo que no se puede juntar sale tal cual
export function juntarIngredientes(listas: string[][]): string[] {
  const grupos = new Map<string, { linea: string; cantidad: number | null; resto: string }[]>();
  for (const linea of listas.flat()) {
    if (!linea.trim()) continue;
    const { cantidad, resto } = leerIngrediente(linea);
    const k = claveIngrediente(resto);
    const g = grupos.get(k);
    const item = { linea: linea.trim().replace(/\s+/g, ' '), cantidad, resto };
    if (g) g.push(item); else grupos.set(k, [item]);
  }

  const out: string[] = [];
  for (const g of grupos.values()) {
    if (g.length === 1) { out.push(g[0].linea); continue; }
    const conCantidad = g.filter((x) => x.cantidad !== null);

    if (conCantidad.length === 0) { out.push(`${g[0].linea} ×${g.length}`); continue; }

    const total = conCantidad.reduce((s, x) => s + (x.cantidad ?? 0), 0);
    const plural = conCantidad.find((x) => (x.cantidad ?? 0) > 1);
    // Si ninguna línea traía el plural, se forma: «1 cebolla» ×3 → «3 cebollas»
    const texto = total <= 1 ? conCantidad[0].resto : pluralizar((plural ?? conCantidad[0]).resto);
    out.push(`${formatoCantidad(total)} ${texto}`);
  }
  return out;
}

// Ingredientes de un plan: cada receta se cocina las tandas que hagan falta según sus porciones
// (unas lentejas de 4 porciones puestas 3 días = una sola olla).
export function ingredientesDelPlan(comidas: string[], recetas: RecetaMin[]): string[] {
  const veces = new Map<string, number>();
  for (const m of comidas) if (m) veces.set(m, (veces.get(m) ?? 0) + 1);
  const listas: string[][] = [];
  for (const [titulo, n] of veces) {
    const r = recetas.find((x) => x.titulo === titulo);
    if (!r) continue;
    const tandas = Math.ceil(n / Math.max(1, r.porciones));
    for (let i = 0; i < tandas; i++) listas.push(r.ingredientes);
  }
  return juntarIngredientes(listas);
}

// Quita lo que ya está pendiente en la lista de compras (para no duplicar al volver a armar)
export function sinLoQueYaHay(lineas: string[], enLista: { name: string; done: boolean }[]): string[] {
  const ya = new Set(enLista.filter((x) => !x.done).map((x) => x.name.trim().toLowerCase()));
  return lineas.filter((l) => !ya.has(l.trim().toLowerCase()));
}

// ---------- check de hoy ----------

export const etiquetaComida = (slot: Slot, meal: string) => `${SLOT_LABEL[slot]}: ${meal.trim()}`;

// Qué momentos de hoy ya tienen su registro «comida» con la misma etiqueta
export function marcadasHoy(comidas: Partial<Record<Slot, string>>, logs: { kind: string; label: string | null }[]): Set<Slot> {
  const labels = new Set(logs.filter((l) => l.kind === 'comida' && l.label).map((l) => l.label!.trim()));
  const out = new Set<Slot>();
  for (const slot of SLOTS) {
    const meal = comidas[slot];
    if (meal && labels.has(etiquetaComida(slot, meal))) out.add(slot);
  }
  return out;
}

export const huecosLlenos = (plan: FilaPlan[]) =>
  new Set(plan.filter((r) => r.meal.trim() && r.day >= 0 && r.day < 7).map((r) => `${r.day}-${r.slot}`)).size;
