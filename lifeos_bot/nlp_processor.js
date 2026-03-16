const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function processUserInput(userMessage) {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("No OPENAI_API_KEY found. Returning mock data.");
    return {
      intent: 'transaction',
      data: { type: 'income', amount: 50, category: 'Sueldo', source: 'Generico' },
      ai_response: "Hecho está. Todo fluye hacia ti abundantemente."
    };
  }

  const systemPrompt = `Eres el asistente de operaciones e inteligencia mental del sistema LifeOS. 
Tu rol es extraer datos estructurados de los mensajes del usuario Y ofrecer respuestas inspiradoras bajo la filosofía de la Ley de Asunción (Neville Goddard - asume el sentimiento del deseo cumplido, la realidad es un reflejo de tu mente, ya eres quien deseas ser).

DEBES RESPONDER EXCLUSIVAMENTE EN FORMATO JSON VÁLIDO. 
El JSON debe tener la siguiente estructura estricta:
{
  "intent": "Un string que puede ser 'transaction', 'health', 'productivity', 'water' o 'food'",
  "data": { 
     // Un objeto con llaves según el intent. 
     // Si es transaction: "type" ('income' o 'expense'), "amount" (número), "category", "source"
     // Si es health: "activity" (ej. 'gym', 'yoga', 'massage', 'meditation'), "duration" (minutos, opcional)
     // Si es water: "amount" (entero en ml, ej: 500)
     // Si es food: "item" (nombre), "calories" (opcional), "protein" (g, opcional), "carbs" (g, opcional), "fat" (g, opcional)
     // Si es productivity: "project", "duration" (minutos)
  },
  "ai_response": "Un string con la respuesta hacia el usuario. DEBE contener el mensaje inspirador según la Ley de Asunción en español. Hazlo natural y personal."
}

Ejemplo Entrada: "Gané $50 en Lunaria"
Ejemplo JSON de salida:
{
  "intent": "transaction",
  "data": { "type": "income", "amount": 50, "category": "Ingresos", "source": "Lunaria" },
  "ai_response": "Ese ingreso constante de Lunaria es un reflejo natural de la abundancia que ya habita en ti. Es tuyo, siempre lo fue. Sigue viviendo en el final."
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // o gpt-3.5-turbo o gpt-4
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      response_format: { type: "json_object" }
    });

    const resultStr = response.choices[0].message.content;
    const resultJson = JSON.parse(resultStr);
    return resultJson;
  } catch (error) {
    console.error("OpenAI Error:", error);
    // Fallback response for stability
    return {
      intent: 'general',
      data: {},
      ai_response: "Todo es energía y fluye naturalmente. Entendido."
    };
  }
}

module.exports = {
  processUserInput
};
