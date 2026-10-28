// Planes de ejercicio por zona del cuerpo. Rutinas en casa, con peso corporal o mancuernas.
// reps: número de repeticiones; segundos: ejercicio por tiempo. descanso en segundos entre series.

export type Ejercicio = { nombre: string; series: number; reps?: number; segundos?: number; descanso: number; consejo: string };
export type Rutina = { id: string; nombre: string; nivel: 'Suave' | 'Completa'; minutos: number; ejercicios: Ejercicio[] };
export type Zona = { id: string; nombre: string; icono: string; color: string; rutinas: Rutina[] };

export const ZONAS: Zona[] = [
  {
    id: 'piernas', nombre: 'Piernas', icono: 'figure.run', color: '#14B8A6',
    rutinas: [
      { id: 'piernas-suave', nombre: 'Piernas en casa', nivel: 'Suave', minutos: 15, ejercicios: [
        { nombre: 'Sentadilla', series: 3, reps: 12, descanso: 45, consejo: 'Rodillas en línea con los pies, peso en los talones.' },
        { nombre: 'Zancada alterna', series: 3, reps: 10, descanso: 45, consejo: '10 por pierna. La rodilla de atrás baja casi al piso.' },
        { nombre: 'Elevación de talones', series: 3, reps: 15, descanso: 30, consejo: 'Sube lento y baja más lento.' },
        { nombre: 'Sentadilla isométrica en pared', series: 2, segundos: 30, descanso: 45, consejo: 'Espalda pegada a la pared, muslos paralelos al piso.' },
      ] },
      { id: 'piernas-completa', nombre: 'Piernas fuertes', nivel: 'Completa', minutos: 30, ejercicios: [
        { nombre: 'Sentadilla con mancuerna', series: 4, reps: 12, descanso: 60, consejo: 'Mancuerna pegada al pecho.' },
        { nombre: 'Peso muerto rumano', series: 4, reps: 10, descanso: 60, consejo: 'Espalda recta, cadera hacia atrás.' },
        { nombre: 'Zancada búlgara', series: 3, reps: 10, descanso: 60, consejo: 'Pie de atrás en una silla. 10 por pierna.' },
        { nombre: 'Sentadilla con salto', series: 3, reps: 10, descanso: 60, consejo: 'Aterriza suave, con las rodillas flexionadas.' },
        { nombre: 'Elevación de talones a una pierna', series: 3, reps: 12, descanso: 30, consejo: 'Apóyate en la pared para el equilibrio.' },
      ] },
    ],
  },
  {
    id: 'gluteos', nombre: 'Glúteos', icono: 'figure.run', color: '#F472B6',
    rutinas: [
      { id: 'gluteos-suave', nombre: 'Glúteos activos', nivel: 'Suave', minutos: 15, ejercicios: [
        { nombre: 'Puente de glúteo', series: 3, reps: 15, descanso: 30, consejo: 'Aprieta arriba un segundo.' },
        { nombre: 'Patada de glúteo en cuadrupedia', series: 3, reps: 12, descanso: 30, consejo: '12 por lado, sin arquear la espalda baja.' },
        { nombre: 'Abducción acostada de lado', series: 3, reps: 15, descanso: 30, consejo: '15 por lado, pie un poco hacia adentro.' },
        { nombre: 'Almeja', series: 3, reps: 15, descanso: 30, consejo: 'Rodillas dobladas, abre como una concha.' },
      ] },
      { id: 'gluteos-completa', nombre: 'Glúteos de verdad', nivel: 'Completa', minutos: 30, ejercicios: [
        { nombre: 'Hip thrust con mancuerna', series: 4, reps: 12, descanso: 60, consejo: 'Espalda alta en el sofá, mentón al pecho.' },
        { nombre: 'Puente a una pierna', series: 3, reps: 10, descanso: 45, consejo: '10 por pierna.' },
        { nombre: 'Sentadilla sumo', series: 4, reps: 12, descanso: 60, consejo: 'Pies abiertos, puntas hacia afuera.' },
        { nombre: 'Peso muerto a una pierna', series: 3, reps: 10, descanso: 45, consejo: '10 por pierna, lento y con control.' },
        { nombre: 'Caminata lateral con banda', series: 3, reps: 15, descanso: 30, consejo: '15 pasos por lado, sin juntar los pies.' },
      ] },
    ],
  },
  {
    id: 'abdomen', nombre: 'Abdomen', icono: 'figure.run', color: '#FBBF24',
    rutinas: [
      { id: 'abdomen-suave', nombre: 'Core en 15', nivel: 'Suave', minutos: 15, ejercicios: [
        { nombre: 'Plancha', series: 3, segundos: 30, descanso: 30, consejo: 'Cuerpo en línea recta, ombligo hacia adentro.' },
        { nombre: 'Bicho muerto', series: 3, reps: 10, descanso: 30, consejo: 'Espalda baja pegada al piso. 10 por lado.' },
        { nombre: 'Crunch', series: 3, reps: 15, descanso: 30, consejo: 'Sube con el abdomen, no con el cuello.' },
        { nombre: 'Plancha lateral', series: 2, segundos: 20, descanso: 30, consejo: '20 s por lado.' },
      ] },
      { id: 'abdomen-completa', nombre: 'Abdomen fuerte', nivel: 'Completa', minutos: 25, ejercicios: [
        { nombre: 'Plancha con toque de hombro', series: 3, reps: 16, descanso: 45, consejo: 'Que la cadera no se mueva.' },
        { nombre: 'Elevación de piernas', series: 3, reps: 12, descanso: 45, consejo: 'Baja lento sin despegar la espalda baja.' },
        { nombre: 'Escaladores', series: 3, segundos: 30, descanso: 45, consejo: 'Rodillas al pecho, ritmo constante.' },
        { nombre: 'Giro ruso', series: 3, reps: 20, descanso: 45, consejo: '20 toques en total, pecho abierto.' },
        { nombre: 'Hollow hold', series: 3, segundos: 20, descanso: 45, consejo: 'Brazos y piernas estirados, espalda baja pegada.' },
      ] },
    ],
  },
  {
    id: 'brazos', nombre: 'Brazos', icono: 'figure.run', color: '#60A5FA',
    rutinas: [
      { id: 'brazos-suave', nombre: 'Brazos tonificados', nivel: 'Suave', minutos: 15, ejercicios: [
        { nombre: 'Flexiones con rodillas apoyadas', series: 3, reps: 10, descanso: 45, consejo: 'Codos a 45° del cuerpo.' },
        { nombre: 'Fondos en silla', series: 3, reps: 10, descanso: 45, consejo: 'Baja hasta que los codos formen 90°.' },
        { nombre: 'Curl de bíceps con mancuerna', series: 3, reps: 12, descanso: 45, consejo: 'Codos quietos junto al cuerpo.' },
        { nombre: 'Círculos de brazos', series: 2, segundos: 30, descanso: 30, consejo: 'Hacia adelante y hacia atrás.' },
      ] },
      { id: 'brazos-completa', nombre: 'Brazos y hombros', nivel: 'Completa', minutos: 25, ejercicios: [
        { nombre: 'Press de hombros con mancuernas', series: 4, reps: 10, descanso: 60, consejo: 'No arquees la espalda al subir.' },
        { nombre: 'Curl martillo', series: 3, reps: 12, descanso: 45, consejo: 'Palmas mirándose entre sí.' },
        { nombre: 'Extensión de tríceps sobre la cabeza', series: 3, reps: 12, descanso: 45, consejo: 'Codos apuntando al techo.' },
        { nombre: 'Elevaciones laterales', series: 3, reps: 12, descanso: 45, consejo: 'Hasta la altura del hombro, sin impulso.' },
        { nombre: 'Flexiones', series: 3, reps: 8, descanso: 60, consejo: 'Si cuesta, apoya las rodillas.' },
      ] },
    ],
  },
  {
    id: 'espalda', nombre: 'Espalda', icono: 'figure.run', color: '#A78BFA',
    rutinas: [
      { id: 'espalda-suave', nombre: 'Espalda sana', nivel: 'Suave', minutos: 15, ejercicios: [
        { nombre: 'Superman', series: 3, reps: 12, descanso: 30, consejo: 'Sube brazos y piernas, mirada al piso.' },
        { nombre: 'Ángeles en el piso', series: 3, reps: 10, descanso: 30, consejo: 'Boca abajo, brazos como en ángel de nieve.' },
        { nombre: 'Remo con mancuerna', series: 3, reps: 12, descanso: 45, consejo: '12 por brazo, codo hacia la cadera.' },
        { nombre: 'Gato-camello', series: 2, reps: 10, descanso: 30, consejo: 'Lento, siguiendo la respiración.' },
      ] },
      { id: 'espalda-completa', nombre: 'Espalda fuerte', nivel: 'Completa', minutos: 25, ejercicios: [
        { nombre: 'Remo inclinado con mancuernas', series: 4, reps: 12, descanso: 60, consejo: 'Espalda recta, junta los omóplatos.' },
        { nombre: 'Pájaro con mancuernas', series: 3, reps: 12, descanso: 45, consejo: 'Brazos abiertos, peso ligero.' },
        { nombre: 'Peso muerto con mancuernas', series: 3, reps: 10, descanso: 60, consejo: 'Cadera atrás, mancuernas pegadas a las piernas.' },
        { nombre: 'Superman con pausa', series: 3, reps: 10, descanso: 45, consejo: 'Sostén 2 segundos arriba.' },
      ] },
    ],
  },
  {
    id: 'pecho', nombre: 'Pecho', icono: 'figure.run', color: '#F87171',
    rutinas: [
      { id: 'pecho-suave', nombre: 'Pecho en casa', nivel: 'Suave', minutos: 15, ejercicios: [
        { nombre: 'Flexiones en pared', series: 3, reps: 15, descanso: 30, consejo: 'Cuerpo recto, baja el pecho a la pared.' },
        { nombre: 'Flexiones con rodillas apoyadas', series: 3, reps: 10, descanso: 45, consejo: 'Baja controlado.' },
        { nombre: 'Aperturas en el piso con mancuernas', series: 3, reps: 12, descanso: 45, consejo: 'Codos un poco doblados.' },
      ] },
      { id: 'pecho-completa', nombre: 'Pecho y empuje', nivel: 'Completa', minutos: 25, ejercicios: [
        { nombre: 'Flexiones', series: 4, reps: 10, descanso: 60, consejo: 'Codos a 45°, cuerpo como una tabla.' },
        { nombre: 'Press de pecho en el piso con mancuernas', series: 4, reps: 12, descanso: 60, consejo: 'Baja hasta que los codos toquen el piso.' },
        { nombre: 'Flexiones declinadas', series: 3, reps: 8, descanso: 60, consejo: 'Pies en una silla.' },
        { nombre: 'Aperturas con mancuernas', series: 3, reps: 12, descanso: 45, consejo: 'Siente el estiramiento del pecho.' },
      ] },
    ],
  },
  {
    id: 'cardio', nombre: 'Cardio', icono: 'figure.run', color: '#FB923C',
    rutinas: [
      { id: 'cardio-suave', nombre: 'Cardio suave', nivel: 'Suave', minutos: 15, ejercicios: [
        { nombre: 'Marcha en el lugar', series: 1, segundos: 120, descanso: 15, consejo: 'Sube las rodillas y mueve los brazos.' },
        { nombre: 'Jumping jacks sin salto', series: 3, segundos: 40, descanso: 20, consejo: 'Paso lateral en lugar de saltar.' },
        { nombre: 'Rodillas arriba', series: 3, segundos: 30, descanso: 30, consejo: 'A tu ritmo.' },
        { nombre: 'Boxeo al aire', series: 3, segundos: 40, descanso: 20, consejo: 'Golpes rápidos, abdomen firme.' },
      ] },
      { id: 'cardio-completa', nombre: 'HIIT 20', nivel: 'Completa', minutos: 20, ejercicios: [
        { nombre: 'Jumping jacks', series: 4, segundos: 40, descanso: 20, consejo: 'Aterriza suave.' },
        { nombre: 'Burpees', series: 4, segundos: 30, descanso: 30, consejo: 'Sin salto si necesitas bajar la intensidad.' },
        { nombre: 'Escaladores', series: 4, segundos: 30, descanso: 30, consejo: 'Cadera abajo.' },
        { nombre: 'Sentadilla con salto', series: 4, segundos: 30, descanso: 30, consejo: 'Rodillas suaves al caer.' },
      ] },
    ],
  },
  {
    id: 'movilidad', nombre: 'Movilidad', icono: 'figure.run', color: '#34D399',
    rutinas: [
      { id: 'movilidad-manana', nombre: 'Despertar el cuerpo', nivel: 'Suave', minutos: 10, ejercicios: [
        { nombre: 'Gato-camello', series: 1, segundos: 60, descanso: 10, consejo: 'Sigue tu respiración.' },
        { nombre: 'Círculos de cadera', series: 1, segundos: 40, descanso: 10, consejo: 'Hacia un lado y hacia el otro.' },
        { nombre: 'Estiramiento de isquiotibiales', series: 2, segundos: 30, descanso: 10, consejo: 'Sin rebotar.' },
        { nombre: 'Postura del niño', series: 1, segundos: 60, descanso: 10, consejo: 'Respira hacia la espalda.' },
        { nombre: 'Apertura de pecho en la puerta', series: 2, segundos: 30, descanso: 10, consejo: 'Antebrazo en el marco, gira suave.' },
      ] },
      { id: 'movilidad-noche', nombre: 'Soltar antes de dormir', nivel: 'Suave', minutos: 12, ejercicios: [
        { nombre: 'Rotación de columna acostada', series: 2, segundos: 40, descanso: 10, consejo: 'Rodillas a un lado, mirada al otro.' },
        { nombre: 'Mariposa', series: 1, segundos: 60, descanso: 10, consejo: 'Plantas de los pies juntas.' },
        { nombre: 'Paloma', series: 2, segundos: 45, descanso: 10, consejo: '45 s por lado.' },
        { nombre: 'Piernas en la pared', series: 1, segundos: 120, descanso: 0, consejo: 'Respira lento y suelta el día.' },
      ] },
    ],
  },
];

export const AVISO_EJERCICIO =
  'Si tienes una lesión, dolor o una condición médica, consulta antes con un profesional. Detente si algo duele.';
