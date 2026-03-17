import React, { useState } from 'react';
import { ScrollView, Text, View, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useMonthlyComparison, type MonthlyReport } from '@/hooks/use-monthly-report';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function StatCard({ label, value, prev, unit, colors, inverse }: {
  label: string;
  value: number;
  prev: number;
  unit?: string;
  colors: any;
  inverse?: boolean;
}) {
  const diff = prev > 0 ? Math.round(((value - prev) / prev) * 100) : 0;
  const isPositive = inverse ? diff <= 0 : diff >= 0;
  const arrow = diff > 0 ? '↑' : diff < 0 ? '↓' : '→';
  const diffColor = diff === 0 ? colors.muted : isPositive ? colors.success : colors.error;

  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 14, flex: 1, minWidth: '45%' }}>
      <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 4 }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>
        {typeof value === 'number' ? value.toLocaleString() : value}{unit ? ` ${unit}` : ''}
      </Text>
      {prev > 0 && (
        <Text style={{ color: diffColor, fontSize: 11, marginTop: 2 }}>
          {arrow} {Math.abs(diff)}% vs mes anterior
        </Text>
      )}
    </View>
  );
}

function SectionTitle({ title, icon, colors }: { title: string; icon: string; colors: any }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginTop: 20 }}>
      <Text style={{ fontSize: 18 }}>{icon}</Text>
      <Text style={{ color: colors.text, fontSize: 17, fontWeight: '700', marginLeft: 8 }}>{title}</Text>
    </View>
  );
}

