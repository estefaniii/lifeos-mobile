// Las secciones de la app con su color y su icono.
// - `abajo`: las que van en la barra inferior del celular (caben cinco).
// - Todas salen en el menú lateral de la computadora y en el menú del celular.
import { PALETA } from '@/lib/tema';

// Los acentos de la app: uno por sección (y el agua). Son colores de FONDO
// (botones, chips, stickers) y valen en los dos temas. Para usarlos como
// texto o icono, pasarlos por `acentoTexto()` (components/decor.tsx).
export const ACENTOS: Record<'inicio' | 'ejercicio' | 'comida' | 'hobbies' | 'finanzas' | 'notas' | 'historial' | 'agua', string> = {
  inicio: '#FFB547', // ámbar
  ejercicio: '#FF7A6B', // coral
  comida: '#B6E36B', // lima
  hobbies: '#F49AC1', // rosa
  finanzas: '#5FD3A8', // menta
  notas: '#8FB8FF', // azul
  historial: '#C9A7FF', // lila
  agua: '#7CC4FF', // celeste
};

export type Seccion = { ruta: string; nombre: string; color: string; icon: any; abajo?: boolean; descripcion?: string };

export const SECCIONES: Seccion[] = [
  { ruta: 'index', nombre: 'Inicio', color: ACENTOS.inicio, icon: 'house.fill', abajo: true },
  { ruta: 'exercise', nombre: 'Ejercicio', color: ACENTOS.ejercicio, icon: 'figure.run', abajo: true },
  { ruta: 'food', nombre: 'Comida', color: ACENTOS.comida, icon: 'fork.knife', abajo: true },
  { ruta: 'hobbies', nombre: 'Hobbies', color: ACENTOS.hobbies, icon: 'paintpalette.fill', abajo: true },
  { ruta: 'finances', nombre: 'Finanzas', color: ACENTOS.finanzas, icon: 'dollarsign.circle.fill', abajo: true },
  { ruta: 'notes', nombre: 'Notas', color: ACENTOS.notas, icon: 'doc.text.fill', descripcion: 'Ideas y pendientes' },
  { ruta: 'history', nombre: 'Historial', color: ACENTOS.historial, icon: 'clock.arrow.circlepath', descripcion: 'Todo lo que hiciste, por día' },
  { ruta: 'progreso', nombre: 'Mi progreso', color: ACENTOS.ejercicio, icon: 'camera.fill', descripcion: 'Fotos de tu cuerpo, solo para ti' },
  { ruta: 'health', nombre: 'Sueño y agua', color: ACENTOS.agua, icon: 'moon.fill', descripcion: 'Cómo dormiste y cuánta agua' },
  // Perfil no tiene acento: usa el color del texto del tema
  { ruta: 'profile', nombre: 'Perfil', color: PALETA.texto, icon: 'person.fill', descripcion: 'Foto, recordatorios y tus datos' },
];

export const seccion = (ruta: string) => SECCIONES.find((s) => s.ruta === ruta);
export const RUTA_URL = (ruta: string) => (ruta === 'index' ? '/' : `/${ruta}`);
// Desde este ancho el menú va a la izquierda y la barra de abajo desaparece
export const ANCHO_ESCRITORIO = 1024;
