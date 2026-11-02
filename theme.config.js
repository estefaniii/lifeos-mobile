// El único origen de color de la app. De aquí salen:
// - `TINTA` (components/decor.tsx, vía lib/tema.ts), que usan las pantallas;
// - `useColors()` y las clases de Tailwind (`bg-background`, `text-foreground`…).
// Si se cambia un color, se cambia aquí y nada más.

/** Las dos paletas cálidas. Mismas claves en las dos. */
const paletas = {
  oscuro: {
    fondo: '#110F0D',
    tarjeta: '#1A1714',
    elevada: '#2A2521', // chips, campos e iconos dentro de una tarjeta
    borde: '#2E2924',
    bordeFuerte: '#3A342E', // interruptores apagados, bordes que deben verse
    texto: '#F5EFE8',
    suave: '#A39A90',
    tenue: '#8C847B', // iconos inactivos del menú
    menuFondo: '#0B0A09',
    sobreAcento: '#110F0D', // texto encima de un acento: siempre oscuro
    overlay: 'rgba(0,0,0,0.6)', // detrás de los modales
  },
  claro: {
    fondo: '#FBF6EF',
    tarjeta: '#FFFFFF',
    elevada: '#F3EBE1',
    borde: '#EADFD2',
    bordeFuerte: '#D9CBBB',
    texto: '#1E1915',
    suave: '#6E6359',
    tenue: '#857A6F',
    menuFondo: '#F6EFE6',
    sobreAcento: '#110F0D',
    overlay: 'rgba(30,25,21,0.38)',
  },
};

const O = paletas.oscuro;
const C = paletas.claro;

/** @type {const} */
const themeColors = {
  primary: { light: '#B26A00', dark: '#FFB547' }, // ámbar, el color de Inicio
  background: { light: C.fondo, dark: O.fondo },
  surface: { light: C.tarjeta, dark: O.tarjeta },
  foreground: { light: C.texto, dark: O.texto },
  muted: { light: C.suave, dark: O.suave },
  border: { light: C.borde, dark: O.borde },
  success: { light: '#1E8A63', dark: '#5FD3A8' }, // menta
  warning: { light: '#B26A00', dark: '#FFB547' }, // ámbar
  error: { light: '#C2412F', dark: '#FF7A6B' }, // coral
  accent: { light: '#7046C2', dark: '#C9A7FF' }, // lila
};

module.exports = { themeColors, paletas };
