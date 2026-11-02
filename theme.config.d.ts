type Swatch = { light: string; dark: string };

export const themeColors: {
  primary: Swatch;
  background: Swatch;
  surface: Swatch;
  foreground: Swatch;
  muted: Swatch;
  border: Swatch;
  success: Swatch;
  warning: Swatch;
  error: Swatch;
  accent: Swatch;
};

export type Paleta = {
  fondo: string;
  tarjeta: string;
  elevada: string;
  borde: string;
  bordeFuerte: string;
  texto: string;
  suave: string;
  tenue: string;
  menuFondo: string;
  sobreAcento: string;
  overlay: string;
};

export const paletas: { oscuro: Paleta; claro: Paleta };

declare const themeConfig: {
  themeColors: typeof themeColors;
  paletas: typeof paletas;
};

export default themeConfig;
