import React, { useState } from 'react';
import { ScrollView, Text, View, Pressable, RefreshControl, Alert, Modal, TextInput } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { BarChart, PieChart } from '@/components/charts';
import { TransactionCard } from '@/components/transaction-card';
import { AddTransactionModal } from '@/components/modals/add-transaction-modal';
import { AddSavingsGoalModal } from '@/components/modals/add-savings-goal-modal';
import { useColors } from '@/hooks/use-colors';
import { useFinancialSummary, useTransactions, useExpensesByCategory, useDeleteTransaction, useUpdateTransaction } from '@/hooks/use-transactions';
import { useSavingsGoals, useDeleteSavingsGoal, useUpdateSavingsGoal } from '@/hooks/use-savings-goals';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';

/**
 * Finances Screen
 * 
 * Displays financial data with:
 * - Bar chart: Income vs Expenses (weekly)
 * - Pie chart: Expense breakdown by category
 * - Balance summary
 * - Recent transactions
 */
function UpdateGoalModal({ visible, onClose, goal, onUpdate }: {
  visible: boolean;
  onClose: () => void;
  goal: { id: any; name: string; current_amount: number; target_amount: number } | null;
  onUpdate: (id: any, amount: number) => void;
}) {
  const [value, setValue] = useState('');
  if (!goal) return null;
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#18181B', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 36 }}>
          <Text style={{ color: '#FAFAFA', fontSize: 18, fontWeight: '800', marginBottom: 4 }}>Actualizar Meta</Text>
          <Text style={{ color: '#71717A', fontSize: 12, marginBottom: 16 }}>{goal.name} — Meta: ${goal.target_amount}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#27272A', borderRadius: 14, borderWidth: 1, borderColor: '#3F3F46', paddingHorizontal: 16, marginBottom: 16 }}>
            <Text style={{ color: '#71717A', fontWeight: '700', marginRight: 6 }}>$</Text>
            <TextInput
              style={{ flex: 1, color: '#FAFAFA', fontSize: 20, paddingVertical: 14, fontWeight: '700' }}
              placeholder={String(goal.current_amount)}
              placeholderTextColor="#52525B"
              keyboardType="decimal-pad"
              value={value}
              onChangeText={setValue}
              autoFocus
            />
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: '#27272A', borderRadius: 16, paddingVertical: 14, alignItems: 'center' }}>
              <Text style={{ color: '#A1A1AA', fontWeight: '700' }}>Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                const n = parseFloat(value);
                if (!isNaN(n)) { onUpdate(goal.id, n); onClose(); setValue(''); }
              }}
              style={{ flex: 2, backgroundColor: '#14B8A6', borderRadius: 16, paddingVertical: 14, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>Guardar Progreso</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function EditTransactionModal({ visible, onClose, transaction, onSave }: {
  visible: boolean;
  onClose: () => void;
  transaction: { id: any; amount: number; note?: string; category?: string; type: 'income' | 'expense' } | null;
  onSave: (data: { id: any; amount: number; note: string; category: string; type: 'income' | 'expense' }) => void;
}) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');

  React.useEffect(() => {
    if (transaction && visible) {
      setAmount(String(Math.abs(transaction.amount)));
      setNote(transaction.note || '');
      setCategory(transaction.category || '');
      setType(transaction.type);
    }
  }, [transaction, visible]);

  if (!transaction) return null;

  const incomeCategories = [
    { name: 'Sueldo', icon: '💼' },
    { name: 'Emprendimientos', icon: '🚀' },
    { name: 'Dropshipping', icon: '📦' },
    { name: 'Servicios Creativos', icon: '🎨' },
    { name: 'Freelance', icon: '💻' },
    { name: 'Inversiones', icon: '📈' },
    { name: 'Otros', icon: '📌' },
  ];
  const expenseCategories = [
    { name: 'Materiales', icon: '🛠' },
    { name: 'Salidas', icon: '🎉' },
    { name: 'Universidad', icon: '🎓' },
    { name: 'Compras Online', icon: '🛒' },
    { name: 'Comida', icon: '🍔' },
    { name: 'Transporte', icon: '🚗' },
    { name: 'Suscripciones', icon: '📱' },
    { name: 'Salud', icon: '💊' },
    { name: 'Otros', icon: '📌' },
  ];
  const categories = type === 'income' ? incomeCategories : expenseCategories;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#18181B', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 36 }}>
          <Text style={{ color: '#FAFAFA', fontSize: 18, fontWeight: '800', marginBottom: 16 }}>Editar Transacción</Text>

          {/* Type toggle */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            <Pressable
              onPress={() => setType('income')}
              style={{ flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: type === 'income' ? '#10B981' : '#27272A' }}
            >
              <Text style={{ color: '#FAFAFA', fontWeight: '700', fontSize: 13 }}>Ingreso</Text>
            </Pressable>
            <Pressable
              onPress={() => setType('expense')}
              style={{ flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: type === 'expense' ? '#EF4444' : '#27272A' }}
            >
              <Text style={{ color: '#FAFAFA', fontWeight: '700', fontSize: 13 }}>Gasto</Text>
            </Pressable>
          </View>

          {/* Amount */}
          <Text style={{ color: '#A1A1AA', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Monto</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#27272A', borderRadius: 14, borderWidth: 1, borderColor: '#3F3F46', paddingHorizontal: 16, marginBottom: 12 }}>
            <Text style={{ color: '#71717A', fontWeight: '700', marginRight: 6 }}>$</Text>
            <TextInput
              style={{ flex: 1, color: '#FAFAFA', fontSize: 18, paddingVertical: 12, fontWeight: '700' }}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
          </View>

          {/* Description */}
          <Text style={{ color: '#A1A1AA', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Descripción</Text>
          <TextInput
            style={{ backgroundColor: '#27272A', borderRadius: 14, borderWidth: 1, borderColor: '#3F3F46', paddingHorizontal: 16, paddingVertical: 12, color: '#FAFAFA', fontSize: 14, marginBottom: 12 }}
            value={note}
            onChangeText={setNote}
            placeholder="Descripción"
            placeholderTextColor="#52525B"
          />

          {/* Category chips */}
          <Text style={{ color: '#A1A1AA', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Categoría</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {categories.map((cat) => (
              <Pressable
                key={cat.name}
                onPress={() => setCategory(cat.name)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 99,
                  backgroundColor: category === cat.name ? '#14B8A6' : '#27272A',
                }}
              >
                <Text style={{ fontSize: 14 }}>{cat.icon}</Text>
                <Text style={{ color: category === cat.name ? '#fff' : '#E4E4E7', fontSize: 12, fontWeight: '600' }}>{cat.name}</Text>
              </Pressable>
            ))}
          </View>

          {/* Actions */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: '#27272A', borderRadius: 16, paddingVertical: 14, alignItems: 'center' }}>
              <Text style={{ color: '#A1A1AA', fontWeight: '700' }}>Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                const n = parseFloat(amount);
                if (!isNaN(n) && n > 0) {
                  onSave({ id: transaction.id, amount: n, note, category, type });
                  onClose();
                }
              }}
              style={{ flex: 2, backgroundColor: '#14B8A6', borderRadius: 16, paddingVertical: 14, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>Guardar Cambios</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function FinancesScreen() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'expense'>('expense');
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [updateGoalTarget, setUpdateGoalTarget] = useState<any>(null);

  // Fetch data
  const { data: summary, isLoading: summaryLoading } = useFinancialSummary(period);
  const { data: transactions, isLoading: transactionsLoading } = useTransactions(period);
  const { data: expensesByCategory, isLoading: expensesLoading } = useExpensesByCategory(period);
  const { data: savingsGoals } = useSavingsGoals();
  const deleteTransaction = useDeleteTransaction();
  const updateTransaction = useUpdateTransaction();
  const deleteSavingsGoal = useDeleteSavingsGoal();
  const updateSavingsGoal = useUpdateSavingsGoal();
  const [editTarget, setEditTarget] = useState<any>(null);

  // Prepare chart data
  const barChartData = [
    { x: 'Ingresos', y: summary?.income || 0 },
    { x: 'Gastos', y: summary?.expenses || 0 },
  ];

  const pieChartData = (expensesByCategory || []).map((item) => ({
    x: item.name,
    y: item.amount,
  }));

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.refetchQueries();
    } finally {
      setIsRefreshing(false);
    }
  };

  const openModal = (type: 'income' | 'expense') => {
    setModalType(type);
    setShowAddModal(true);
  };

  const isLoading = summaryLoading || transactionsLoading || expensesLoading;

  return (
    <ScreenContainer className="p-0">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View className="px-6 pt-6 pb-4 flex-row justify-between items-center">
          <View>
            <Text className="text-3xl font-bold text-foreground" style={{ color: '#FAFAFA' }}>Finanzas</Text>
            <Text className="text-sm text-muted mt-1" style={{ color: '#A1A1AA' }}>Gestiona tus ingresos y gastos</Text>
          </View>
          <Pressable
            onPress={() => openModal('expense')}
            className="w-12 h-12 rounded-full bg-primary items-center justify-center shadow-lg shadow-primary/30 active:scale-95"
          >
            <Text className="text-background text-3xl font-bold" style={{ marginTop: -2, color: '#FAFAFA' }}>+</Text>
          </Pressable>
        </View>

        {/* Period Filter */}
        <View className="px-6 mb-6 flex-row gap-2">
          {(['day', 'week', 'month', 'year'] as const).map((p) => (
            <Pressable
              key={p}
              onPress={() => setPeriod(p)}
              className={`px-4 py-2 rounded-full ${period === p ? 'bg-primary' : 'bg-surface'
                }`}
            >
              <Text
                className="text-sm font-semibold"
                style={{ color: period === p ? '#18181B' : '#E4E4E7' }}
              >
                {p === 'day' ? 'Hoy' : p === 'week' ? 'Semana' : p === 'month' ? 'Mes' : 'Año'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Balance Summary Card - MEJORADA CON ACCIONES RÁPIDAS */}
        <View className="mx-6 mb-8 bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 rounded-[40px] p-8 shadow-2xl shadow-black/40">
          <Text className="text-[10px] font-bold text-white/50 uppercase tracking-[4px] mb-2">
            BALANCE NETO
          </Text>
          <Text className="text-5xl font-bold text-white mb-8">
            ${summary?.balance || 0}
          </Text>

          <View className="flex-row justify-between mb-8">
            <View>
              <Text className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">INGRESOS</Text>
              <Text className="text-xl font-bold text-white mt-1">
                +${summary?.income || 0}
              </Text>
            </View>
            <View>
              <Text className="text-[10px] font-bold text-rose-400 uppercase text-right tracking-widest">GASTOS</Text>
              <Text className="text-xl font-bold text-white mt-1 text-right">
                -${summary?.expenses || 0}
              </Text>
            </View>
          </View>

          <View className="flex-row gap-3">
            <Pressable
              onPress={() => openModal('expense')}
              className="flex-1 bg-rose-500/10 border border-rose-500/20 rounded-2xl py-4 items-center active:bg-rose-500/20"
            >
              <Text className="text-rose-400 font-bold text-xs uppercase tracking-tight">- Gasto</Text>
            </Pressable>
            <Pressable
              onPress={() => openModal('income')}
              className="flex-1 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl py-4 items-center active:bg-emerald-500/20"
            >
              <Text className="text-emerald-400 font-bold text-xs uppercase tracking-tight">+ Ingreso</Text>
            </Pressable>
          </View>
        </View>

        {/* Charts Section (Responsive Grid) */}
        <View className="px-6 flex-row flex-wrap -mx-2 mb-8">
          <View className="w-full lg:w-1/2 px-2 mb-6 lg:mb-0">
            <BarChart
              data={barChartData}
              title="Ingresos vs Gastos"
              yLabel="Monto ($)"
              color={colors.primary}
            />
          </View>
          <View className="w-full lg:w-1/2 px-2">
            {pieChartData.length > 0 ? (
              <PieChart
                data={pieChartData}
                title="Desglose por Categoría"
                colors={[colors.error, colors.warning, colors.primary, colors.success]}
              />
            ) : (
              <View className="glass-card rounded-2xl p-8 items-center justify-center h-[250px]">
                <Text className="text-muted" style={{ color: '#A1A1AA' }}>Sin datos de gastos</Text>
              </View>
            )}
          </View>
        </View>

        <View className="px-6 mb-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-foreground" style={{ color: '#FAFAFA' }}>Metas de Ahorro</Text>
            <Pressable onPress={() => setShowGoalModal(true)}>
              <Text className="text-sm font-semibold text-primary">+ Nueva meta</Text>
            </Pressable>
          </View>

          {savingsGoals && savingsGoals.length > 0 ? (
            <View className="flex-row flex-wrap gap-4">
              {savingsGoals.map((goal) => {
                const pct = goal.target_amount > 0
                  ? Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100))
                  : 0;
                return (
                  <View key={goal.id} className="flex-1 glass-card rounded-2xl p-5" style={{ minWidth: 140 }}>
                    <View className="flex-row justify-between items-center mb-1">
                      <Text className="text-sm font-bold text-foreground flex-1 mr-2" style={{ color: '#FAFAFA' }} numberOfLines={1}>{goal.name}</Text>
                      <Pressable onPress={() =>
                        Alert.alert('Eliminar meta', `¿Eliminar "${goal.name}"?`, [
                          { text: 'Cancelar', style: 'cancel' },
                          { text: 'Eliminar', style: 'destructive', onPress: () => deleteSavingsGoal.mutate(goal.id) },
                        ])
                      }>
                        <Text className="text-muted text-xs" style={{ color: '#A1A1AA' }}>✕</Text>
                      </Pressable>
                    </View>
                    <Text className="text-[10px] font-bold text-primary mb-3">{pct}%</Text>
                    <View className="h-1.5 w-full bg-border rounded-full overflow-hidden mb-2">
                      <View
                        style={{
                          height: '100%',
                          width: `${pct}%`,
                          backgroundColor: (colors[goal.color as keyof typeof colors] as string) || colors.primary,
                          borderRadius: 999,
                        }}
                      />
                    </View>
                    <Text className="text-[10px] text-muted" style={{ color: '#A1A1AA' }}>${goal.current_amount} de ${goal.target_amount}</Text>
                    <Pressable
                      className="mt-2 bg-surface rounded-lg py-1 items-center"
                      onPress={() => setUpdateGoalTarget(goal)}
                    >
                      <Text className="text-[10px] text-primary font-semibold">Actualizar</Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ) : (
            <Pressable
              onPress={() => setShowGoalModal(true)}
              className="bg-surface border border-dashed border-border rounded-2xl p-6 items-center"
            >
              <Text className="text-muted text-sm mb-1" style={{ color: '#A1A1AA' }}>No tienes metas de ahorro</Text>
              <Text className="text-primary text-sm font-semibold">+ Crear primera meta</Text>
            </Pressable>
          )}
        </View>

        {/* Recent Transactions */}
        <View className="px-6 flex-row flex-wrap -mx-2 items-start mb-4">
          <View className="w-full lg:w-2/3 px-2 mb-8">
            <Text className="text-xl font-bold text-foreground mb-4" style={{ color: '#FAFAFA' }}>Registro Histórico</Text>
            <View className="gap-3">
              {transactions && transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <TransactionCard
                    key={transaction.id}
                    amount={transaction.amount}
                    category={transaction.category || 'Sin categoría'}
                    description={transaction.note}
                    date={transaction.date}
                    type={transaction.type}
                    onEdit={() => setEditTarget(transaction)}
                    onDelete={() => deleteTransaction.mutate(transaction.id as any)}
                  />
                ))
              ) : (
                <View className="bg-surface rounded-lg p-8 items-center border border-border border-dashed">
                  <Text className="text-muted" style={{ color: '#A1A1AA' }}>No hay transacciones registradas</Text>
                </View>
              )}
              {/* Botón MÁS al final del histórico (NUEVO) */}
              <Pressable
                onPress={() => setShowAddModal(true)}
                className="bg-surface border border-border border-dashed rounded-2xl p-4 items-center justify-center active:bg-primary/5 mt-2"
              >
                <Text className="text-primary font-bold uppercase text-[10px]"> + Añadir otro Registro</Text>
              </Pressable>
            </View>
          </View>

          <View className="w-full lg:w-1/3 px-2">
            <View className="glass-card rounded-2xl p-6 mb-6">
              <Text className="font-bold text-foreground mb-1" style={{ color: '#FAFAFA' }}>Balance del Período</Text>
              {(() => {
                const income = summary?.income || 0;
                const expenses = summary?.expenses || 0;
                const spentPct = income > 0 ? Math.min(100, Math.round((expenses / income) * 100)) : 0;
                const barColor = spentPct >= 90 ? colors.error : spentPct >= 70 ? colors.warning : colors.success;
                return (
                  <>
                    <Text className="text-xs text-muted mb-3">
                      {income > 0 ? `Gastos: ${spentPct}% de tus ingresos` : 'Sin ingresos registrados'}
                    </Text>
                    <View className="h-2 w-full bg-border rounded-full overflow-hidden mb-2">
                      <View style={{ height: '100%', width: `${spentPct}%`, backgroundColor: barColor, borderRadius: 999 }} />
                    </View>
                    <Text className="text-xs text-muted font-medium">
                      {spentPct >= 90 ? '⚠️ Gastos altos este período.' : spentPct >= 70 ? 'Moderado. Cuida los gastos.' : '✅ Buen control financiero.'}
                    </Text>
                  </>
                );
              })()}
            </View>

            <View className="bg-primary/5 rounded-2xl p-6 border border-primary/20 border-dashed">
              <View className="flex-row items-center gap-2 mb-3">
                <Text className="text-lg">💡</Text>
                <Text className="font-bold text-primary">Insight del Período</Text>
              </View>
              <Text className="text-sm text-foreground/90 leading-relaxed" style={{ color: '#E4E4E7' }}>
                {(() => {
                  const income = summary?.income || 0;
                  const expenses = summary?.expenses || 0;
                  const balance = income - expenses;
                  if (income === 0) return 'Registra tus ingresos para ver tu análisis financiero personalizado.';
                  if (balance > 0) return `Tienes un superávit de $${balance.toFixed(0)}. ¡Asígnalo a tus metas de ahorro!`;
                  return `Tus gastos superan tus ingresos por $${Math.abs(balance).toFixed(0)}. Revisa las categorías más costosas.`;
                })()}
              </Text>
            </View>
          </View>
        </View>
        {/* Add Transaction Button */}
        <View className="px-6 mb-8">
          <Pressable onPress={() => setShowAddModal(true)} className="bg-primary rounded-lg p-4 items-center">
            <Text className="text-background font-semibold" style={{ color: '#FAFAFA' }}>+ Agregar Transacción</Text>
          </Pressable>
        </View>

        {user && (
          <AddTransactionModal
            visible={showAddModal}
            onClose={() => setShowAddModal(false)}
            userId={String(user.id)}
            initialType={modalType}
          />
        )}
        {user && (
          <AddSavingsGoalModal
            visible={showGoalModal}
            onClose={() => setShowGoalModal(false)}
            userId={String(user.id)}
          />
        )}
        <UpdateGoalModal
          visible={!!updateGoalTarget}
          onClose={() => setUpdateGoalTarget(null)}
          goal={updateGoalTarget}
          onUpdate={(id, amount) => updateSavingsGoal.mutate({ id, current_amount: amount })}
        />
        <EditTransactionModal
          visible={!!editTarget}
          onClose={() => setEditTarget(null)}
          transaction={editTarget}
          onSave={(data) => updateTransaction.mutate(data)}
        />
      </ScrollView>
    </ScreenContainer>
  );
}
