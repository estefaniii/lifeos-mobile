import React, { useState } from 'react';
import { ScrollView, Text, View, Pressable, RefreshControl, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, type StyleProp, type ViewStyle } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { Titulo, Sticker, TINTA } from '@/components/decor';
import { TransactionCard } from '@/components/transaction-card';
import { AddTransactionModal } from '@/components/modals/add-transaction-modal';
import { AddSavingsGoalModal } from '@/components/modals/add-savings-goal-modal';
import { useFinancialSummary, useTransactions, useExpensesByCategory, useDeleteTransaction, useUpdateTransaction } from '@/hooks/use-transactions';
import { useSavingsGoals, useDeleteSavingsGoal, useUpdateSavingsGoal } from '@/hooks/use-savings-goals';
import { useBudgetProgress, useCreateBudget, useDeleteBudget } from '@/hooks/use-budgets';
import { useRecurringTransactions, useCreateRecurring, useDeleteRecurring, useApplyRecurring } from '@/hooks/use-recurring';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';

// Finanzas: balance del período, en qué se va el dinero, metas, presupuestos,
// movimientos fijos y el registro. Un solo acento (menta) para las acciones.
const MENTA = '#5FD3A8';
const CORAL = '#FF7A6B';
const AMBAR = '#FFB547';
const ALTO = '#2A2521'; // superficie elevada: chips, iconos y campos dentro de tarjetas

// Las metas guardan una clave de color; aquí se traduce a la paleta cálida
const COLOR_META: Record<string, string> = { primary: MENTA, success: '#A8D672', warning: AMBAR, accent: '#C9A2FF' };

const PERIODOS = [['day', 'Hoy'], ['week', 'Semana'], ['month', 'Mes'], ['year', 'Año']] as const;
type Periodo = (typeof PERIODOS)[number][0];

