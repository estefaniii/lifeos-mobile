import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';

export interface MonthlyReport {
  month: string; // 'YYYY-MM'
  finances: {
    income: number;
    expenses: number;
    balance: number;
    topCategories: { name: string; amount: number }[];
    transactionCount: number;
  };
  health: {
    avgWater: number;
    gymDays: number;
    yogaDays: number;
    avgSleep: number;
    totalExerciseMin: number;
    daysTracked: number;
  };
  habits: {
    totalCompletions: number;
    uniqueDays: number;
    bestStreak: number;
    completionRate: number; // percentage
    activeHabits: number;
  };
  mental: {
    totalMeditation: number;
    avgMood: number;
    entriesCount: number;
  };
}

function getMonthRange(year: number, month: number) {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const end = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
  return { start, end };
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

async function fetchMonthData(userId: string, year: number, month: number): Promise<MonthlyReport> {
  const { start, end } = getMonthRange(year, month);
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;

  const [transRes, healthRes, habitLogsRes, habitsRes, mentalRes] = await Promise.all([
    supabase
      .from('transactions')
      .select('amount, type, category')
      .eq('user_id', userId)
      .gte('date', start)
      .lt('date', end),
    supabase
      .from('health_metrics')
      .select('water_ml, gym_session, yoga_session, sleep_minutes, exercise_minutes, date')
      .eq('user_id', userId)
      .gte('date', start)
      .lt('date', end),
    supabase
      .from('habit_logs')
      .select('habit_id, date, completed')
      .eq('user_id', userId)
      .eq('completed', true)
      .gte('date', start)
      .lt('date', end),
    supabase
      .from('habits')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true),
    supabase
      .from('mental_logs')
      .select('meditation_minutes, mood_score')
      .eq('user_id', userId)
      .gte('date', start)
      .lt('date', end),
  ]);

  const transactions = transRes.data || [];
  const health = healthRes.data || [];
  const habitLogs = habitLogsRes.data || [];
  const habits = habitsRes.data || [];
  const mental = mentalRes.data || [];

  // Finances
  const income = transactions.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + Math.abs(t.amount), 0);
  const expenses = transactions.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + Math.abs(t.amount), 0);
  const catMap: Record<string, number> = {};
  transactions.filter((t: any) => t.type === 'expense').forEach((t: any) => {
    const cat = t.category || 'Otros';
    catMap[cat] = (catMap[cat] || 0) + Math.abs(t.amount);
  });
  const topCategories = Object.entries(catMap)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // Health
  const daysTracked = health.length;
  const avgWater = daysTracked > 0 ? Math.round(health.reduce((s: number, h: any) => s + (h.water_ml || 0), 0) / daysTracked) : 0;
  const gymDays = health.filter((h: any) => h.gym_session).length;
  const yogaDays = health.filter((h: any) => h.yoga_session).length;
  const avgSleep = daysTracked > 0 ? Math.round(health.reduce((s: number, h: any) => s + (h.sleep_minutes || 0), 0) / daysTracked) : 0;
  const totalExerciseMin = health.reduce((s: number, h: any) => s + (h.exercise_minutes || 0), 0);

  // Habits
  const totalCompletions = habitLogs.length;
  const uniqueDays = new Set(habitLogs.map((l: any) => l.date)).size;
  const daysInMonth = getDaysInMonth(year, month);
  const activeHabits = habits.length;
  const maxPossible = activeHabits * daysInMonth;
  const completionRate = maxPossible > 0 ? Math.round((totalCompletions / maxPossible) * 100) : 0;

  // Best streak calculation
  const sortedDates = [...new Set(habitLogs.map((l: any) => l.date))].sort();
  let bestStreak = 0;
  let currentStreak = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]);
    const curr = new Date(sortedDates[i]);
    const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays === 1) {
      currentStreak++;
    } else {
      bestStreak = Math.max(bestStreak, currentStreak);
      currentStreak = 1;
    }
  }
  bestStreak = Math.max(bestStreak, currentStreak);
  if (sortedDates.length === 0) bestStreak = 0;

  // Mental
  const totalMeditation = mental.reduce((s: number, m: any) => s + (m.meditation_minutes || 0), 0);
  const moodEntries = mental.filter((m: any) => m.mood_score > 0);
  const avgMood = moodEntries.length > 0
    ? Math.round((moodEntries.reduce((s: number, m: any) => s + m.mood_score, 0) / moodEntries.length) * 10) / 10
    : 0;

  return {
    month: monthStr,
    finances: { income, expenses, balance: income - expenses, topCategories, transactionCount: transactions.length },
    health: { avgWater, gymDays, yogaDays, avgSleep, totalExerciseMin, daysTracked },
    habits: { totalCompletions, uniqueDays, bestStreak, completionRate, activeHabits },
    mental: { totalMeditation, avgMood, entriesCount: mental.length },
  };
}

export function useMonthlyReport(year?: number, month?: number) {
  const { user } = useAuth();
  const now = new Date();
  const y = year ?? now.getFullYear();
  const m = month ?? (now.getMonth() + 1);

  return useQuery({
    queryKey: ['monthly-report', user?.id, y, m],
    queryFn: () => fetchMonthData(user!.id, y, m),
    enabled: !!user?.id,
  });
}

export function useMonthlyComparison() {
  const { user } = useAuth();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  return useQuery({
    queryKey: ['monthly-comparison', user?.id, currentYear, currentMonth],
    queryFn: async () => {
      const [current, previous] = await Promise.all([
        fetchMonthData(user!.id, currentYear, currentMonth),
        fetchMonthData(user!.id, prevYear, prevMonth),
      ]);
      return { current, previous };
    },
    enabled: !!user?.id,
  });
}
