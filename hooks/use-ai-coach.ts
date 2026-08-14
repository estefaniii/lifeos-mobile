import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { useQueryClient } from '@tanstack/react-query';

// ─── Offline fallback responses ─────────────────────────────────────────────

function getOfflineResponse(message: string, userName: string | null): { intent: 'none'; data: {}; ai_response: string } {
  const name = userName || 'reina';
  const lower = message.toLowerCase();

  // Simple keyword matching for offline mode
  if (lower.includes('hola') || lower.includes('hey') || lower.includes('buenos') || lower.includes('buenas')) {
    return { intent: 'none', data: {}, ai_response: `¡Hola ${name}! 💫 Estoy en modo offline ahora, pero recuerda: todo lo que deseas ya es tuyo. ¿Necesitas registrar algo? Puedes usar los botones del Home mientras tanto.` };
  }
  if (lower.includes('gracias') || lower.includes('thanks')) {
    return { intent: 'none', data: {}, ai_response: `¡De nada, ${name}! 🌟 Sigue brillando. El universo conspira a tu favor.` };
  }
  return { intent: 'none', data: {}, ai_response: `${name}, estoy en modo offline porque la API de IA no está disponible. 🔌\n\nPuedes:\n• Registrar gastos/ingresos desde el Home\n• Agregar agua, gym, yoga desde Registros Rápidos\n• Revisar tu progreso en cada módulo\n\n💡 Para activar el coach IA, verifica tu API key de OpenAI en las variables de entorno de Vercel.` };
}

async function callAICoach(message: string, userName: string | null, gender: string | null) {
  // Calls our serverless API route (which holds the OpenAI key on the server).
  // Falls back to offline mode on any network failure.
  try {
    const res = await fetch('/api/ai-coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, userName, gender }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.warn('[AI Coach] API error', res.status, errText.substring(0, 200));
      return getOfflineResponse(message, userName);
    }

    const parsed = await res.json();
    return {
      intent: (parsed?.intent || 'none') as 'transaction' | 'health' | 'water' | 'food' | 'none',
      data: parsed?.data || {},
      ai_response: parsed?.ai_response || 'Todo está fluyendo perfectamente.',
    };
  } catch (err) {
    console.warn('[AI Coach] Network error', err);
    return getOfflineResponse(message, userName);
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAICoach() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const processMessage = async (text: string) => {
    if (!user) return { success: false, error: 'No user authenticated' };
    setLoading(true);

    try {
      const nlpResult = await callAICoach(text, user.name ?? null, (user as any).gender ?? null);

      // Execute action based on detected intent
      let actionSummary = '';
      const today = new Date().toISOString().split('T')[0];
      const data = nlpResult.data as any;

      if (nlpResult.intent === 'transaction' && data.amount) {
        const { error } = await supabase.from('transactions').insert({
          user_id: user.id,
          type: data.type || 'expense',
          amount: data.type === 'income' ? data.amount : -(data.amount),
          category: data.category || 'otros',
          date: today,
          note: text,
        });
        if (error) throw error;
        actionSummary = `💰 ${data.type === 'income' ? 'Ingreso' : 'Gasto'} de $${data.amount} registrado.`;
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      } else if (nlpResult.intent === 'water' && data.amount) {
        const { data: current } = await supabase
          .from('health_metrics')
          .select('water_ml')
          .eq('user_id', user.id)
          .eq('date', today)
          .single();
        const newAmount = (current?.water_ml || 0) + (data.amount || 0);
        await supabase.from('health_metrics').upsert(
          { user_id: user.id, date: today, water_ml: newAmount },
          { onConflict: 'user_id,date' },
        );
        actionSummary = `💧 Agua: +${data.amount}ml (total: ${newAmount}ml).`;
        queryClient.invalidateQueries({ queryKey: ['today-health-metrics'] });
      } else if (nlpResult.intent === 'health') {
        if (data.activity === 'meditation') {
          await supabase.from('mental_logs').insert({
            user_id: user.id,
            meditation_minutes: data.duration || 0,
            date: today,
            note: text,
          });
          actionSummary = `🧘 Meditación: ${data.duration || 0} min registrados.`;
          queryClient.invalidateQueries({ queryKey: ['today-mind-wellness'] });
        } else if (data.activity) {
          const updateData: Record<string, boolean> = {};
          if (data.activity === 'gym') updateData.gym_session = true;
          if (data.activity === 'yoga') updateData.yoga_session = true;
          if (data.activity === 'massage') updateData.massage_session = true;
          await supabase.from('health_metrics').upsert(
            { user_id: user.id, date: today, ...updateData },
            { onConflict: 'user_id,date' },
          );
          actionSummary = `💪 Actividad (${data.activity}) registrada.`;
          queryClient.invalidateQueries({ queryKey: ['today-health-metrics'] });
        }
      } else if (nlpResult.intent === 'food' && data.item) {
        const { data: current } = await supabase
          .from('health_metrics')
          .select('calories, protein_g, carbs_g, fat_g')
          .eq('user_id', user.id)
          .eq('date', today)
          .single();
        await supabase.from('health_metrics').upsert(
          {
            user_id: user.id,
            date: today,
            calories: (current?.calories || 0) + (data.calories || 0),
            protein_g: (current?.protein_g || 0) + (data.protein || 0),
            carbs_g: (current?.carbs_g || 0) + (data.carbs || 0),
            fat_g: (current?.fat_g || 0) + (data.fat || 0),
            meals_tracked: true,
          },
          { onConflict: 'user_id,date' },
        );
        actionSummary = `🍎 Comida: ${data.item} registrada.`;
        queryClient.invalidateQueries({ queryKey: ['today-health-metrics'] });
      }

      return {
        success: true,
        aiResponse: nlpResult.ai_response,
        actionSummary,
      };
    } catch (error: any) {
      console.error('AI Coach Error:', error);
      return {
        success: true,
        aiResponse: `Hubo un error: ${error?.message?.substring(0, 150) || 'desconocido'}. Intenta de nuevo.`,
        actionSummary: '',
      };
    } finally {
      setLoading(false);
    }
  };

  return { processMessage, loading };
}
