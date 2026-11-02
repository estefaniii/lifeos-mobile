// Piezas de diseño compartidas: el título en Bricolage Grotesque y los stickers
// (formas planas que cruzan el borde de una tarjeta, como en un cuaderno pegado).
// Nada de degradados ni vidrio: color plano y un borde.
import { Text, View, type TextStyle, type ViewStyle, type StyleProp } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { PALETA, acentoTexto } from '@/lib/tema';
import { ACENTOS } from '@/constants/tabs';

// La paleta del tema elegido (oscuro o claro). Los valores viven en
// theme.config.js; lib/tema.ts decide cuál toca. Ningún hex de la base a mano.
// - sobreAcento: el texto encima de un acento (siempre oscuro).
// - overlay: el fondo detrás de los modales.
export const TINTA = PALETA;
export { acentoTexto };

// Lo que comparten tarjetas, chips, botones y hojas en toda la app
export const RADIO = { tarjeta: 28, hoja: 32, segmento: 22, chip: 22, boton: 20, campo: 16 } as const;

export function Titulo({ children, size = 34, color = TINTA.texto, style }: { children: React.ReactNode; size?: number; color?: string; style?: StyleProp<TextStyle> }) {
  return (
    <Text
      accessibilityRole="header"
      style={[{ fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: size, lineHeight: size * 1.05, letterSpacing: -size * 0.025, color }, style]}
    >
      {children}
    </Text>
  );
}

// Una pastilla girada con borde claro, para pegar en la esquina de algo
export function Sticker({ texto, color = ACENTOS.inicio, tinta = TINTA.sobreAcento, giro = -6, style }: {
  texto: string; color?: string; tinta?: string; giro?: number; style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      pointerEvents="none"
      style={[{
        alignSelf: 'flex-start', backgroundColor: color, borderRadius: 999, borderWidth: 2.5, borderColor: TINTA.texto,
        paddingHorizontal: 12, paddingVertical: 5, transform: [{ rotate: `${giro}deg` }],
      }, style]}
    >
      <Text style={{ color: tinta, fontWeight: '900', fontSize: 13 }}>{texto}</Text>
    </View>
  );
}

// Chispa de cuatro puntas
export function Chispa({ size = 22, color = ACENTOS.inicio, style }: { size?: number; color?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View pointerEvents="none" style={style}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M12 0C13 7 17 11 24 12C17 13 13 17 12 24C11 17 7 13 0 12C7 11 11 7 12 0Z" fill={color} />
      </Svg>
    </View>
  );
}

// Estrella de cinco puntas, plana
export function Estrella({ size = 28, color = ACENTOS.hobbies, style }: { size?: number; color?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View pointerEvents="none" style={style}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M12 1.5l3.1 6.6 7.2.8-5.4 4.9 1.5 7.1L12 17.3l-6.4 3.6 1.5-7.1L1.7 8.9l7.2-.8z" fill={color} stroke={TINTA.texto} strokeWidth={1.2} strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

// Sello redondo con doble borde y un número o emoji en el centro
export function Sello({ centro, pie, color = ACENTOS.finanzas, size = 76, giro = 8, style }: {
  centro: string; pie?: string; color?: string; size?: number; giro?: number; style?: StyleProp<ViewStyle>;
}) {
  return (
    <View pointerEvents="none" style={[{ width: size, height: size, transform: [{ rotate: `${giro}deg` }] }, style]}>
      <Svg width={size} height={size} viewBox="0 0 100 100" style={{ position: 'absolute' }}>
        <Circle cx={50} cy={50} r={48} fill={color} />
        <Circle cx={50} cy={50} r={41} fill="none" stroke={TINTA.sobreAcento} strokeWidth={2} strokeDasharray="4 4" />
      </Svg>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: size * 0.32, color: TINTA.sobreAcento, lineHeight: size * 0.36 }}>{centro}</Text>
        {!!pie && <Text style={{ fontSize: size * 0.12, fontWeight: '800', color: TINTA.sobreAcento }}>{pie}</Text>}
      </View>
    </View>
  );
}
