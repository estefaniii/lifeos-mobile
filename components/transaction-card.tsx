import React from 'react';
import { View, Text, Pressable, Alert, Platform } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { TINTA } from '@/components/decor';

interface TransactionCardProps {
  amount: number;
  category: string;
  description?: string;
  date: string;
  type: 'income' | 'expense';
  onPress?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
}

const MENTA = '#5FD3A8';
const CORAL = '#FF7A6B';
const ALTO = '#2A2521';

const CATEGORY_ICONS: Record<string, string> = {
  'Sueldo': '💼', 'Emprendimientos': '🚀', 'Dropshipping': '📦', 'Servicios Creativos': '🎨',
  'Freelance': '💻', 'Inversiones': '📈', 'Materiales': '🛠', 'Salidas': '🎉',
  'Universidad': '🎓', 'Compras Online': '🛒', 'Comida': '🍔', 'Transporte': '🚗',
  'Suscripciones': '📱', 'Salud': '💊', 'Otros': '📌',
};

// Un movimiento: icono, categoría y nota a la izquierda; monto, fecha y
// acciones a la derecha. Los botones miden 34 px pero tocan en 44.
export function TransactionCard({
  amount,
  category,
  description,
  date,
  type,
  onPress,
  onDelete,
  onEdit,
}: TransactionCardProps) {
  const isIncome = type === 'income';
  const amountColor = isIncome ? MENTA : CORAL;
  const formattedAmount = `${isIncome ? '+' : '−'}$${Math.abs(amount).toFixed(2)}`;
  const categoryIcon = CATEGORY_ICONS[category] || (isIncome ? '💰' : '💸');

  // La fecha llega como AAAA-MM-DD: se arma a mediodía local para que no salte de día
  const dateObj = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T12:00:00`) : new Date(date);
  const formattedDate = dateObj.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });

  const confirmarBorrado = () => {
    if (!onDelete) return;
    if (Platform.OS === 'web') {
      if (window.confirm('¿Estás seguro de eliminar este registro?')) onDelete();
    } else {
      Alert.alert('Eliminar registro', '¿Estás seguro de eliminar este registro?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: onDelete },
      ]);
    }
  };

  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: TINTA.tarjeta,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: TINTA.borde,
        paddingVertical: 12,
        paddingHorizontal: 14,
      }}>
        <View style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: ALTO, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 20 }}>{categoryIcon}</Text>
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: TINTA.texto }} numberOfLines={1}>{category}</Text>
          {!!description && (
            <Text style={{ fontSize: 13, color: TINTA.suave, marginTop: 2 }} numberOfLines={2}>{description}</Text>
          )}
          <Text style={{ fontSize: 13, color: TINTA.suave, marginTop: 2 }}>{formattedDate}</Text>
        </View>

        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: amountColor }}>{formattedAmount}</Text>
          {(onEdit || onDelete) && (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {onEdit && (
                <Pressable
                  onPress={(e) => { e.stopPropagation(); onEdit(); }}
                  hitSlop={5}
                  accessibilityRole="button"
                  accessibilityLabel="Editar movimiento"
                  style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: ALTO, alignItems: 'center', justifyContent: 'center' }}
                >
                  <IconSymbol name="pencil" size={15} color={TINTA.suave} />
                </Pressable>
              )}
              {onDelete && (
                <Pressable
                  onPress={(e) => { e.stopPropagation(); confirmarBorrado(); }}
                  hitSlop={5}
                  accessibilityRole="button"
                  accessibilityLabel="Eliminar movimiento"
                  style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: ALTO, alignItems: 'center', justifyContent: 'center' }}
                >
                  <IconSymbol name="trash.fill" size={15} color={CORAL} />
                </Pressable>
              )}
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}
