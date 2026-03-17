import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';

export interface TimelineEvent {
  id: string;
  time: string;
  type: 'income' | 'expense' | 'health' | 'habit' | 'mental' | 'productivity';
  icon: string;
  title: string;
  detail: string;
  color: string;
}

export function useDailyTimeline(date: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['daily-timeline', user?.id, date],
    queryFn: async (): Promise<TimelineEvent[]> => {
      if (!user?.id) return [];

      const [transRes, healthRes, habitLogsRes, habitsRes, mentalRes, prodRes] = await Promise.all([
        supabase.from('transactions').select('id, type, amount, category, note, created_at').eq('user_id', user.id).eq('date', date),
        supabase.from('health_metrics').select('*').eq('user_id', user.id).eq('date', date),
        supabase.from('habit_logs').select('id, habit_id, completed, created_at').eq('user_id', user.id).eq('date', date).eq('completed', true),
        supabase.from('habits').select('id, name, emoji').eq('user_id', user.id).eq('is_active', true),
        supabase.from('mental_logs').select('id, mood_score, meditation_minutes, journal_entry, created_at').eq('user_id', user.id).eq('date', date),
        supabase.from('productivity_logs').select('id, duration_minutes, note, project_id, created_at, projects(name)').eq('user_id', user.id).eq('date', date),
      ]);

      const events: TimelineEvent[] = [];
      const habitMap = new Map((habitsRes.data || []).map((h: any) => [h.id, h]));

      // Transactions
      (transRes.data || []).forEach((t: any) => {
        events.push({
          id: `t-${t.id}`,
          time: t.created_at ? new Date(t.created_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : '',
          type: t.type,
          icon: t.type === 'income' ? '💵' : '💸',
          title: t.type === 'income' ? 'Ingreso' : 'Gasto',
          detail: `$${Math.abs(t.amount).toLocaleString()} - ${t.category || 'Sin categoría'}${t.note ? ` (${t.note})` : ''}`,
          color: t.type === 'income' ? '#34d399' : '#f87171',
        });
      });

      // Health
      (healthRes.data || []).forEach((h: any) => {
        if (h.water_ml > 0) {
          events.push({
            id: `h-water-${h.id}`, time: '', type: 'health', icon: '💧',
            title: 'Hidratación', detail: `${h.water_ml} ml`, color: '#60a5fa',
          });
        }
        if (h.gym_session) {
          events.push({
            id: `h-gym-${h.id}`, time: '', type: 'health', icon: '💪',
            title: 'Gym', detail: 'Sesión completada', color: '#f59e0b',
          });
        }
        if (h.yoga_session) {
          events.push({
            id: `h-yoga-${h.id}`, time: '', type: 'health', icon: '🧘',
            title: 'Yoga', detail: 'Sesión completada', color: '#a78bfa',
          });
        }
        if (h.sleep_minutes > 0) {
          const hrs = Math.floor(h.sleep_minutes / 60);
          const mins = h.sleep_minutes % 60;
          events.push({
            id: `h-sleep-${h.id}`, time: '', type: 'health', icon: '😴',
            title: 'Sueño', detail: `${hrs}h ${mins}m`, color: '#818cf8',
          });
        }
        if (h.steps > 0) {
          events.push({
            id: `h-steps-${h.id}`, time: '', type: 'health', icon: '👣',
            title: 'Pasos', detail: `${h.steps.toLocaleString()} pasos`, color: '#34d399',
          });
        }
      });

      // Habits
      (habitLogsRes.data || []).forEach((log: any) => {
        const habit = habitMap.get(log.habit_id);
        events.push({
          id: `hab-${log.id}`,
          time: log.created_at ? new Date(log.created_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : '',
          type: 'habit', icon: habit?.emoji || '✅',
          title: habit?.name || 'Hábito',
          detail: 'Completado', color: '#14b8a6',
        });
      });

      // Mental
      (mentalRes.data || []).forEach((m: any) => {
        const parts: string[] = [];
        if (m.mood_score) parts.push(`Ánimo: ${m.mood_score}/5`);
        if (m.meditation_minutes) parts.push(`Meditación: ${m.meditation_minutes}min`);
        if (m.journal_entry) parts.push('Diario escrito');
        if (parts.length > 0) {
          events.push({
            id: `m-${m.id}`,
            time: m.created_at ? new Date(m.created_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : '',
            type: 'mental', icon: '🧠',
            title: 'Bienestar Mental', detail: parts.join(' · '), color: '#c084fc',
          });
        }
      });

      // Productivity
      (prodRes.data || []).forEach((p: any) => {
        events.push({
          id: `p-${p.id}`,
          time: p.created_at ? new Date(p.created_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : '',
          type: 'productivity', icon: '⏱️',
          title: (p as any).projects?.name || 'Focus',
          detail: `${p.duration_minutes} min${p.note ? ` - ${p.note}` : ''}`, color: '#fbbf24',
        });
      });

      // Sort by time (events with time first, then without)
      events.sort((a, b) => {
        if (a.time && b.time) return a.time.localeCompare(b.time);
        if (a.time) return -1;
        if (b.time) return 1;
        return 0;
      });

      return events;
    },
    enabled: !!user?.id,
  });
}
