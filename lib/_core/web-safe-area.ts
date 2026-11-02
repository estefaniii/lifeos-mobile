// La zona segura real del navegador (la raya de inicio y la isla del iPhone en la PWA).
// El layout raíz forzaba 0 en web y solo la cambiaba si llegaba un mensaje del iframe
// de Manus, así que en el iPhone el menú quedaba pegado a la raya. CSS sí la conoce
// con env(); solo hay que medirla. Requiere viewport-fit=cover (app/+html.tsx).
import type { EdgeInsets } from 'react-native-safe-area-context';

const CERO: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };

export function medirZonaSegura(): EdgeInsets {
  if (typeof document === 'undefined' || !document.body) return CERO;
  const el = document.createElement('div');
  el.style.cssText =
    'position:fixed;visibility:hidden;pointer-events:none;' +
    'padding-top:env(safe-area-inset-top);padding-right:env(safe-area-inset-right);' +
    'padding-bottom:env(safe-area-inset-bottom);padding-left:env(safe-area-inset-left);';
  document.body.appendChild(el);
  const cs = getComputedStyle(el);
  const px = (v: string) => parseFloat(v) || 0;
  const out = { top: px(cs.paddingTop), right: px(cs.paddingRight), bottom: px(cs.paddingBottom), left: px(cs.paddingLeft) };
  el.remove();
  return out;
}

// Vuelve a medir al girar o cambiar de tamaño
export function escucharZonaSegura(cb: (i: EdgeInsets) => void) {
  if (typeof window === 'undefined') return () => {};
  const f = () => cb(medirZonaSegura());
  f();
  window.addEventListener('resize', f);
  window.addEventListener('orientationchange', f);
  return () => { window.removeEventListener('resize', f); window.removeEventListener('orientationchange', f) };
}