const monto = (n: number | null | undefined) =>
  `$${Math.abs(Number(n) || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

const tarjeta: ViewStyle = { backgroundColor: TINTA.tarjeta, borderRadius: 26, borderWidth: 1, borderColor: TINTA.borde, padding: 18 };
const campo: ViewStyle = { backgroundColor: ALTO, borderRadius: 16, borderWidth: 1, borderColor: TINTA.borde, paddingHorizontal: 16, minHeight: 52, justifyContent: 'center' };
const webSinBorde = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null;

/* ---------- Piezas pequeñas de esta pantalla ---------- */

function Etiqueta({ children }: { children: React.ReactNode }) {
  return <Text style={{ color: TINTA.suave, fontSize: 14, marginBottom: 8, marginTop: 4 }}>{children}</Text>;
}

function Boton({ texto, onPress, tipo = 'principal', style, disabled }: {
  texto: string; onPress: () => void; tipo?: 'principal' | 'secundario'; style?: StyleProp<ViewStyle>; disabled?: boolean;
}) {
  const principal = tipo === 'principal';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [{
        minHeight: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16,
        backgroundColor: principal ? MENTA : 'transparent', borderWidth: 1, borderColor: principal ? MENTA : TINTA.borde,
        opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
      }, style]}
    >
      <Text style={{ color: principal ? TINTA.fondo : TINTA.texto, fontWeight: '800', fontSize: 15 }}>{texto}</Text>
    </Pressable>
  );
}

// Botón de texto para la derecha de un encabezado de sección
function Enlace({ texto, onPress }: { texto: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={{ minHeight: 44, paddingHorizontal: 12, justifyContent: 'center', marginRight: -12 }}>
      <Text style={{ color: MENTA, fontSize: 15, fontWeight: '700' }}>{texto}</Text>
    </Pressable>
  );
}

function Seccion({ titulo, accion, children }: { titulo: string; accion?: React.ReactNode; children: React.ReactNode }) {
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Titulo size={22} style={{ flexShrink: 1 }}>{titulo}</Titulo>
        {accion}
      </View>
      {children}
    </View>
  );
}

// Estado vacío: una tarjeta punteada que también sirve de botón
function Vacio({ texto, accion, onPress }: { texto: string; accion: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button"
      style={({ pressed }) => ({ ...tarjeta, borderStyle: 'dashed', alignItems: 'center', gap: 4, paddingVertical: 22, opacity: pressed ? 0.85 : 1 })}>
      <Text style={{ color: TINTA.suave, fontSize: 14 }}>{texto}</Text>
      <Text style={{ color: MENTA, fontSize: 15, fontWeight: '700' }}>{accion}</Text>
    </Pressable>
  );
}

// La × de borrar: visualmente pequeña, pero con 44 px de área
function Quitar({ onPress, etiqueta }: { onPress: () => void; etiqueta: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={etiqueta}
      style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -10 }}>
      <Text style={{ color: TINTA.suave, fontSize: 16 }}>✕</Text>
    </Pressable>
  );
}

function Barra({ pct, color, alto = 8 }: { pct: number; color: string; alto?: number }) {
  return (
    <View style={{ height: alto, backgroundColor: ALTO, borderRadius: 99, overflow: 'hidden' }}>
      <View style={{ height: '100%', width: `${Math.max(0, Math.min(100, pct))}%`, backgroundColor: color, borderRadius: 99 }} />
    </View>
  );
}

function Interruptor({ opciones, valor, onCambio }: {
  opciones: readonly { valor: string; texto: string; color: string }[]; valor: string; onCambio: (v: string) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', backgroundColor: TINTA.fondo, borderRadius: 18, padding: 4, borderWidth: 1, borderColor: TINTA.borde, marginBottom: 12 }}>
      {opciones.map((o) => {
        const activo = valor === o.valor;
        return (
          <Pressable key={o.valor} onPress={() => onCambio(o.valor)} accessibilityRole="tab" accessibilityState={{ selected: activo }}
            style={{ flex: 1, minHeight: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: activo ? o.color : 'transparent' }}>
            <Text style={{ color: activo ? TINTA.fondo : TINTA.texto, fontWeight: '800', fontSize: 14 }}>{o.texto}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const TIPOS = [{ valor: 'expense', texto: 'Gasto', color: CORAL }, { valor: 'income', texto: 'Ingreso', color: MENTA }] as const;

function Chips({ opciones, valor, onCambio }: { opciones: { name: string; icon?: string }[]; valor: string; onCambio: (v: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
      {opciones.map((c) => {
        const activo = valor === c.name;
        return (
          <Pressable key={c.name} onPress={() => onCambio(c.name)} accessibilityRole="button" accessibilityState={{ selected: activo }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 14, borderRadius: 99, backgroundColor: activo ? MENTA : ALTO, borderWidth: 1, borderColor: activo ? MENTA : TINTA.borde }}>
            {!!c.icon && <Text style={{ fontSize: 15 }}>{c.icon}</Text>}
            <Text style={{ color: activo ? TINTA.fondo : TINTA.texto, fontSize: 14, fontWeight: '700' }}>{c.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function CampoDinero({ value, onChangeText, placeholder = '0', grande }: { value: string; onChangeText: (v: string) => void; placeholder?: string; grande?: boolean }) {
  return (
    <View style={[campo, { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', marginBottom: 12 }]}>
      <Text style={{ color: TINTA.suave, fontWeight: '700', fontSize: grande ? 22 : 18, marginRight: 6 }}>$</Text>
      <TextInput
        style={[{ flex: 1, color: TINTA.texto, fontSize: grande ? 22 : 18, paddingVertical: 12, fontWeight: '700' }, webSinBorde]}
        keyboardType="decimal-pad" value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={TINTA.suave}
      />
    </View>
  );
}

// Hoja inferior compartida por los formularios de esta pantalla
function Hoja({ visible, titulo, sub, onClose, children }: { visible: boolean; titulo: string; sub?: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flex: 1, backgroundColor: 'rgba(8,6,5,0.72)', justifyContent: 'flex-end' }}>
          <View style={{ maxHeight: '92%', width: '100%', maxWidth: 640, alignSelf: 'center', backgroundColor: TINTA.tarjeta, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderBottomWidth: 0, borderColor: TINTA.borde, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 }}>
            <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: TINTA.borde, marginBottom: 14 }} />
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
              <View style={{ flex: 1 }}>
                <Titulo size={24}>{titulo}</Titulo>
                {!!sub && <Text style={{ color: TINTA.suave, fontSize: 14, marginTop: 4 }}>{sub}</Text>}
              </View>
              <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Cerrar"
                style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: ALTO, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: TINTA.suave, fontSize: 18 }}>✕</Text>
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">{children}</ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Acciones({ onCancelar, onGuardar, texto }: { onCancelar: () => void; onGuardar: () => void; texto: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
      <Boton texto="Cancelar" tipo="secundario" onPress={onCancelar} style={{ flex: 1 }} />
      <Boton texto={texto} onPress={onGuardar} style={{ flex: 2 }} />
    </View>
  );
}

/* ---------- Formularios ---------- */

function UpdateGoalModal({ visible, onClose, goal, onUpdate }: {
  visible: boolean;
  onClose: () => void;
  goal: { id: any; name: string; current_amount: number; target_amount: number } | null;
  onUpdate: (id: any, amount: number) => void;
}) {
  const [value, setValue] = useState('');
  if (!goal) return null;
  return (
    <Hoja visible={visible} onClose={onClose} titulo="Actualizar meta" sub={`${goal.name} · meta de ${monto(goal.target_amount)}`}>
      <Etiqueta>Lo que llevas ahorrado</Etiqueta>
      <CampoDinero value={value} onChangeText={setValue} placeholder={String(goal.current_amount)} grande />
      <Acciones
        texto="Guardar progreso"
        onCancelar={onClose}
        onGuardar={() => {
          const n = parseFloat(value);
          if (!isNaN(n)) { onUpdate(goal.id, n); onClose(); setValue(''); }
        }}
      />
    </Hoja>
  );
}

const CAT_INGRESO = [
  { name: 'Sueldo', icon: '💼' },
  { name: 'Emprendimientos', icon: '🚀' },
  { name: 'Dropshipping', icon: '📦' },
  { name: 'Servicios Creativos', icon: '🎨' },
  { name: 'Freelance', icon: '💻' },
  { name: 'Inversiones', icon: '📈' },
  { name: 'Otros', icon: '📌' },
];
const CAT_GASTO = [
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
  const categories = type === 'income' ? CAT_INGRESO : CAT_GASTO;

  return (
    <Hoja visible={visible} onClose={onClose} titulo="Editar movimiento">
      <Interruptor opciones={TIPOS} valor={type} onCambio={(v) => setType(v as 'income' | 'expense')} />

      <Etiqueta>Monto</Etiqueta>
      <CampoDinero value={amount} onChangeText={setAmount} />

      <Etiqueta>Descripción</Etiqueta>
      <TextInput
        style={[campo, { color: TINTA.texto, fontSize: 15, marginBottom: 12 }, webSinBorde]}
        value={note} onChangeText={setNote} placeholder="Descripción" placeholderTextColor={TINTA.suave}
      />

      <Etiqueta>Categoría</Etiqueta>
      <Chips opciones={categories} valor={category} onCambio={setCategory} />

      <Acciones
        texto="Guardar cambios"
        onCancelar={onClose}
        onGuardar={() => {
          const n = parseFloat(amount);
          if (!isNaN(n) && n > 0) {
            onSave({ id: transaction.id, amount: n, note, category, type });
            onClose();
          }
        }}
      />
    </Hoja>
  );
}

/* ---------- Pantalla ---------- */

export default function FinancesScreen() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [period, setPeriod] = useState<Periodo>('month');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'expense'>('expense');
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [updateGoalTarget, setUpdateGoalTarget] = useState<any>(null);

  // Datos
  const { data: summary } = useFinancialSummary(period);
  const { data: transactions } = useTransactions(period);
  const { data: expensesByCategory } = useExpensesByCategory(period);
  const { data: savingsGoals } = useSavingsGoals();
  const deleteTransaction = useDeleteTransaction();
  const updateTransaction = useUpdateTransaction();
  const deleteSavingsGoal = useDeleteSavingsGoal();
  const updateSavingsGoal = useUpdateSavingsGoal();
  const [editTarget, setEditTarget] = useState<any>(null);

  // Presupuestos y recurrentes
  const { data: budgetProgress } = useBudgetProgress();
  const createBudget = useCreateBudget();
  const deleteBudget = useDeleteBudget();
  const { data: recurringTxns } = useRecurringTransactions();
  const createRecurring = useCreateRecurring();
  const deleteRecurring = useDeleteRecurring();
  useApplyRecurring(); // aplica los recurrentes al abrir

  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetCategory, setBudgetCategory] = useState('');
  const [budgetLimit, setBudgetLimit] = useState('');
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [recurringType, setRecurringType] = useState<'income' | 'expense'>('expense');
  const [recurringAmount, setRecurringAmount] = useState('');
  const [recurringCategory, setRecurringCategory] = useState('');
  const [recurringNote, setRecurringNote] = useState('');
  const [recurringDay, setRecurringDay] = useState('1');

  const income = summary?.income || 0;
  const expenses = summary?.expenses || 0;
  const balance = summary?.balance || 0;
  const spentPct = income > 0 ? Math.min(100, Math.round((expenses / income) * 100)) : 0;
  const colorGasto = spentPct >= 90 ? CORAL : spentPct >= 70 ? AMBAR : MENTA;
  const maxBarra = Math.max(income, expenses, 1);

  const porCategoria = [...(expensesByCategory || [])].sort((a, b) => b.amount - a.amount);
  const totalCategorias = porCategoria.reduce((s, c) => s + c.amount, 0) || 1;

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

  const cerrarPresupuesto = () => { setShowBudgetModal(false); setBudgetCategory(''); setBudgetLimit(''); };
  const editarPresupuesto = (categoria: string, limite: number) => {
    setBudgetCategory(categoria); setBudgetLimit(String(limite)); setShowBudgetModal(true);
  };
  const presupuestoExiste = (budgetProgress ?? []).some((b) => b.category.trim().toLowerCase() === budgetCategory.trim().toLowerCase());
  // Los que pasan del 80 % este mes, el más pasado primero
  const avisosPresupuesto = (budgetProgress ?? []).filter((b) => b.percentage >= 80).sort((a, b) => b.percentage - a.percentage);
  const cerrarRecurrente = () => { setShowRecurringModal(false); setRecurringAmount(''); setRecurringNote(''); setRecurringCategory(''); };

  const insight = income === 0
    ? 'Registra tus ingresos para ver cómo va el período.'
    : balance > 0
      ? `Te sobran ${monto(income - expenses)}. Puedes pasarlos a una meta de ahorro.`
      : `Gastaste ${monto(expenses - income)} más de lo que entró. Mira abajo en qué se fue.`;

  return (
    <ScreenContainer className="p-0" containerClassName="bg-[#110F0D]">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 150 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={MENTA} />}
      >
        <View style={{ paddingHorizontal: 20, paddingTop: 24, maxWidth: 640, width: '100%', alignSelf: 'center', gap: 28 }}>
          {/* Cabecera: deja libre la esquina del botón de menú */}
          <View style={{ paddingRight: 110, gap: 6 }}>
            <Titulo>Finanzas</Titulo>
            <Text style={{ color: TINTA.suave, fontSize: 15 }}>Lo que entra, lo que sale y lo que guardas.</Text>
          </View>

          {/* Aviso de presupuestos: ámbar desde el 80 %, coral al pasarse */}
          {avisosPresupuesto.length > 0 && (
            <View style={{ gap: 8, marginBottom: -12 }} accessibilityRole="alert">
              {avisosPresupuesto.map((b) => {
                const pasado = b.percentage >= 100;
                const color = pasado ? CORAL : AMBAR;
                return (
                  <View key={b.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, borderWidth: 1.5,
                    borderColor: color, backgroundColor: pasado ? 'rgba(255,122,107,0.12)' : 'rgba(255,181,71,0.10)', paddingHorizontal: 16, paddingVertical: 12 }}>
                    <Text style={{ fontSize: 18 }}>{pasado ? '🚨' : '⚠️'}</Text>
                    <Text style={{ color: TINTA.texto, fontSize: 14.5, fontWeight: '700', flex: 1 }}>
                      {pasado
                        ? `Te pasaste en ${b.category}: llevas el ${b.percentage} % este mes`
                        : `Llevas el ${b.percentage} % de ${b.category} este mes`}
                    </Text>
                    <Text style={{ color, fontSize: 13, fontWeight: '800' }}>{monto(b.limit_amount - b.spent)}{pasado ? ' de más' : ' libres'}</Text>
                  </View>
                );
              })}
            </View>
          )}

          <View style={{ gap: 16 }}>
            {/* Período */}
            <View style={{ flexDirection: 'row', backgroundColor: TINTA.tarjeta, borderRadius: 22, padding: 4, borderWidth: 1, borderColor: TINTA.borde }}>
              {PERIODOS.map(([p, nombre]) => (
                <Pressable key={p} onPress={() => setPeriod(p)} accessibilityRole="tab" accessibilityState={{ selected: period === p }}
                  style={{ flex: 1, minHeight: 44, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: period === p ? TINTA.texto : 'transparent' }}>
                  <Text style={{ color: period === p ? TINTA.fondo : TINTA.suave, fontWeight: '800', fontSize: 14 }}>{nombre}</Text>
                </Pressable>
              ))}
            </View>

            {/* Balance: la tarjeta principal, con su sticker */}
            <View style={{ ...tarjeta, borderRadius: 28, padding: 22, marginTop: 10 }}>
              <Sticker
                texto={balance >= 0 ? 'a favor' : 'en rojo'}
                color={balance >= 0 ? MENTA : CORAL}
                giro={balance >= 0 ? 6 : -6}
                style={{ position: 'absolute', top: -14, right: 20 }}
              />
              <Text style={{ color: TINTA.suave, fontSize: 14 }}>Balance del período</Text>
              <Titulo size={46} color={balance < 0 ? CORAL : TINTA.texto} style={{ marginTop: 6 }}>
                {balance < 0 ? '−' : ''}{monto(balance)}
              </Titulo>

              <View style={{ flexDirection: 'row', marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderColor: TINTA.borde }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: TINTA.suave, fontSize: 14 }}>Entró</Text>
                  <Text style={{ color: MENTA, fontSize: 20, fontWeight: '800', marginTop: 2 }}>+{monto(income)}</Text>
                </View>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Text style={{ color: TINTA.suave, fontSize: 14 }}>Salió</Text>
                  <Text style={{ color: CORAL, fontSize: 20, fontWeight: '800', marginTop: 2 }}>−{monto(expenses)}</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                <Boton texto="＋ Gasto" onPress={() => openModal('expense')} style={{ flex: 1.4 }} />
                <Boton texto="＋ Ingreso" tipo="secundario" onPress={() => openModal('income')} style={{ flex: 1 }} />
              </View>
            </View>
          </View>

          {/* Cómo va el período */}
          <Seccion titulo="Cómo vas">
            <View style={{ ...tarjeta, gap: 12 }}>
              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                  <Text style={{ color: TINTA.suave, fontSize: 14 }}>Entró</Text>
                  <Text style={{ color: TINTA.texto, fontSize: 14, fontWeight: '700' }}>{monto(income)}</Text>
                </View>
                <Barra pct={(income / maxBarra) * 100} color={MENTA} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 4 }}>
                  <Text style={{ color: TINTA.suave, fontSize: 14 }}>Salió</Text>
                  <Text style={{ color: TINTA.texto, fontSize: 14, fontWeight: '700' }}>{monto(expenses)}</Text>
                </View>
                <Barra pct={(expenses / maxBarra) * 100} color={CORAL} />
              </View>

              <View style={{ borderTopWidth: 1, borderColor: TINTA.borde, paddingTop: 14, gap: 6 }}>
                <Text style={{ color: TINTA.texto, fontSize: 16, fontWeight: '800' }}>
                  {income > 0 ? `Gastaste el ${spentPct}% de lo que entró` : 'Sin ingresos registrados'}
                </Text>
                {income > 0 && (
                  <Text style={{ color: colorGasto, fontSize: 14, fontWeight: '700' }}>
                    {spentPct >= 90 ? 'Gastos altos este período.' : spentPct >= 70 ? 'Moderado: cuida los gastos.' : 'Buen control.'}
                  </Text>
                )}
                <Text style={{ color: TINTA.suave, fontSize: 14, lineHeight: 20 }}>{insight}</Text>
              </View>
            </View>
          </Seccion>

          {/* En qué se va */}
          <Seccion titulo="En qué se va">
            {porCategoria.length > 0 ? (
              <View style={{ ...tarjeta, gap: 14 }}>
                {porCategoria.map((c) => {
                  const pct = Math.round((c.amount / totalCategorias) * 100);
                  return (
                    <View key={c.name} style={{ gap: 6 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                        <Text style={{ color: TINTA.texto, fontSize: 15, fontWeight: '700', flexShrink: 1 }} numberOfLines={1}>{c.name}</Text>
                        <Text style={{ color: TINTA.suave, fontSize: 14 }}>{monto(c.amount)} · {pct}%</Text>
                      </View>
                      <Barra pct={pct} color={CORAL} alto={6} />
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={{ ...tarjeta, alignItems: 'center', paddingVertical: 22 }}>
                <Text style={{ color: TINTA.suave, fontSize: 14 }}>Sin gastos en este período</Text>
              </View>
            )}
          </Seccion>

          {/* Metas de ahorro */}
          <Seccion titulo="Metas de ahorro" accion={<Enlace texto="Nueva meta" onPress={() => setShowGoalModal(true)} />}>
            {savingsGoals && savingsGoals.length > 0 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {savingsGoals.map((goal) => {
                  const pct = goal.target_amount > 0
                    ? Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100))
                    : 0;
                  const color = COLOR_META[goal.color as string] || MENTA;
                  return (
                    <View key={goal.id} style={{ ...tarjeta, flexGrow: 1, flexBasis: 150, gap: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: -10 }}>
                        <Text style={{ color: TINTA.texto, fontSize: 16, fontWeight: '800', flex: 1, marginRight: 4 }} numberOfLines={1}>{goal.name}</Text>
                        <Quitar
                          etiqueta={`Eliminar ${goal.name}`}
                          onPress={() =>
                            Alert.alert('Eliminar meta', `¿Eliminar "${goal.name}"?`, [
                              { text: 'Cancelar', style: 'cancel' },
                              { text: 'Eliminar', style: 'destructive', onPress: () => deleteSavingsGoal.mutate(goal.id) },
                            ])
                          }
                        />
                      </View>
                      <Titulo size={28} color={color}>{pct}%</Titulo>
                      <Barra pct={pct} color={color} />
                      <Text style={{ color: TINTA.suave, fontSize: 14 }}>{monto(goal.current_amount)} de {monto(goal.target_amount)}</Text>
                      <Pressable onPress={() => setUpdateGoalTarget(goal)} accessibilityRole="button"
                        style={({ pressed }) => ({ minHeight: 44, borderRadius: 16, backgroundColor: ALTO, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.85 : 1 })}>
                        <Text style={{ color: TINTA.texto, fontSize: 14, fontWeight: '700' }}>Actualizar</Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Vacio texto="No tienes metas de ahorro" accion="Crear la primera" onPress={() => setShowGoalModal(true)} />
            )}
          </Seccion>

          {/* Presupuestos */}
          <Seccion titulo="Presupuestos" accion={<Enlace texto="Nuevo" onPress={() => setShowBudgetModal(true)} />}>
            {budgetProgress && budgetProgress.length > 0 ? (
              <View style={{ gap: 10 }}>
                {budgetProgress.map((b) => {
                  const isOver = b.percentage >= 100;
                  const isWarning = b.percentage >= 80 && !isOver;
                  const barColor = isOver ? CORAL : isWarning ? AMBAR : MENTA;
                  return (
                    <Pressable key={b.id} onPress={() => editarPresupuesto(b.category, b.limit_amount)} accessibilityRole="button"
                      accessibilityLabel={`${b.category}: ${b.percentage} % del presupuesto del mes. Toca para cambiar el límite`}
                      style={({ pressed }) => ({ ...tarjeta, borderRadius: 24, paddingVertical: 12, gap: 8, opacity: pressed ? 0.85 : 1,
                        borderColor: isOver ? 'rgba(255,122,107,0.45)' : TINTA.borde })}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <Text style={{ color: TINTA.texto, fontWeight: '800', fontSize: 15, flex: 1 }} numberOfLines={1}>{b.category}</Text>
                        <Text style={{ color: isOver ? CORAL : TINTA.suave, fontSize: 14, fontWeight: '600' }}>
                          {monto(b.spent)} / {monto(b.limit_amount)}
                        </Text>
                        <Quitar etiqueta={`Eliminar presupuesto de ${b.category}`} onPress={() => deleteBudget.mutate(b.id)} />
                      </View>
                      <Barra pct={b.percentage} color={barColor} />
                      <Text style={{ color: TINTA.suave, fontSize: 12.5 }}>{b.percentage} % del mes</Text>
                      {isOver && (
                        <Text style={{ color: CORAL, fontSize: 13, fontWeight: '700' }}>Te pasaste por {monto(b.spent - b.limit_amount)}</Text>
                      )}
                      {isWarning && (
                        <Text style={{ color: AMBAR, fontSize: 13, fontWeight: '700' }}>Te quedan {monto(b.limit_amount - b.spent)} este mes</Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <Vacio texto="Sin presupuestos todavía" accion="Crear presupuesto" onPress={() => setShowBudgetModal(true)} />
            )}
          </Seccion>

          {/* Recurrentes */}
          <Seccion titulo="Fijos del mes" accion={<Enlace texto="Nuevo" onPress={() => setShowRecurringModal(true)} />}>
            {recurringTxns && recurringTxns.length > 0 ? (
              <View style={{ ...tarjeta, paddingVertical: 6 }}>
                {recurringTxns.map((r: any, i: number) => (
                  <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: i ? 1 : 0, borderColor: TINTA.borde }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: TINTA.texto, fontWeight: '700', fontSize: 15 }} numberOfLines={1}>{r.note || r.category}</Text>
                      <Text style={{ color: TINTA.suave, fontSize: 13, marginTop: 2 }}>Día {r.day_of_month} de cada mes</Text>
                    </View>
                    <Text style={{ color: r.type === 'income' ? MENTA : CORAL, fontWeight: '800', fontSize: 15 }}>
                      {r.type === 'income' ? '+' : '−'}{monto(r.amount)}
                    </Text>
                    <Quitar etiqueta={`Eliminar ${r.note || r.category}`} onPress={() => deleteRecurring.mutate(r.id)} />
                  </View>
                ))}
              </View>
            ) : (
              <Vacio texto="Sin gastos ni ingresos fijos" accion="Agregar uno" onPress={() => setShowRecurringModal(true)} />
            )}
          </Seccion>

          {/* Registro */}
          <Seccion titulo="Registro" accion={<Enlace texto="Añadir" onPress={() => setShowAddModal(true)} />}>
            {transactions && transactions.length > 0 ? (
              <View style={{ gap: 10 }}>
                {transactions.map((transaction) => (
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
                ))}
              </View>
            ) : (
              <Vacio texto="No hay movimientos en este período" accion="Registrar uno" onPress={() => setShowAddModal(true)} />
            )}
          </Seccion>
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

        {/* Nuevo presupuesto */}
        <Hoja visible={showBudgetModal} onClose={cerrarPresupuesto}
          titulo={presupuestoExiste ? 'Cambiar presupuesto' : 'Nuevo presupuesto'}
          sub="Te aviso arriba cuando gastes el 80 % en el mes.">
          <Etiqueta>Categoría</Etiqueta>
          <Chips
            opciones={CAT_GASTO}
            valor={budgetCategory}
            onCambio={setBudgetCategory}
          />
          <Etiqueta>Límite mensual</Etiqueta>
          <CampoDinero value={budgetLimit} onChangeText={setBudgetLimit} grande />
          <Acciones
            texto="Guardar"
            onCancelar={cerrarPresupuesto}
            onGuardar={() => {
              const n = parseFloat(budgetLimit);
              if (budgetCategory && !isNaN(n) && n > 0 && user?.id) {
                createBudget.mutate({ user_id: String(user.id), category: budgetCategory, limit_amount: n },
                  { onError: () => Alert.alert('No se guardó el presupuesto', 'Revisa tu conexión y prueba otra vez.') });
                cerrarPresupuesto();
              }
            }}
          />
        </Hoja>

        {/* Nuevo recurrente */}
        <Hoja visible={showRecurringModal} onClose={cerrarRecurrente} titulo="Nuevo fijo" sub="Se registra solo cada mes, el día que elijas.">
          <Interruptor opciones={TIPOS} valor={recurringType} onCambio={(v) => setRecurringType(v as 'income' | 'expense')} />

          <Etiqueta>Monto</Etiqueta>
          <CampoDinero value={recurringAmount} onChangeText={setRecurringAmount} />

          <Etiqueta>Descripción</Etiqueta>
          <TextInput
            style={[campo, { color: TINTA.texto, fontSize: 15, marginBottom: 12 }, webSinBorde]}
            value={recurringNote} onChangeText={setRecurringNote} placeholder="Ej: Netflix, renta, sueldo" placeholderTextColor={TINTA.suave}
          />

          <Etiqueta>Categoría</Etiqueta>
          <Chips
            opciones={(recurringType === 'income'
              ? ['Sueldo', 'Freelance', 'Inversiones', 'Otros']
              : ['Suscripciones', 'Transporte', 'Comida', 'Salud', 'Universidad', 'Otros']
            ).map((name) => ({ name }))}
            valor={recurringCategory}
            onCambio={setRecurringCategory}
          />

          <Etiqueta>Día del mes</Etiqueta>
          <TextInput
            style={[campo, { color: TINTA.texto, fontSize: 16, fontWeight: '700', marginBottom: 12 }, webSinBorde]}
            keyboardType="number-pad" value={recurringDay} onChangeText={setRecurringDay} placeholder="1" placeholderTextColor={TINTA.suave}
          />

          <Acciones
            texto="Guardar"
            onCancelar={cerrarRecurrente}
            onGuardar={() => {
              const amt = parseFloat(recurringAmount);
              const day = parseInt(recurringDay) || 1;
              if (recurringCategory && !isNaN(amt) && amt > 0 && user?.id) {
                createRecurring.mutate({
                  user_id: String(user.id), type: recurringType, amount: amt,
                  category: recurringCategory, note: recurringNote, frequency: 'monthly', day_of_month: day,
                });
                cerrarRecurrente();
              }
            }}
          />
        </Hoja>
      </ScrollView>
    </ScreenContainer>
  );
}
