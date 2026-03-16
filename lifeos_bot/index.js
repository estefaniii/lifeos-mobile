require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { createClient } = require('@supabase/supabase-js');
const { processUserInput } = require('./nlp_processor');
const { initScheduler } = require('./scheduler');
const { randomUUID } = require('crypto');

// Inicializar Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el archivo .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Inicializar Bot de Telegram
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('Error: Falta TELEGRAM_BOT_TOKEN en el archivo .env');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

// Inicializar Cron Jobs
initScheduler(bot, supabase);

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username || msg.from.first_name;

  // Check if user already exists (id must be provided since it has no DB default)
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('telegram_id', chatId)
    .maybeSingle();

  const userId = existing?.id || randomUUID();

  const { error } = await supabase
    .from('users')
    .upsert({
      id: userId,
      telegram_id: chatId,
      name: username,
      last_active: new Date().toISOString()
    }, { onConflict: 'telegram_id' });

  if (error) {
    console.error('Error al registrar usuario:', error);
    bot.sendMessage(chatId, "¡Hola! Hubo un problema al configurar tu cuenta. Por favor, intenta de nuevo más tarde.");
    return;
  }

  const welcomeMessage = `¡Hola ${username}! Soy tu asistente de LifeOS.\n\n` + 
    `Estoy aquí para ayudarte a mantener tus finanzas, salud, productividad y mente en orden, siempre recordando que tu deseo ya es un hecho presente.\n\n` +
    `Puedes enviarme mensajes como:\n` +
    `- "Gané $50 en Lunaria"\n` +
    `- "Gasté $15 en tela"\n` +
    `- "Medité 10 minutos hoy"\n\n` +
    `¿En qué puedo ayudarte hoy para mantener tu autoconcepto elevado?`;
  
  bot.sendMessage(chatId, welcomeMessage);
});

// Procesar mensajes regulares
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Ignorar comandos
  if (!text || text.startsWith('/')) return;

  bot.sendChatAction(chatId, 'typing');

  try {
    // 1. Obtener ID interno del usuario
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', chatId)
      .single();

    if (userError || !userData) {
      bot.sendMessage(chatId, "Por favor, envía /start para iniciar tu sesión primero.");
      return;
    }

    const userId = userData.id;

    // 2. Procesar el texto con NLP / IA
    const nlpResult = await processUserInput(text);

    // 3. Ejecutar las acciones en la base de datos (según lo extraído por OpenAI)
    let actionSummary = "";

    if (nlpResult.intent === 'transaction') {
      const txDate = new Date().toISOString().split('T')[0];
      const { error } = await supabase.from('transactions').insert({
        user_id: userId,
        type: nlpResult.data.type,
        amount: nlpResult.data.amount,
        category: nlpResult.data.category || 'otros',
        source: nlpResult.data.source,
        date: txDate,
        note: text
      });
      if (error) throw error;
      actionSummary = nlpResult.data.type === 'income' 
        ? `Ingreso de $${nlpResult.data.amount} registrado.` 
        : `Gasto de $${nlpResult.data.amount} registrado.`;
    } 
    else if (nlpResult.intent === 'health') {
      const today = new Date().toISOString().split('T')[0];
      if (nlpResult.data.activity === 'meditation') {
        const { error } = await supabase.from('mental_logs').insert({
          user_id: userId,
          meditation_minutes: nlpResult.data.duration || 0,
          date: today,
          note: text
        });
        if (error) throw error;
        actionSummary = `🧘 Meditación de ${nlpResult.data.duration} min registrada.`;
      } else {
        let updateData = {};
        if (nlpResult.data.activity === 'gym') updateData.gym_session = true;
        if (nlpResult.data.activity === 'yoga') updateData.yoga_session = true;
        if (nlpResult.data.activity === 'massage') updateData.massage_session = true;
        
        const { error } = await supabase.from('health_metrics').upsert({
          user_id: userId,
          date: today,
          ...updateData
        }, { onConflict: 'user_id,date' });
        if (error) throw error;
        actionSummary = `💪 Actividad (${nlpResult.data.activity}) registrada.`;
      }
    }
    else if (nlpResult.intent === 'water') {
      const today = new Date().toISOString().split('T')[0];
      // Primero obtener el valor actual
      const { data: current } = await supabase.from('health_metrics').select('water_ml').eq('user_id', userId).eq('date', today).single();
      const newAmount = (current?.water_ml || 0) + (nlpResult.data.amount || 0);
      
      const { error } = await supabase.from('health_metrics').upsert({
        user_id: userId,
        date: today,
        water_ml: newAmount
      }, { onConflict: 'user_id,date' });
      if (error) throw error;
      actionSummary = `💧 Hidratación: +${nlpResult.data.amount}ml (Total: ${newAmount}ml).`;
    }
    else if (nlpResult.intent === 'food') {
      const today = new Date().toISOString().split('T')[0];
      const { data: current } = await supabase.from('health_metrics').select('calories, protein_g, carbs_g, fat_g').eq('user_id', userId).eq('date', today).single();
      
      const { error } = await supabase.from('health_metrics').upsert({
        user_id: userId,
        date: today,
        calories: (current?.calories || 0) + (nlpResult.data.calories || 0),
        protein_g: (current?.protein_g || 0) + (nlpResult.data.protein || 0),
        carbs_g: (current?.carbs_g || 0) + (nlpResult.data.carbs || 0),
        fat_g: (current?.fat_g || 0) + (nlpResult.data.fat || 0),
        meals_tracked: true
      }, { onConflict: 'user_id,date' });
      if (error) throw error;
      actionSummary = `🍎 Comida registrada: ${nlpResult.data.item}.`;
    }
    else if (nlpResult.intent === 'productivity') {
      actionSummary = "Registro de productividad recibido.";
    }

    // 4. Enviar la respuesta inspiradora (Ley de Asunción) generada por la IA
    const finalResponse = `${actionSummary}\n\n✨ ${nlpResult.ai_response}`;
    bot.sendMessage(chatId, finalResponse);

  } catch (error) {
    console.error('Error procesando mensaje:', error);
    bot.sendMessage(chatId, "Hubo un error al procesar tu mensaje. Pero recuerda, todo siempre está funcionando a tu favor. Inténtalo de nuevo en unos momentos.");
  }
});

console.log('Bot de LifeOS inicializado y esperando mensajes...');
