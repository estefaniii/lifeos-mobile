import { Colors, type ColorScheme, type ThemeColorPalette } from "@/constants/theme";
import { esClaro } from "@/lib/tema";

/**
 * La paleta del tema elegido en Perfil (lib/tema.ts), la misma que TINTA.
 * Antes seguía al proveedor de tema antiguo, que forzaba el oscuro, y en modo
 * claro las pantallas que usan useColors() salían con tarjetas negras.
 */
export function useColors(colorSchemeOverride?: ColorScheme): ThemeColorPalette {
  const scheme: ColorScheme = colorSchemeOverride ?? (esClaro() ? "light" : "dark");
  return Colors[scheme];
}
