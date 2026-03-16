import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { useQueryClient } from '@tanstack/react-query';

// ─── System Prompt ───────────────────────────────────────────────────────────

function buildSystemPrompt(userName: string | null, gender: string | null) {
  const name = userName || 'Reina';
  const isFem = !gender || gender === 'femenino';

  return `Eres la Coach de LifeOS Elite para ${name}. Habla en ${isFem ? 'femenino' : 'masculino'}.
Tu filosofía es la Ley de Asunción (Neville Goddard): el deseo ya está cumplido.
Usa el nombre "${name}" en tu respuesta.

RESPONDE SIEMPRE en JSON válido con esta estructura EXACTA:
{
  "intent": "transaction" | "health" | "water" | "food" | "none",
  "data": {},
  "ai_response": "Tu respuesta breve e inspiradora"
}

REGLAS:
- Si el usuario habla de dinero, gastos o ingresos → intent: "transaction", data: { "type": "income"|"expense", "amount": número, "category": "comida"|"transporte"|"ocio"|"salud"|"otros" }
- Si habla de gym, yoga, masaje, meditación → intent: "health", data: { "activity": "gym"|"yoga"|"meditation"|"massage", "duration": minutos_si_aplica }
- Si habla de agua o tomar agua → intent: "water", data: { "amount": mililitros }
- Si habla de comida o nutrición → intent: "food", data: { "item": "nombre", "calories": num, "protein": num, "carbs": num, "fat": num }
- Si es saludo, pregunta general o conversación → intent: "none", data: {}
- ai_response SIEMPRE debe tener un mensaje inspirador personalizado para ${name}`;
}

// ─── OpenAI direct call ──────────────────────────────────────────────────────

async function callOpenAI(message: string, userName: string | null, gender: string | null) {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('EXPO_PUBLIC_OPENAI_API_KEY no configurada');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: buildSystemPrompt(userName, gender) },
        { role: 'user', content: message },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI ${response.status}: ${errText.substring(0, 200)}`);
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content;

  if (!content) throw new Error('Respuesta vacía de OpenAI');

  try {
    const parsed = JSON.parse(content);
    return {
      intent: (parsed.intent || 'none') as 'transaction' | 'health' | 'water' | 'food' | 'none',
      data: parsed.data || {},
      ai_response: parsed.ai_response || 'Todo está fluyendo perfectamente.',
    };
  } catch {
    return { intent: 'none' as const, data: {}, ai_response: content.substring(0, 500) };
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
      const nlpResult = await callOpenAI(text, user.name ?? null, (user as any).gender ?? null);

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
