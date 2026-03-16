import React from 'react';
import { View, Text, Pressable, Alert, Platform } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { IconSymbol } from '@/components/ui/icon-symbol';

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
  const colors = useColors();

  const CATEGORY_ICONS: Record<string, string> = {
    'Sueldo': '💼', 'Emprendimientos': '🚀', 'Dropshipping': '📦', 'Servicios Creativos': '🎨',
    'Freelance': '💻', 'Inversiones': '📈', 'Materiales': '🛠', 'Salidas': '🎉',
    'Universidad': '🎓', 'Compras Online': '🛒', 'Comida': '🍔', 'Transporte': '🚗',
    'Suscripciones': '📱', 'Salud': '💊', 'Otros': '📌',
  };

  const isIncome = type === 'income';
  const amountColor = isIncome ? colors.success : colors.error;
  const amountSign = isIncome ? '+' : '-';
  const formattedAmount = `${amountSign}$${Math.abs(amount).toFixed(2)}`;
  const categoryIcon = CATEGORY_ICONS[category] || (isIncome ? '💰' : '💸');

  const dateObj = new Date(date);
  const formattedDate = dateObj.toLocaleDateString('es-ES', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#27272A',
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
      }}>
        {/* Left side: Category and Description */}
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{
            width: 40, height: 40, borderRadius: 12,
            backgroundColor: isIncome ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 18 }}>{categoryIcon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#FAFAFA' }}>
              {category}
            </Text>
            {description && (
              <Text style={{ fontSize: 12, color: '#A1A1AA', marginTop: 2 }}>
                {description}
              </Text>
            )}
          </View>
        </View>

        {/* Right side: Amount, Date and Actions */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <Text
              style={{ fontSize: 16, fontWeight: '700', color: amountColor }}
            >
              {formattedAmount}
            </Text>
            <Text style={{ fontSize: 12, color: '#A1A1AA' }}>
              {formattedDate}
            </Text>
          </View>

          {onEdit && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              style={{
                padding: 8,
                backgroundColor: 'rgba(59,130,246,0.1)',
                borderRadius: 99,
              }}
            >
              <IconSymbol name="pencil" size={14} color="#60A5FA" />
            </Pressable>
          )}

          {onDelete && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                if (Platform.OS === 'web') {
                  if (window.confirm("¿Estás seguro de eliminar este registro?")) {
                    onDelete();
                  }
                } else {
                  Alert.alert(
                    "Eliminar registro",
                    "¿Estás seguro de eliminar este registro?",
                    [
                      { text: "Cancelar", style: "cancel" },
                      { text: "Eliminar", style: "destructive", onPress: onDelete }
                    ]
                  );
                }
              }}
              style={{
                padding: 8,
                backgroundColor: 'rgba(239,68,68,0.1)',
                borderRadius: 99,
              }}
            >
              <IconSymbol name="trash.fill" size={14} color={colors.error} />
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
}
