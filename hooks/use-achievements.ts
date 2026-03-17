import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
}

export function useAchievements() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['achievements', user?.id],
    queryFn: async (): Promise<Achievement[]> => {
      if (!user?.id) return [];

      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

      // Fetch all data in parallel
      const [transRes, healthRes, habitsRes, habitLogsRes, goalsRes, mentalRes, chatRes] = await Promise.all([
        supabase.from('transactions').select('id, type, date').eq('user_id', user.id),
        supabase.from('health_metrics').select('water_ml, gym_session, yoga_session, date').eq('user_id', user.id),
        supabase.from('habits').select('id').eq('user_id', user.id).eq('is_active', true),
        supabase.from('habit_logs').select('id, date, completed').eq('user_id', user.id).eq('completed', true),
        supabase.from('savings_goals').select('id, current_amount, target_amount').eq('user_id', user.id),
        supabase.from('mental_logs').select('id, meditation_minutes').eq('user_id', user.id),
        supabase.from('chat_messages').select('id').eq('user_id', user.id).eq('sender', 'user').limit(1),
      ]);

      const transactions = transRes.data || [];
      const health = healthRes.data || [];
      const habits = habitsRes.data || [];
      const habitLogs = habitLogsRes.data || [];
      const goals = goalsRes.data || [];
      const mental = mentalRes.data || [];
      const chatMessages = chatRes.data || [];

      // Calculate metrics
      const totalTransactions = transactions.length;
      const incomeCount = transactions.filter((t: any) => t.type === 'income').length;
      const expenseCount = transactions.filter((t: any) => t.type === 'expense').length;

      const todayHealth = health.find((h: any) => h.date === today);
      const waterToday = todayHealth?.water_ml || 0;
      const gymDays = health.filter((h: any) => h.gym_session).length;
      const yogaDays = health.filter((h: any) => h.yoga_session).length;

      const totalHabitCompletions = habitLogs.length;
      const uniqueHabitDays = new Set(habitLogs.map((l: any) => l.date)).size;

      const completedGoals = goals.filter((g: any) => g.current_amount >= g.target_amount).length;

      const totalMeditation = mental.reduce((sum: number, m: any) => sum + (m.meditation_minutes || 0), 0);

      const hasUsedCoach = chatMessages.length > 0;

      // Define achievements
      const achievements: Achievement[] = [
        {
          id: 'first-transaction',
          icon: '💰',
          title: 'Primera Transacción',
          description: 'Registra tu primer ingreso o gasto',
          unlocked: totalTransactions >= 1,
        },
        {
          id: 'finance-pro',
          icon: '📊',
          title: 'Financiero Pro',
          description: 'Registra 50 transacciones',
          unlocked: totalTransactions >= 50,
        },
        {
          id: 'income-streak',
          icon: '🤑',
          title: 'Generador de Ingresos',
          description: 'Registra 10 ingresos',
          unlocked: incomeCount >= 10,
        },
        {
          id: 'hydration-hero',
          icon: '💧',
          title: 'Héroe de la Hidratación',
          description: 'Toma 2L de agua en un día',
          unlocked: waterToday >= 2000,
        },
        {
          id: 'gym-rat',
          icon: '💪',
          title: 'Rata de Gym',
          description: 'Ve al gym 10 días',
          unlocked: gymDays >= 10,
        },
        {
          id: 'yoga-master',
          icon: '🧘',
          title: 'Maestro Zen',
          description: 'Practica yoga 5 días',
          unlocked: yogaDays >= 5,
        },
        {
          id: 'habit-starter',
          icon: '🎯',
          title: 'Creador de Hábitos',
          description: 'Crea tu primer hábito',
          unlocked: habits.length >= 1,
        },
        {
          id: 'habit-streak-7',
          icon: '🔥',
          title: 'Racha de 7 Días',
          description: 'Completa hábitos 7 días seguidos',
          unlocked: uniqueHabitDays >= 7,
        },
        {
          id: 'habit-machine',
          icon: '⚡',
          title: 'Máquina de Hábitos',
          description: 'Completa 100 hábitos en total',
          unlocked: totalHabitCompletions >= 100,
        },
        {
          id: 'first-goal',
          icon: '🎯',
          title: 'Soñador',
          description: 'Crea tu primera meta de ahorro',
          unlocked: goals.length >= 1,
        },
        {
          id: 'goal-complete',
          icon: '🏆',
          title: 'Meta Cumplida',
          description: 'Completa una meta de ahorro',
          unlocked: completedGoals >= 1,
        },
        {
          id: 'meditation-start',
          icon: '🧘‍♀️',
          title: 'Mente Clara',
          description: 'Medita un total de 60 minutos',
          unlocked: totalMeditation >= 60,
        },
        {
          id: 'ai-coach-user',
          icon: '🤖',
          title: 'Coach Personal',
          description: 'Envía tu primer mensaje al AI Coach',
          unlocked: hasUsedCoach,
        },
        {
          id: 'expense-tracker',
          icon: '📝',
          title: 'Control de Gastos',
          description: 'Registra 30 gastos',
          unlocked: expenseCount >= 30,
        },
      ];

      return achievements;
    },
    enabled: !!user?.id,
  });
}
