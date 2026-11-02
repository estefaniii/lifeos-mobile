// Planes de ejercicio por zona del cuerpo. Rutinas en casa, con peso corporal o mancuernas.
// reps: número de repeticiones; segundos: ejercicio por tiempo. descanso en segundos entre series.
//
// Las fotos son de Pexels (licencia libre), una por zona, guardadas en
// assets/images/ejercicio/ con el ID de la foto al lado por si hay que
// volver a bajarla. Los videos de técnica y la música NO llevan IDs fijos:
// abren una búsqueda en YouTube o Spotify, porque un ID escrito a mano se
// rompe el día que borran el video y deja el reproductor en blanco.
import type { ImageSourcePropType } from 'react-native';

export type Ejercicio = {
  nombre: string; series: number; reps?: number; segundos?: number; descanso: number; consejo: string;
  /** Cómo buscar el video cuando el nombre solo es ambiguo («Almeja», «Paloma»). */
  busqueda?: string;
};
export type Nivel = 'Suave' | 'Express' | 'Completa';
export type Rutina = { id: string; nombre: string; nivel: Nivel; minutos: number; ejercicios: Ejercicio[] };
export type Zona = { id: string; nombre: string; icono: string; color: string; foto: ImageSourcePropType; rutinas: Rutina[] };

