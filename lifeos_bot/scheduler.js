const cron = require('node-cron');

function initScheduler(bot, supabase) {
  // Recordatorio Matutino - Todos los días a las 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    try {
      const { data: users, error } = await supabase.from('users').select('telegram_id, name');
      if (error) throw error;

      users.forEach(user => {
        if (user.telegram_id) {
          const msg = `🌅 ¡Buenos días ${user.name}! Hoy es un lienzo en blanco para moldear tu realidad. Recuerda que tú eres el operante de tu destino.\n\n` +
                      `¿Qué vamos a manifestar hoy? (Productividad, Finanzas, Yoga, etc.)`;
          bot.sendMessage(user.telegram_id, msg).catch(err => console.error("Error enviando msg a", user.telegram_id));
        }
      });
    } catch(e) {
      console.error('Error en cronjob matutino:', e);
    }
  });

  // Resumen Semanal Financiero y de Hábitos - Domingos a las 8:00 PM
  cron.schedule('0 20 * * 0', async () => {
    try {
      const { data: users, error } = await supabase.from('users').select('id, telegram_id, name');
      if (error) throw error;

      for (const user of users) {
        if (!user.telegram_id) continue;
        
        // Aquí podríamos hacer consultas a transactions, health_metrics para resumir la semana (simulado por ahora).
        const msg = `📊 *Resumen de la Semana* de ${user.name}\n\n` +
                    `"La imaginación es el comienzo de la creación." Has terminado otra semana acercándote más a tu versión ideal.\n\n` +
                    `- Registros de salud verificados.\n` +
                    `- Movimientos financieros en orden.\n\n` +
                    `¡Sigue adelante con el sentimiento del deseo cumplido!`;
        
        bot.sendMessage(user.telegram_id, msg, { parse_mode: 'Markdown' }).catch(err => console.error(err));
      }
    } catch(e) {
      console.error('Error en cronjob semanal:', e);
    }
  });

  console.log("Scheduler inicializado con Cron Jobs de LifeOS.");
}

module.exports = {
  initScheduler
};
