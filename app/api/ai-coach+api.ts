import { ExpoRequest } from 'expo-router/server';

// Server-side OpenAI key — never exposed to the client bundle.
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';

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

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function POST(req: ExpoRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const message: string = (body?.message ?? '').toString().slice(0, 4000);
    const userName: string | null = body?.userName ?? null;
    const gender: string | null = body?.gender ?? null;

    if (!message.trim()) {
      return Response.json({ error: 'Missing "message"' }, { status: 400 });
    }

    if (!OPENAI_API_KEY) {
      return Response.json({
        intent: 'none',
        data: {},
        ai_response: `${userName || 'reina'}, el coach IA está apagado porque no hay OPENAI_API_KEY en el servidor. Mientras tanto puedes usar todos los registros manuales.`,
      });
    }

    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
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

    if (!upstream.ok) {
      const status = upstream.status;
      if (status === 429) {
        return Response.json({
          intent: 'none',
          data: {},
          ai_response: `${userName || 'Reina'}, la API de OpenAI se quedó sin créditos. Agrega saldo en platform.openai.com/billing y vuelve a intentar.`,
        });
      }
      if (status === 401) {
        return Response.json({
          intent: 'none',
          data: {},
          ai_response: `La API key de OpenAI no es válida. Verifica OPENAI_API_KEY en las variables de entorno del servidor.`,
        });
      }
      const errText = await upstream.text();
      return Response.json(
        {
          intent: 'none',
          data: {},
          ai_response: `OpenAI ${status}: ${errText.substring(0, 200)}`,
        },
        { status: 200 }, // keep 200 so client treats it as a normal "soft" reply
      );
    }

    const result = await upstream.json();
    const content = result?.choices?.[0]?.message?.content;
    if (!content) {
      return Response.json({
        intent: 'none',
        data: {},
        ai_response: 'Respuesta vacía del modelo. Intenta de nuevo.',
      });
    }

    const parsed = safeJsonParse(content);
    if (!parsed) {
      return Response.json({
        intent: 'none',
        data: {},
        ai_response: String(content).substring(0, 500),
      });
    }

    return Response.json({
      intent: ['transaction', 'health', 'water', 'food', 'none'].includes(parsed.intent)
        ? parsed.intent
        : 'none',
      data: parsed.data ?? {},
      ai_response: parsed.ai_response || 'Todo está fluyendo perfectamente.',
    });
  } catch (err: any) {
    return Response.json(
      {
        intent: 'none',
        data: {},
        ai_response: `Error inesperado: ${err?.message || 'desconocido'}.`,
      },
      { status: 200 },
    );
  }
}
