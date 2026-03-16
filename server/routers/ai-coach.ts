import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../_core/trpc";
import { ENV } from "../_core/env";

const systemPrompt = (userName: string | null, gender: string | null) => {
  const name = userName || "Reina";
  const isFem = !gender || gender === "femenino";

  return `Eres la Coach de LifeOS Elite para ${name}. Habla en ${isFem ? "femenino" : "masculino"}.
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
};

export const aiCoachRouter = router({
  processMessage: publicProcedure
    .input(
      z.object({
        message: z.string().min(1).max(2000),
        userName: z.string().nullable(),
        gender: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      if (!ENV.openaiApiKey) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "OPENAI_API_KEY no configurado en el servidor",
        });
      }

      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${ENV.openaiApiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt(input.userName, input.gender ?? null) },
              { role: "user", content: input.message },
            ],
            response_format: { type: "json_object" },
            max_tokens: 500,
            temperature: 0.7,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error(`[AI Coach] OpenAI error ${response.status}:`, errText);
          throw new Error(`OpenAI ${response.status}: ${errText.substring(0, 200)}`);
        }

        const result = await response.json();
        const content = result.choices?.[0]?.message?.content;

        if (!content) {
          throw new Error("Respuesta vacía de OpenAI");
        }

        let parsed: any;
        try {
          parsed = JSON.parse(content);
        } catch {
          console.error("[AI Coach] JSON parse failed:", content);
          // If OpenAI returns invalid JSON, return a safe fallback
          return {
            intent: "none" as const,
            data: {},
            ai_response: content.substring(0, 500),
          };
        }

        return {
          intent: (parsed.intent || "none") as "transaction" | "health" | "water" | "food" | "none",
          data: parsed.data || {},
          ai_response: parsed.ai_response || "Todo está fluyendo perfectamente.",
        };
      } catch (err: any) {
        console.error("[AI Coach] Error:", err?.message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err?.message ?? "Error procesando mensaje",
        });
      }
    }),
});
