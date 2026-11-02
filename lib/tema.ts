// El tema de la app: oscuro, claro o como el teléfono.
//
// Lo más simple que funciona: la preferencia se lee UNA vez, al cargar el
// módulo, y de ahí sale `PALETA` (que components/decor.tsx exporta como
// `TINTA`). Nada se re-renderiza al cambiarla:
// - en la web, guardarla recarga la página;
// - en el teléfono, se guarda y se aplica al volver a abrir la app.
// La lectura tiene que ser síncrona (hay estilos a nivel de módulo que leen
// TINTA al importarse): localStorage en la web, SecureStore en el teléfono.
import { Appearance, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { paletas, type Paleta } from '@/theme.config';

export type PreferenciaTema = 'oscuro' | 'claro' | 'sistema';
export type ModoTema = 'oscuro' | 'claro';
export type { Paleta };

const CLAVE = 'lifeos_tema';
const PALETAS = paletas;

const esPreferencia = (v: unknown): v is PreferenciaTema => v === 'oscuro' || v === 'claro' || v === 'sistema';

function leerGuardada(): PreferenciaTema {
  try {
    const v = Platform.OS === 'web' ? localStorage.getItem(CLAVE) : SecureStore.getItem(CLAVE);
    if (esPreferencia(v)) return v;
  } catch {}
  return 'oscuro';
}

function modoDelSistema(): ModoTema {
  if (Platform.OS === 'web') {
    try { return window.matchMedia('(prefers-color-scheme: light)').matches ? 'claro' : 'oscuro'; } catch { return 'oscuro'; }
  }
  return Appearance.getColorScheme() === 'light' ? 'claro' : 'oscuro';
}

const resolver = (p: PreferenciaTema): ModoTema => (p === 'sistema' ? modoDelSistema() : p);

let preferencia: PreferenciaTema = leerGuardada();
let modo: ModoTema = resolver(preferencia);

/** La paleta activa, fija mientras la app está abierta. */
export const PALETA: Paleta = { ...PALETAS[modo] };

export const preferenciaTema = () => preferencia;
export const modoTema = () => modo;
export const esClaro = () => modo === 'claro';

// En la web, el color de la barra del navegador y el fondo de la página
// (lo que asoma al estirar el scroll) siguen el tema desde el primer momento.
function aplicarWeb() {
  if (typeof document === 'undefined') return;
  try {
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', PALETA.fondo);
    document.documentElement.style.backgroundColor = PALETA.fondo;
    document.documentElement.style.colorScheme = modo === 'claro' ? 'light' : 'dark';
  } catch {}
}
if (Platform.OS === 'web') aplicarWeb();

/** Guarda la preferencia. En la web recarga la página; en el teléfono vale al reabrir. */
export async function guardarPreferenciaTema(p: PreferenciaTema): Promise<void> {
  preferencia = p;
  if (Platform.OS === 'web') {
    try { localStorage.setItem(CLAVE, p); } catch {}
    try { window.location.reload(); } catch {}
    return;
  }
  try { await SecureStore.setItemAsync(CLAVE, p); } catch {}
}

// ── Acentos como texto ──────────────────────────────────────────────
// Los acentos sirven de fondo de botón en los dos modos, pero como texto o
// icono sobre fondo claro no llegan a 4,5:1. Para eso, su variante oscura.
const ACENTO_OSCURO: Record<string, string> = {
  '#FFB547': '#B26A00', // ámbar
  '#FF7A6B': '#C2412F', // coral
  '#B6E36B': '#4E7A12', // lima
  '#F49AC1': '#B23A78', // rosa
  '#5FD3A8': '#1E8A63', // menta
  '#8FB8FF': '#2F5FC4', // azul
  '#C9A7FF': '#7046C2', // lila
  '#7CC4FF': '#1F6FB2', // celeste
};

function oscurecer(hex: string, cuanto: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const canal = (v: number) => Math.round(v * (1 - cuanto)).toString(16).padStart(2, '0');
  return `#${canal((n >> 16) & 255)}${canal((n >> 8) & 255)}${canal(n & 255)}`.toUpperCase();
}

/**
 * El color de un acento cuando se usa como TEXTO o ICONO. En oscuro es el
 * mismo; en claro, su variante oscura. Para fondos, el acento tal cual.
 */
export function acentoTexto(color: string): string {
  if (modo !== 'claro' || !color) return color;
  const k = color.toUpperCase();
  if (k === PALETAS.claro.texto || k === PALETAS.oscuro.texto) return PALETA.texto;
  return ACENTO_OSCURO[k] ?? oscurecer(color, 0.45);
}
