// Retos de 21 días. Cada día apunta a una rutina de constants/ejercicios.ts por
// su id, así que la rutina se edita en un solo sitio y el reto la sigue.
//
// Al elegir un reto se guarda como un programa más (exercise_programs, con
// author 'LifeOS'): la cuenta de días, las casillas y el «Día 5 de 21» salen
// de la misma tabla que los programas que ella añade a mano.
//
// La progresión es la misma en todos: la primera semana suave para aprender
// la técnica, la segunda mezcla y la tercera llega a la rutina completa.
// Dos días de descanso activo por semana: el músculo crece descansando.

export type DiaReto = { dia: number; titulo: string; rutina?: string; descanso?: boolean; notas?: string };
export type Reto = {
  id: string;
  nombre: string;
  /** Para qué sirve, en una frase. */
  para: string;
  /** La zona de la que toma la foto y el color. */
  zona: string;
  dias: DiaReto[];
};

/** Día de descanso activo dentro de una semana. */
const D = 'descanso';

const NOTA_SEMANA = [
  'Semana 1: aprende la técnica. Mejor lento que rápido.',
  'Semana 2: ya tienes la base, sube un poco el ritmo.',
  'Semana 3: la recta final. Hoy toca dar un poco más.',
];

/** Convierte tres semanas de ids en los 21 días del reto. */
function armar(semanas: string[][], descansoRutina: string, notaDescanso: string, nombres: Record<string, string>): DiaReto[] {
  return semanas.flatMap((semana, s) =>
    semana.map((id, d) => {
      const dia = s * 7 + d + 1;
      if (id === D) return { dia, titulo: 'Descanso activo', rutina: descansoRutina, descanso: true, notas: notaDescanso };
      return { dia, titulo: nombres[id] ?? id, rutina: id, notas: NOTA_SEMANA[s] };
    }),
  );
}

// Los títulos se escriben aquí y no se leen de ZONAS a propósito: este
// archivo se importa en pruebas sin cargar las fotos (require de .jpg).
const NOMBRES: Record<string, string> = {
  'piernas-suave': 'Piernas en casa', 'piernas-express': 'Piernas en 10', 'piernas-completa': 'Piernas fuertes',
  'gluteos-suave': 'Glúteos activos', 'gluteos-express': 'Glúteos en 10', 'gluteos-banda': 'Glúteos con banda', 'gluteos-completa': 'Glúteos de verdad',
  'abdomen-suave': 'Core en 15', 'abdomen-express': 'Abdomen en 10', 'abdomen-completa': 'Abdomen fuerte',
  'brazos-suave': 'Brazos tonificados', 'brazos-express': 'Brazos sin pesas', 'brazos-completa': 'Brazos y hombros',
  'espalda-suave': 'Espalda sana', 'espalda-express': 'Espalda derecha', 'espalda-completa': 'Espalda fuerte',
  'pecho-suave': 'Pecho en casa', 'pecho-express': 'Pecho en 10', 'pecho-completa': 'Pecho y empuje',
  'cardio-suave': 'Cardio suave', 'cardio-express': 'Cardio en 10', 'cardio-completa': 'HIIT 20',
  'movilidad-manana': 'Despertar el cuerpo', 'movilidad-noche': 'Soltar antes de dormir', 'movilidad-espalda': 'Espalda suelta',
  'movilidad-estres': 'Soltar el estrés', 'movilidad-express': 'Pausa de escritorio',
};

const DESCANSO_NOTA = 'Descanso activo: camina 20 minutos o haz esta movilidad suave. También cuenta.';