function CategoryBar({ name, amount, maxAmount, colors }: { name: string; amount: number; maxAmount: number; colors: any }) {
  const pct = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
  return (
    <View style={{ marginBottom: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
        <Text style={{ color: colors.text, fontSize: 13 }}>{name}</Text>
        <Text style={{ color: colors.muted, fontSize: 13 }}>${amount.toLocaleString()}</Text>
      </View>
      <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' }}>
        <View style={{ height: 6, backgroundColor: colors.primary, borderRadius: 3, width: `${Math.min(pct, 100)}%` }} />
      </View>
    </View>
  );
}

export default function ReportsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { data, isLoading } = useMonthlyComparison();

  const now = new Date();
  const currentMonthName = MONTHS[now.getMonth()];
  const currentYear = now.getFullYear();

  if (isLoading || !data) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.muted, marginTop: 12 }}>Generando reporte...</Text>
        </View>
      </ScreenContainer>
    );
  }

  const { current: c, previous: p } = data;
  const maxCat = c.finances.topCategories.length > 0
    ? Math.max(...c.finances.topCategories.map(x => x.amount))
    : 0;

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <Pressable onPress={() => router.back()} style={{ marginRight: 12, padding: 4 }}>
            <Text style={{ color: colors.primary, fontSize: 24 }}>←</Text>
          </Pressable>
          <View>
            <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800' }}>
              Reporte Mensual
            </Text>
            <Text style={{ color: colors.muted, fontSize: 14 }}>
              {currentMonthName} {currentYear}
            </Text>
          </View>
        </View>

        {/* Score Overview */}
        <View style={{
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 20,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: colors.border,
        }}>
          <Text style={{ color: colors.muted, fontSize: 13 }}>Resumen del Mes</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 12 }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: colors.success, fontSize: 28, fontWeight: '800' }}>
                ${c.finances.income.toLocaleString()}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 11 }}>Ingresos</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: colors.error, fontSize: 28, fontWeight: '800' }}>
                ${c.finances.expenses.toLocaleString()}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 11 }}>Gastos</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{
                color: c.finances.balance >= 0 ? colors.success : colors.error,
                fontSize: 28,
                fontWeight: '800',
              }}>
                ${c.finances.balance.toLocaleString()}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 11 }}>Balance</Text>
            </View>
          </View>
        </View>

        {/* Finances */}
        <SectionTitle title="Finanzas" icon="💰" colors={colors} />
        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
          <StatCard label="Ingresos" value={c.finances.income} prev={p.finances.income} unit="$" colors={colors} />
          <StatCard label="Gastos" value={c.finances.expenses} prev={p.finances.expenses} unit="$" colors={colors} inverse />
          <StatCard label="Transacciones" value={c.finances.transactionCount} prev={p.finances.transactionCount} colors={colors} />
          <StatCard label="Balance" value={c.finances.balance} prev={p.finances.balance} unit="$" colors={colors} />
        </View>

        {c.finances.topCategories.length > 0 && (
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginTop: 12 }}>
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 10 }}>
              Top Categorías de Gasto
            </Text>
            {c.finances.topCategories.map((cat) => (
              <CategoryBar key={cat.name} name={cat.name} amount={cat.amount} maxAmount={maxCat} colors={colors} />
            ))}
          </View>
        )}

        {/* Health */}
        <SectionTitle title="Salud" icon="❤️" colors={colors} />
        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
          <StatCard label="Agua Promedio" value={avgWaterLiters(c.health.avgWater)} prev={avgWaterLiters(p.health.avgWater)} unit="L" colors={colors} />
          <StatCard label="Días de Gym" value={c.health.gymDays} prev={p.health.gymDays} colors={colors} />
          <StatCard label="Días de Yoga" value={c.health.yogaDays} prev={p.health.yogaDays} colors={colors} />
          <StatCard label="Sueño Promedio" value={sleepHours(c.health.avgSleep)} prev={sleepHours(p.health.avgSleep)} unit="hrs" colors={colors} />
          <StatCard label="Ejercicio Total" value={c.health.totalExerciseMin} prev={p.health.totalExerciseMin} unit="min" colors={colors} />
          <StatCard label="Días Rastreados" value={c.health.daysTracked} prev={p.health.daysTracked} colors={colors} />
        </View>

        {/* Habits */}
        <SectionTitle title="Hábitos" icon="🎯" colors={colors} />
        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
          <StatCard label="Completados" value={c.habits.totalCompletions} prev={p.habits.totalCompletions} colors={colors} />
          <StatCard label="Días Activos" value={c.habits.uniqueDays} prev={p.habits.uniqueDays} colors={colors} />
          <StatCard label="Mejor Racha" value={c.habits.bestStreak} prev={p.habits.bestStreak} unit="días" colors={colors} />
          <StatCard label="Tasa Cumplimiento" value={c.habits.completionRate} prev={p.habits.completionRate} unit="%" colors={colors} />
        </View>

        {/* Mental */}
        <SectionTitle title="Bienestar Mental" icon="🧘" colors={colors} />
        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
          <StatCard label="Meditación Total" value={c.mental.totalMeditation} prev={p.mental.totalMeditation} unit="min" colors={colors} />
          <StatCard label="Ánimo Promedio" value={c.mental.avgMood} prev={p.mental.avgMood} unit="/5" colors={colors} />
          <StatCard label="Registros" value={c.mental.entriesCount} prev={p.mental.entriesCount} colors={colors} />
        </View>

        {/* Tips */}
        <View style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 16,
          marginTop: 24,
          borderWidth: 1,
          borderColor: colors.primary + '30',
        }}>
          <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '700', marginBottom: 6 }}>
            💡 Tip del Mes
          </Text>
          <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 20 }}>
            {generateTip(c, p)}
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function avgWaterLiters(ml: number): number {
  return Math.round(ml / 100) / 10; // e.g. 1850 -> 1.9
}

function sleepHours(minutes: number): number {
  return Math.round(minutes / 6) / 10; // e.g. 450 -> 7.5
}

function generateTip(current: MonthlyReport, previous: MonthlyReport): string {
  const tips: string[] = [];

  if (current.finances.expenses > current.finances.income) {
    tips.push('Tus gastos superan tus ingresos este mes. Considera revisar tus categorías de gasto más altas.');
  }
  if (current.health.gymDays < 8) {
    tips.push('Intenta ir al gym al menos 3 veces por semana para mantener una rutina constante.');
  }
  if (current.health.avgWater < 1500) {
    tips.push('Tu hidratación promedio está baja. Intenta tomar al menos 2L de agua al día.');
  }
  if (current.habits.completionRate < 50) {
    tips.push('Tu tasa de cumplimiento de hábitos es menor al 50%. Enfócate en 2-3 hábitos clave.');
  }
  if (current.mental.totalMeditation < 30) {
    tips.push('La meditación tiene grandes beneficios. Intenta meditar al menos 10 minutos al día.');
  }
  if (current.finances.balance > previous.finances.balance) {
    tips.push('¡Excelente! Tu balance mejoró respecto al mes anterior. Sigue así.');
  }

  return tips.length > 0 ? tips[0] : '¡Sigue registrando tus datos para obtener mejores insights cada mes!';
}