export const ZONAS: Zona[] = [
  {
    id: 'piernas', nombre: 'Piernas', icono: 'figure.run', color: '#14B8A6',
    foto: require('../assets/images/ejercicio/piernas.jpg'), // Pexels 4662333
    rutinas: [
      { id: 'piernas-express', nombre: 'Piernas en 10', nivel: 'Express', minutos: 10, ejercicios: [
        { nombre: 'Sentadilla', series: 3, reps: 15, descanso: 20, consejo: 'Baja como si te sentaras en una silla.' },
        { nombre: 'Zancada inversa', series: 2, reps: 10, descanso: 20, consejo: 'Da el paso hacia atrás. 10 por pierna.' },
        { nombre: 'Sentadilla isométrica en pared', series: 2, segundos: 30, descanso: 20, consejo: 'Respira, no aguantes el aire.' },
        { nombre: 'Elevación de talones', series: 2, reps: 20, descanso: 15, consejo: 'Arriba del todo, pausa de un segundo.' },
      ] },
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
    foto: require('../assets/images/ejercicio/gluteos.jpg'), // Pexels 4807549
    rutinas: [
      { id: 'gluteos-express', nombre: 'Glúteos en 10', nivel: 'Express', minutos: 10, ejercicios: [
        { nombre: 'Puente de glúteo', series: 3, reps: 20, descanso: 20, consejo: 'Empuja con los talones y aprieta arriba.' },
        { nombre: 'Patada de glúteo en cuadrupedia', series: 2, reps: 15, descanso: 20, consejo: '15 por lado, el abdomen firme.' },
        { nombre: 'Sentadilla sumo', series: 2, reps: 15, descanso: 20, consejo: 'Rodillas hacia afuera, como las puntas.' },
        { nombre: 'Almeja', series: 2, reps: 15, descanso: 15, consejo: '15 por lado, sin girar la cadera.', busqueda: 'clamshell almeja glúteo' },
      ] },
      { id: 'gluteos-banda', nombre: 'Glúteos con banda', nivel: 'Completa', minutos: 20, ejercicios: [
        { nombre: 'Caminata lateral con banda', series: 3, reps: 15, descanso: 30, consejo: 'Banda sobre las rodillas, semisentada todo el rato.' },
        { nombre: 'Puente de glúteo con banda', series: 3, reps: 15, descanso: 30, consejo: 'Abre las rodillas contra la banda al subir.' },
        { nombre: 'Patada trasera de pie con banda', series: 3, reps: 12, descanso: 30, consejo: '12 por pierna, sin arquear la espalda.' },
        { nombre: 'Sentadilla con banda', series: 3, reps: 15, descanso: 30, consejo: 'No dejes que las rodillas se junten.' },
        { nombre: 'Abducción sentada con banda', series: 3, reps: 20, descanso: 30, consejo: 'Inclínate un poco hacia adelante y abre.' },
      ] },
      { id: 'gluteos-suave', nombre: 'Glúteos activos', nivel: 'Suave', minutos: 15, ejercicios: [
        { nombre: 'Puente de glúteo', series: 3, reps: 15, descanso: 30, consejo: 'Aprieta arriba un segundo.' },
        { nombre: 'Patada de glúteo en cuadrupedia', series: 3, reps: 12, descanso: 30, consejo: '12 por lado, sin arquear la espalda baja.' },
        { nombre: 'Abducción acostada de lado', series: 3, reps: 15, descanso: 30, consejo: '15 por lado, pie un poco hacia adentro.' },
        { nombre: 'Almeja', series: 3, reps: 15, descanso: 30, consejo: 'Rodillas dobladas, abre como una concha.', busqueda: 'clamshell almeja glúteo' },
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
    foto: require('../assets/images/ejercicio/abdomen.jpg'), // Pexels 5149167
    rutinas: [
      { id: 'abdomen-express', nombre: 'Abdomen en 10', nivel: 'Express', minutos: 10, ejercicios: [
        { nombre: 'Plancha', series: 3, segundos: 30, descanso: 15, consejo: 'Glúteos apretados para no hundir la cadera.' },
        { nombre: 'Crunch bicicleta', series: 3, reps: 20, descanso: 15, consejo: 'Codo hacia la rodilla contraria, sin jalar el cuello.' },
        { nombre: 'Bicho muerto', series: 2, reps: 12, descanso: 15, consejo: 'Lento: la espalda baja no se despega.', busqueda: 'dead bug bicho muerto' },
        { nombre: 'Plancha lateral', series: 2, segundos: 20, descanso: 15, consejo: '20 s por lado. Con rodilla apoyada si cuesta.' },
      ] },
      { id: 'abdomen-suave', nombre: 'Core en 15', nivel: 'Suave', minutos: 15, ejercicios: [
        { nombre: 'Plancha', series: 3, segundos: 30, descanso: 30, consejo: 'Cuerpo en línea recta, ombligo hacia adentro.' },
        { nombre: 'Bicho muerto', series: 3, reps: 10, descanso: 30, consejo: 'Espalda baja pegada al piso. 10 por lado.', busqueda: 'dead bug bicho muerto' },
        { nombre: 'Crunch', series: 3, reps: 15, descanso: 30, consejo: 'Sube con el abdomen, no con el cuello.' },
        { nombre: 'Plancha lateral', series: 2, segundos: 20, descanso: 30, consejo: '20 s por lado.' },
      ] },
      { id: 'abdomen-completa', nombre: 'Abdomen fuerte', nivel: 'Completa', minutos: 25, ejercicios: [
        { nombre: 'Plancha con toque de hombro', series: 3, reps: 16, descanso: 45, consejo: 'Que la cadera no se mueva.' },
        { nombre: 'Elevación de piernas', series: 3, reps: 12, descanso: 45, consejo: 'Baja lento sin despegar la espalda baja.' },
        { nombre: 'Escaladores', series: 3, segundos: 30, descanso: 45, consejo: 'Rodillas al pecho, ritmo constante.' },
        { nombre: 'Giro ruso', series: 3, reps: 20, descanso: 45, consejo: '20 toques en total, pecho abierto.' },
        { nombre: 'Hollow hold', series: 3, segundos: 20, descanso: 45, consejo: 'Brazos y piernas estirados, espalda baja pegada.', busqueda: 'hollow hold abdomen' },
      ] },
    ],
  },
  {
    id: 'brazos', nombre: 'Brazos', icono: 'figure.run', color: '#60A5FA',
    foto: require('../assets/images/ejercicio/brazos.jpg'), // Pexels 3757943
    rutinas: [
      { id: 'brazos-express', nombre: 'Brazos sin pesas', nivel: 'Express', minutos: 10, ejercicios: [
        { nombre: 'Flexiones con rodillas apoyadas', series: 3, reps: 10, descanso: 20, consejo: 'Baja el pecho, no la cabeza.' },
        { nombre: 'Fondos en silla', series: 3, reps: 10, descanso: 20, consejo: 'Hombros lejos de las orejas.' },
        { nombre: 'Plancha con toque de hombro', series: 2, reps: 16, descanso: 20, consejo: 'Pies separados para tener más equilibrio.' },
        { nombre: 'Círculos de brazos', series: 2, segundos: 30, descanso: 15, consejo: 'Círculos pequeños, brazos a la altura del hombro.' },
      ] },
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
    foto: require('../assets/images/ejercicio/espalda.jpg'), // Pexels 2247179
    rutinas: [
      { id: 'espalda-express', nombre: 'Espalda derecha', nivel: 'Express', minutos: 10, ejercicios: [
        { nombre: 'Superman', series: 3, reps: 12, descanso: 20, consejo: 'Cuello largo, mirada al piso.', busqueda: 'superman ejercicio espalda' },
        { nombre: 'Ángeles en el piso', series: 2, reps: 10, descanso: 20, consejo: 'Los pulgares miran al techo.' },
        { nombre: 'Retracción escapular de pie', series: 2, reps: 15, descanso: 20, consejo: 'Junta los omóplatos como si sostuvieras un lápiz.' },
        { nombre: 'Postura del niño', series: 1, segundos: 45, descanso: 0, consejo: 'Brazos largos al frente, suelta los hombros.' },
      ] },
      { id: 'espalda-suave', nombre: 'Espalda sana', nivel: 'Suave', minutos: 15, ejercicios: [
        { nombre: 'Superman', series: 3, reps: 12, descanso: 30, consejo: 'Sube brazos y piernas, mirada al piso.', busqueda: 'superman ejercicio espalda' },
        { nombre: 'Ángeles en el piso', series: 3, reps: 10, descanso: 30, consejo: 'Boca abajo, brazos como en ángel de nieve.' },
        { nombre: 'Remo con mancuerna', series: 3, reps: 12, descanso: 45, consejo: '12 por brazo, codo hacia la cadera.' },
        { nombre: 'Gato-camello', series: 2, reps: 10, descanso: 30, consejo: 'Lento, siguiendo la respiración.' },
      ] },
      { id: 'espalda-completa', nombre: 'Espalda fuerte', nivel: 'Completa', minutos: 25, ejercicios: [
        { nombre: 'Remo inclinado con mancuernas', series: 4, reps: 12, descanso: 60, consejo: 'Espalda recta, junta los omóplatos.' },
        { nombre: 'Pájaro con mancuernas', series: 3, reps: 12, descanso: 45, consejo: 'Brazos abiertos, peso ligero.', busqueda: 'pájaro reverse fly mancuernas' },
        { nombre: 'Peso muerto con mancuernas', series: 3, reps: 10, descanso: 60, consejo: 'Cadera atrás, mancuernas pegadas a las piernas.' },
        { nombre: 'Superman con pausa', series: 3, reps: 10, descanso: 45, consejo: 'Sostén 2 segundos arriba.' },
      ] },
    ],
  },
  {
    id: 'pecho', nombre: 'Pecho', icono: 'figure.run', color: '#F87171',
    foto: require('../assets/images/ejercicio/pecho.jpg'), // Pexels 2780762
    rutinas: [
      { id: 'pecho-express', nombre: 'Pecho en 10', nivel: 'Express', minutos: 10, ejercicios: [
        { nombre: 'Flexiones en pared', series: 2, reps: 15, descanso: 20, consejo: 'Cuanto más lejos los pies, más difícil.' },
        { nombre: 'Flexiones con rodillas apoyadas', series: 3, reps: 8, descanso: 20, consejo: 'Tres segundos para bajar.' },
        { nombre: 'Plancha alta', series: 2, segundos: 30, descanso: 20, consejo: 'Manos debajo de los hombros, empuja el piso.' },
        { nombre: 'Apertura de pecho en la puerta', series: 2, segundos: 30, descanso: 0, consejo: 'Estira suave, sin dolor.' },
      ] },
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
    foto: require('../assets/images/ejercicio/cardio.jpg'), // Pexels 8033075
    rutinas: [
      { id: 'cardio-express', nombre: 'Cardio en 10', nivel: 'Express', minutos: 10, ejercicios: [
        { nombre: 'Jumping jacks', series: 3, segundos: 30, descanso: 15, consejo: 'Sin salto si tienes vecinos abajo: paso lateral.' },
        { nombre: 'Rodillas arriba', series: 3, segundos: 30, descanso: 15, consejo: 'Brazos activos, como si corrieras.' },
        { nombre: 'Talones al glúteo', series: 3, segundos: 30, descanso: 15, consejo: 'Trote en el sitio llevando el talón atrás.' },
        { nombre: 'Boxeo al aire', series: 2, segundos: 30, descanso: 0, consejo: 'Golpes rápidos y el abdomen firme.', busqueda: 'shadow boxing cardio en casa' },
      ] },
      { id: 'cardio-suave', nombre: 'Cardio suave', nivel: 'Suave', minutos: 15, ejercicios: [
        { nombre: 'Marcha en el lugar', series: 1, segundos: 120, descanso: 15, consejo: 'Sube las rodillas y mueve los brazos.' },
        { nombre: 'Jumping jacks sin salto', series: 3, segundos: 40, descanso: 20, consejo: 'Paso lateral en lugar de saltar.' },
        { nombre: 'Rodillas arriba', series: 3, segundos: 30, descanso: 30, consejo: 'A tu ritmo.' },
        { nombre: 'Boxeo al aire', series: 3, segundos: 40, descanso: 20, consejo: 'Golpes rápidos, abdomen firme.', busqueda: 'shadow boxing cardio en casa' },
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
    foto: require('../assets/images/ejercicio/movilidad.jpg'), // Pexels 1953894
    rutinas: [
      { id: 'movilidad-espalda', nombre: 'Espalda suelta', nivel: 'Suave', minutos: 12, ejercicios: [
        { nombre: 'Gato-camello', series: 1, segundos: 60, descanso: 10, consejo: 'Redondea al exhalar, arquea al inhalar.' },
        { nombre: 'Rotación torácica en cuadrupedia', series: 2, reps: 8, descanso: 10, consejo: 'Mano en la nuca, abre el codo al techo. 8 por lado.' },
        { nombre: 'Cobra suave', series: 2, reps: 8, descanso: 10, consejo: 'Sube solo hasta donde no moleste la espalda baja.' },
        { nombre: 'Rodillas al pecho', series: 1, segundos: 45, descanso: 10, consejo: 'Acostada, balancéate un poco de lado a lado.' },
        { nombre: 'Postura del niño', series: 1, segundos: 60, descanso: 0, consejo: 'Respira hacia la espalda.' },
      ] },
      { id: 'movilidad-estres', nombre: 'Soltar el estrés', nivel: 'Suave', minutos: 15, ejercicios: [
        { nombre: 'Respiración con exhalación larga', series: 1, segundos: 120, descanso: 10, consejo: 'Inhala en 4, exhala en 6. Nada más.', busqueda: 'respiración 4 6 exhalación larga' },
        { nombre: 'Rotación de cuello lenta', series: 1, segundos: 60, descanso: 10, consejo: 'Medio círculo de hombro a hombro, sin echar la cabeza atrás.' },
        { nombre: 'Estiramiento lateral de pie', series: 2, segundos: 30, descanso: 10, consejo: '30 s por lado. Crece hacia arriba antes de inclinarte.' },
        { nombre: 'Postura del niño', series: 1, segundos: 90, descanso: 10, consejo: 'Frente apoyada. Suelta la mandíbula.' },
        { nombre: 'Rotación de columna acostada', series: 2, segundos: 45, descanso: 10, consejo: 'Deja que la gravedad haga el trabajo.' },
        { nombre: 'Piernas en la pared', series: 1, segundos: 180, descanso: 0, consejo: 'Ojos cerrados, respira lento.' },
      ] },
      { id: 'movilidad-express', nombre: 'Pausa de escritorio', nivel: 'Express', minutos: 6, ejercicios: [
        { nombre: 'Círculos de hombros', series: 1, segundos: 30, descanso: 5, consejo: 'Hacia atrás, grandes y lentos.' },
        { nombre: 'Estiramiento de cuello lateral', series: 2, segundos: 20, descanso: 5, consejo: 'Oreja al hombro, 20 s por lado.' },
        { nombre: 'Apertura de pecho en la puerta', series: 1, segundos: 30, descanso: 5, consejo: 'Contrarresta las horas en la compu.' },
        { nombre: 'Flexión hacia adelante de pie', series: 1, segundos: 45, descanso: 5, consejo: 'Rodillas dobladas, deja colgar la cabeza.' },
        { nombre: 'Círculos de cadera', series: 1, segundos: 30, descanso: 0, consejo: 'Manos en la cintura, hacia los dos lados.' },
      ] },
      { id: 'movilidad-manana', nombre: 'Despertar el cuerpo', nivel: 'Suave', minutos: 10, ejercicios: [
        { nombre: 'Gato-camello', series: 1, segundos: 60, descanso: 10, consejo: 'Sigue tu respiración.' },
        { nombre: 'Círculos de cadera', series: 1, segundos: 40, descanso: 10, consejo: 'Hacia un lado y hacia el otro.' },
        { nombre: 'Estiramiento de isquiotibiales', series: 2, segundos: 30, descanso: 10, consejo: 'Sin rebotar.' },
        { nombre: 'Postura del niño', series: 1, segundos: 60, descanso: 10, consejo: 'Respira hacia la espalda.' },
        { nombre: 'Apertura de pecho en la puerta', series: 2, segundos: 30, descanso: 10, consejo: 'Antebrazo en el marco, gira suave.' },
      ] },
      { id: 'movilidad-noche', nombre: 'Soltar antes de dormir', nivel: 'Suave', minutos: 12, ejercicios: [
        { nombre: 'Rotación de columna acostada', series: 2, segundos: 40, descanso: 10, consejo: 'Rodillas a un lado, mirada al otro.' },
        { nombre: 'Mariposa', series: 1, segundos: 60, descanso: 10, consejo: 'Plantas de los pies juntas.', busqueda: 'estiramiento mariposa cadera' },
        { nombre: 'Paloma', series: 2, segundos: 45, descanso: 10, consejo: '45 s por lado.', busqueda: 'postura de la paloma estiramiento' },
        { nombre: 'Piernas en la pared', series: 1, segundos: 120, descanso: 0, consejo: 'Respira lento y suelta el día.' },
      ] },
    ],
  },
];

export const AVISO_EJERCICIO =
  'Si tienes una lesión, dolor o una condición médica, consulta antes con un profesional. Detente si algo duele.';

/** Busca una rutina por id en todas las zonas (los retos apuntan a rutinas por id). */
export function buscarRutina(id: string | undefined): { zona: Zona; rutina: Rutina } | null {
  if (!id) return null;
  for (const zona of ZONAS) {
    const rutina = zona.rutinas.find((r) => r.id === id);
    if (rutina) return { zona, rutina };
  }
  return null;
}

/** Búsqueda en YouTube del video de técnica. Una búsqueda no se rompe; un ID fijo sí. */
export const urlComoSeHace = (e: Ejercicio) =>
  'https://www.youtube.com/results?search_query=' +
  encodeURIComponent('cómo hacer ' + (e.busqueda ?? e.nombre) + ' ejercicio técnica');

// ---------- música para entrenar ----------
// Listas por búsqueda, nunca por ID: así siempre sale algo aunque una lista desaparezca.
export type ListaMusica = { nombre: string; busqueda: string };

/**
 * Cada lista dice en qué zonas encaja. Las de fuerza (pesas, pecho, espalda)
 * llevan rock y hip hop; las de glúteos y abdomen, ritmos para moverse;
 * cardio, lo más rápido; movilidad, lo tranquilo. Cada zona tiene de 3 a 5.
 */
export type ListaConZonas = ListaMusica & { zonas: string[] };

export const LISTAS: ListaConZonas[] = [
  { nombre: 'Reggaetón', busqueda: 'reggaetón para entrenar', zonas: ['piernas', 'gluteos', 'cardio'] },
  { nombre: 'Dembow', busqueda: 'dembow gym workout', zonas: ['gluteos', 'abdomen'] },
  { nombre: 'Bad Bunny workout', busqueda: 'Bad Bunny workout', zonas: ['gluteos', 'brazos', 'pecho'] },
  { nombre: 'Afrobeats', busqueda: 'afrobeats workout', zonas: ['gluteos', 'abdomen'] },
  { nombre: 'Pop latino 2000s', busqueda: 'pop latino 2000s éxitos', zonas: ['abdomen', 'brazos'] },
  { nombre: 'K-pop', busqueda: 'k-pop workout', zonas: ['abdomen', 'brazos'] },
  { nombre: 'Hip hop', busqueda: 'hip hop gym workout', zonas: ['piernas', 'brazos', 'espalda', 'pecho'] },
  { nombre: 'Rock para pesas', busqueda: 'rock gym pesas', zonas: ['piernas', 'espalda', 'pecho'] },
  { nombre: 'Motivación en inglés', busqueda: 'motivational workout songs', zonas: ['espalda', 'pecho'] },
  { nombre: 'Electrónica y house', busqueda: 'house music cardio workout', zonas: ['piernas', 'cardio'] },
  { nombre: 'Salsa', busqueda: 'salsa cardio', zonas: ['cardio'] },
  { nombre: 'Bachata', busqueda: 'bachata para bailar y entrenar', zonas: ['cardio'] },
  { nombre: 'Pop para correr', busqueda: 'pop para correr', zonas: ['cardio'] },
  { nombre: 'Lo-fi', busqueda: 'lo-fi para estirar', zonas: ['movilidad'] },
  { nombre: 'Lluvia y naturaleza', busqueda: 'sonidos de lluvia y naturaleza relajante', zonas: ['movilidad'] },
  { nombre: 'Piano suave', busqueda: 'piano suave relajante', zonas: ['movilidad'] },
];

/** Las de una zona; sin zona, todas (la portada de Ejercicio). */
export function listasPara(zonaId?: string): ListaMusica[] {
  if (!zonaId) return LISTAS;
  const deZona = LISTAS.filter((l) => l.zonas.includes(zonaId));
  return deZona.length ? deZona : LISTAS;
}

export const urlSpotify = (l: ListaMusica) => `https://open.spotify.com/search/${encodeURIComponent(l.busqueda)}/playlists`;
export const urlYoutubeMusic = (l: ListaMusica) => `https://music.youtube.com/search?q=${encodeURIComponent(l.busqueda)}`;
