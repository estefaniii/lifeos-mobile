// Service worker de LifeOS: recibe las notificaciones push y abre la app al tocarlas.
// Las envía /api/push (Vercel) a la hora de cada recordatorio, con la app cerrada.
// Antes los recordatorios salían de un temporizador dentro de la página y solo
// sonaban con la app abierta.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let datos = {};
  try { datos = event.data ? event.data.json() : {}; } catch (_) { datos = { body: event.data && event.data.text() }; }
  const titulo = datos.title || 'LifeOS';
  event.waitUntil(
    self.registration.showNotification(titulo, {
      body: datos.body || '',
      tag: datos.tag || 'lifeos',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: datos.url || '/' },
    }),
  );
});

// Al tocarla: si la app ya está abierta se enfoca y va a la pantalla; si no, se abre
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ventanas) => {
      for (const v of ventanas) {
        if ('focus' in v) {
          v.navigate && v.navigate(url);
          return v.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