export const RETOS: Reto[] = [
  {
    id: 'reto-gluteos', nombre: '21 días de glúteos', zona: 'gluteos',
    para: 'Glúteos más fuertes y firmes, y una cadera que sostiene mejor la espalda.',
    dias: armar([
      ['gluteos-suave', 'gluteos-express', D, 'gluteos-suave', 'gluteos-express', 'gluteos-suave', D],
      ['gluteos-express', 'gluteos-suave', D, 'gluteos-banda', 'gluteos-express', 'gluteos-banda', D],
      ['gluteos-banda', 'gluteos-completa', D, 'gluteos-banda', 'gluteos-completa', 'gluteos-express', 'gluteos-completa'],
    ], 'movilidad-noche', DESCANSO_NOTA, NOMBRES),
  },
  {
    id: 'reto-abdomen', nombre: '21 días de abdomen', zona: 'abdomen',
    para: 'Un core firme que protege la espalda baja y mejora la postura.',
    dias: armar([
      ['abdomen-suave', 'abdomen-express', D, 'abdomen-suave', 'abdomen-express', 'abdomen-suave', D],
      ['abdomen-express', 'abdomen-suave', D, 'abdomen-completa', 'abdomen-express', 'abdomen-suave', D],
      ['abdomen-completa', 'abdomen-express', D, 'abdomen-completa', 'abdomen-suave', 'abdomen-express', 'abdomen-completa'],
    ], 'movilidad-espalda', DESCANSO_NOTA, NOMBRES),
  },
  {
    id: 'reto-espalda', nombre: '21 días de movilidad para la espalda', zona: 'movilidad',
    para: 'Para la espalda cargada de tantas horas sentada: primero soltar, luego fortalecer.',
    dias: armar([
      ['movilidad-espalda', 'movilidad-manana', 'movilidad-express', 'movilidad-espalda', D, 'movilidad-manana', 'movilidad-espalda'],
      ['espalda-express', 'movilidad-espalda', 'espalda-suave', D, 'movilidad-espalda', 'espalda-express', 'movilidad-manana'],
      ['espalda-suave', 'movilidad-espalda', 'espalda-express', D, 'espalda-suave', 'movilidad-espalda', 'espalda-completa'],
    ], 'movilidad-noche', DESCANSO_NOTA, NOMBRES),
  },
  {
    id: 'reto-cuerpo', nombre: '21 días cuerpo completo en casa', zona: 'piernas',
    para: 'Todo el cuerpo, una zona distinta cada día, sin gimnasio.',
    dias: armar([
      ['piernas-suave', 'brazos-suave', 'abdomen-suave', D, 'gluteos-suave', 'espalda-suave', D],
      ['piernas-express', 'pecho-express', 'cardio-express', D, 'gluteos-express', 'brazos-express', D],
      ['piernas-completa', 'brazos-completa', 'abdomen-completa', D, 'gluteos-completa', 'espalda-completa', 'cardio-completa'],
    ], 'movilidad-manana', DESCANSO_NOTA, NOMBRES),
  },
  {
    id: 'reto-cardio', nombre: '21 días de cardio suave', zona: 'cardio',
    para: 'Más aire y más energía sin saltos bruscos: de marchar en el sitio al HIIT.',
    dias: armar([
      ['cardio-suave', 'movilidad-manana', 'cardio-suave', D, 'cardio-suave', 'cardio-express', D],
      ['cardio-express', 'cardio-suave', 'cardio-express', D, 'cardio-suave', 'cardio-express', D],
      ['cardio-express', 'cardio-completa', 'cardio-suave', D, 'cardio-completa', 'cardio-express', 'cardio-completa'],
    ], 'movilidad-noche', 'Descanso activo: una caminata a paso cómodo, o esta movilidad suave.', NOMBRES),
  },
  {
    id: 'reto-estres', nombre: '21 días para soltar el estrés', zona: 'movilidad',
    para: 'Estiramientos lentos y respiración para bajar la tensión del cuerpo al final del día.',
    dias: armar([
      ['movilidad-express', 'movilidad-noche', 'movilidad-express', 'movilidad-manana', D, 'movilidad-noche', 'movilidad-espalda'],
      ['movilidad-noche', 'movilidad-estres', 'movilidad-manana', D, 'movilidad-espalda', 'movilidad-estres', 'movilidad-noche'],
      ['movilidad-estres', 'movilidad-espalda', 'movilidad-estres', D, 'movilidad-noche', 'movilidad-estres', 'movilidad-estres'],
    ], 'movilidad-express', 'Hoy sin rutina larga: sal a caminar 15 minutos sin el teléfono, o haz esta pausa corta.', NOMBRES),
  },
];
