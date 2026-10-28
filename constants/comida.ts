// Plan de comidas sugerido (el que antes estaba fijo en Salud). Se copia a tu plan editable con un toque.
export const SLOTS = ['desayuno', 'almuerzo', 'merienda', 'cena'] as const;
export type Slot = (typeof SLOTS)[number];
export const SLOT_LABEL: Record<Slot, string> = { desayuno: 'Desayuno', almuerzo: 'Almuerzo', merienda: 'Merienda', cena: 'Cena' };
export const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export const PLAN_SUGERIDO: string[][] = [
  ['Avena + proteína + fruta', 'Ensalada + pollo + arroz', 'Frutos secos', 'Salmón + verduras al vapor'],  // Lunes
  ['Huevos + aguacate + tostada', 'Wrap de atún + vegetales', 'Plátano + mantequilla de maní', 'Pollo + quinoa + brócoli'],  // Martes
  ['Smoothie proteico + nueces', 'Lentejas + arroz + zanahoria', 'Jugo verde + almendras', 'Carne magra + patata + espinaca'],  // Miércoles
  ['Yogur griego + granola + miel', 'Arroz integral + pavo + pepino', 'Frutas variadas', 'Tilapia + vegetales asados'],  // Jueves
  ['Tortilla de claras + aguacate', 'Ensalada mediterránea + pollo', 'Mix de nueces', 'Pollo al horno + ensalada verde'],  // Viernes
  ['Pancakes proteicos + miel', 'Bowl de quinoa + vegetales', 'Fresas + yogur', 'Chuleta + arroz + espárragos'],  // Sábado
  ['Batido verde + tostada proteica', 'Sopa de pollo con verduras', 'Manzana + queso cottage', 'Atún + pasta integral + pesto'],  // Domingo
];
