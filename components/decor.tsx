// Piezas de diseño compartidas: el título en Bricolage Grotesque y los stickers
// (formas planas que cruzan el borde de una tarjeta, como en un cuaderno pegado).
// Nada de degradados ni vidrio: color plano y un borde.
import { Text, View, type TextStyle, type ViewStyle, type StyleProp } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

export const TINTA = { fondo: '#110F0D', tarjeta: '#1A1714', borde: '#2E2924', texto: '#F5EFE8', suave: '#A39A90' };

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
export function Sticker({ texto, color = '#FFB547', tinta = '#1A1714', giro = -6, style }: {
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
export function Chispa({ size = 22, color = '#FFB547', style }: { size?: number; color?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View pointerEvents="none" style={style}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M12 0C13 7 17 11 24 12C17 13 13 17 12 24C11 17 7 13 0 12C7 11 11 7 12 0Z" fill={color} />
      </Svg>
    </View>
  );
}

// Estrella de cinco puntas, plana
export function Estrella({ size = 28, color = '#F49AC1', style }: { size?: number; color?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View pointerEvents="none" style={style}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M12 1.5l3.1 6.6 7.2.8-5.4 4.9 1.5 7.1L12 17.3l-6.4 3.6 1.5-7.1L1.7 8.9l7.2-.8z" fill={color} stroke={TINTA.texto} strokeWidth={1.2} strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

// Sello redondo con doble borde y un número o emoji en el centro
export function Sello({ centro, pie, color = '#5FD3A8', size = 76, giro = 8, style }: {
  centro: string; pie?: string; color?: string; size?: number; giro?: number; style?: StyleProp<ViewStyle>;
}) {
  return (
    <View pointerEvents="none" style={[{ width: size, height: size, transform: [{ rotate: `${giro}deg` }] }, style]}>
      <Svg width={size} height={size} viewBox="0 0 100 100" style={{ position: 'absolute' }}>
        <Circle cx={50} cy={50} r={48} fill={color} />
        <Circle cx={50} cy={50} r={41} fill="none" stroke={TINTA.fondo} strokeWidth={2} strokeDasharray="4 4" />
      </Svg>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: size * 0.32, color: TINTA.fondo, lineHeight: size * 0.36 }}>{centro}</Text>
        {!!pie && <Text style={{ fontSize: size * 0.12, fontWeight: '800', color: TINTA.fondo }}>{pie}</Text>}
      </View>
    </View>
  );
}
