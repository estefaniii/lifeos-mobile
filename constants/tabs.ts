// Las secciones de la app con su color y su icono.
// - `abajo`: las que van en la barra inferior del celular (caben cinco).
// - Todas salen en el menú lateral de la computadora y en el menú del celular.
export type Seccion = { ruta: string; nombre: string; color: string; icon: any; abajo?: boolean; descripcion?: string };

export const SECCIONES: Seccion[] = [
  { ruta: 'index', nombre: 'Inicio', color: '#FFB547', icon: 'house.fill', abajo: true },
  { ruta: 'exercise', nombre: 'Ejercicio', color: '#FF7A6B', icon: 'figure.run', abajo: true },
  { ruta: 'food', nombre: 'Comida', color: '#B6E36B', icon: 'fork.knife', abajo: true },
  { ruta: 'hobbies', nombre: 'Hobbies', color: '#F49AC1', icon: 'paintpalette.fill', abajo: true },
  { ruta: 'finances', nombre: 'Finanzas', color: '#5FD3A8', icon: 'dollarsign.circle.fill', abajo: true },
  { ruta: 'notes', nombre: 'Notas', color: '#8FB8FF', icon: 'doc.text.fill', descripcion: 'Ideas y pendientes' },
  { ruta: 'history', nombre: 'Historial', color: '#C9A7FF', icon: 'clock.arrow.circlepath', descripcion: 'Todo lo que hiciste, por día' },
  { ruta: 'progreso', nombre: 'Mi progreso', color: '#FF7A6B', icon: 'camera.fill', descripcion: 'Fotos de tu cuerpo, solo para ti' },
  { ruta: 'health', nombre: 'Sueño y agua', color: '#7CC4FF', icon: 'moon.fill', descripcion: 'Cómo dormiste y cuánta agua' },
  { ruta: 'profile', nombre: 'Perfil', color: '#F5EFE8', icon: 'person.fill', descripcion: 'Foto, recordatorios y tus datos' },
];

export const seccion = (ruta: string) => SECCIONES.find((s) => s.ruta === ruta);
export const RUTA_URL = (ruta: string) => (ruta === 'index' ? '/' : `/${ruta}`);
// Desde este ancho el menú va a la izquierda y la barra de abajo desaparece
export const ANCHO_ESCRITORIO = 1024;
