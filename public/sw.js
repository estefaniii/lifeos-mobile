// LifeOS Service Worker - Handles scheduled notifications
const CACHE_NAME = 'lifeos-v1';
const REMINDERS_KEY = 'lifeos_reminders';

// Default reminder settings
const DEFAULT_SETTINGS = {
  water: true,
  breaks: true,
  affirmations: true,
  finances: false,
  habits: true,
  sleep: true,
};

// Notification schedule definitions
const REMINDERS = {
  habits:       { hour: 9,  min: 0,  title: '🎯 Hábitos del Día', body: '¡Buenos días! Completa tus hábitos diarios.' },
  water_am:     { hour: 10, min: 0,  title: '💧 Hora de hidratarte', body: 'Registra tu consumo de agua en LifeOS.' },
  water_pm:     { hour: 14, min: 0,  title: '💧 Hora de hidratarte', body: '¿Ya tomaste agua? Registra en LifeOS.' },
  water_eve:    { hour: 18, min: 0,  title: '💧 Hora de hidratarte', body: 'No olvides tu agua. Registra en LifeOS.' },
  breaks_1:     { hour: 11, min: 0,  title: '🏃 Pausa Activa', body: '5 minutos de movimiento para recargar.' },
  breaks_2:     { hour: 15, min: 30, title: '🏃 Pausa Activa', body: 'Hora de estirarte y moverte un poco.' },
  aff_am:       { hour: 8,  min: 0,  title: '✨ Afirmación Maestra', body: 'El deseo ya está cumplido. Asume el sentimiento ahora.' },
  aff_pm:       { hour: 22, min: 0,  title: '🌙 Revisión Nocturna', body: 'Revive el día desde el final deseado.' },
  finances:     { hour: 20, min: 0,  title: '💰 Resumen Financiero', body: '¿Registraste todos tus gastos e ingresos de hoy?' },
  sleep:        { hour: 22, min: 30, title: '🌙 Hora de Dormir', body: 'Es hora de descansar. Registra tu sueño.' },
};

// Map reminder keys to settings keys
const REMINDER_TO_SETTING = {
  habits: 'habits',
  water_am: 'water', water_pm: 'water', water_eve: 'water',
  breaks_1: 'breaks', breaks_2: 'breaks',
  aff_am: 'affirmations', aff_pm: 'affirmations',
  finances: 'finances',
  sleep: 'sleep',
};

// Install event
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listen for messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'UPDATE_REMINDERS') {
    // Settings are stored in localStorage by the app, SW can't access them directly
    // But we receive them via postMessage
    self._reminderSettings = event.data.settings;
  }
  if (event.data && event.data.type === 'NOTIFICATION_PERMISSION_GRANTED') {
    // Start the periodic check
    startPeriodicCheck();
  }
});

// Periodic sync (for browsers that support it)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'lifeos-reminders') {
    event.waitUntil(checkAndNotify());
  }
});

// Check reminders and send notifications
async function checkAndNotify() {
  const settings = self._reminderSettings || DEFAULT_SETTINGS;
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();

  for (const [key, reminder] of Object.entries(REMINDERS)) {
    const settingKey = REMINDER_TO_SETTING[key];
    if (!settings[settingKey]) continue;

    if (reminder.hour === h && reminder.min === m) {
      await self.registration.showNotification(reminder.title, {
        body: reminder.body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: key,
        renotify: true,
      });
    }
  }
}

// Notification click handler - open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      if (clients.length > 0) {
        return clients[0].focus();
      }
      return self.clients.openWindow('/');
    })
  );
});

// Use setInterval as fallback since periodic sync isn't widely supported
let checkInterval = null;
function startPeriodicCheck() {
  if (checkInterval) clearInterval(checkInterval);
  // Check every 60 seconds
  checkInterval = setInterval(() => {
    checkAndNotify();
  }, 60 * 1000);
}

// Start checking on activation
startPeriodicCheck();
