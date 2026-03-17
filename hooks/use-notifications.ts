import { useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReminderSettings = {
  water: boolean;
  breaks: boolean;
  affirmations: boolean;
  finances: boolean;
  habits: boolean;
  sleep: boolean;
};

const DEFAULT_SETTINGS: ReminderSettings = {
  water: true,
  breaks: true,
  affirmations: true,
  finances: false,
  habits: true,
  sleep: true,
};

const STORAGE_KEY = 'lifeos_reminders';

// ─── Storage ──────────────────────────────────────────────────────────────────

function getStoredSettings(): ReminderSettings {
  if (Platform.OS !== 'web') return DEFAULT_SETTINGS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function storeSettings(settings: ReminderSettings) {
  if (Platform.OS !== 'web') return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch {}
}

// ─── Service Worker ──────────────────────────────────────────────────────────

async function registerServiceWorker() {
  if (Platform.OS !== 'web' || !('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    return reg;
  } catch {
    return null;
  }
}

function syncSettingsWithSW(settings: ReminderSettings) {
  if (Platform.OS !== 'web' || !('serviceWorker' in navigator)) return;
  navigator.serviceWorker.ready.then((reg) => {
    reg.active?.postMessage({ type: 'UPDATE_REMINDERS', settings });
  });
}

// ─── Web Notifications ────────────────────────────────────────────────────────

async function requestWebPermission(): Promise<boolean> {
  if (Platform.OS !== 'web' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') {
    try { localStorage.setItem('lifeos_notif_granted', 'true'); } catch {}
    return true;
  }
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  if (result === 'granted') {
    try { localStorage.setItem('lifeos_notif_granted', 'true'); } catch {}
    // Notify SW that permission was granted
    const reg = await registerServiceWorker();
    if (reg?.active) {
      reg.active.postMessage({ type: 'NOTIFICATION_PERMISSION_GRANTED' });
    }
  }
  return result === 'granted';
}

export function hasNotificationPermission(): boolean {
  if (Platform.OS !== 'web') return false;
  if ('Notification' in window && Notification.permission === 'granted') return true;
  try { return localStorage.getItem('lifeos_notif_granted') === 'true'; } catch { return false; }
}

function sendWebNotification(title: string, body: string, tag: string) {
  if (Platform.OS !== 'web' || !('Notification' in window) || Notification.permission !== 'granted') return;
  try { new Notification(title, { body, tag }); } catch {}
}

// ─── Native (expo-notifications) — lazy loaded ───────────────────────────────

let ExpoNotifs: typeof import('expo-notifications') | null = null;

async function loadExpoNotifications() {
  if (Platform.OS === 'web') return null;
  if (ExpoNotifs) return ExpoNotifs;
  try {
    ExpoNotifs = require('expo-notifications');
    ExpoNotifs!.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false,
        shouldShowBanner: true, shouldShowList: true,
      }),
    });
    return ExpoNotifs;
  } catch { return null; }
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return requestWebPermission();
  const N = await loadExpoNotifications();
  if (!N) return false;
  const { status: existing } = await N.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await N.requestPermissionsAsync();
  return status === 'granted';
}

async function cancelById(id: string) {
  const N = await loadExpoNotifications();
  if (!N) return;
  const scheduled = await N.getAllScheduledNotificationsAsync();
  if (scheduled.find((n) => n.identifier === id)) {
    await N.cancelScheduledNotificationAsync(id);
  }
}

async function scheduleDaily(id: string, title: string, body: string, hour: number, minute = 0) {
  const N = await loadExpoNotifications();
  if (!N) return;
  await cancelById(id);
  await N.scheduleNotificationAsync({
    identifier: id,
    content: { title, body, sound: true },
    trigger: { type: N.SchedulableTriggerInputTypes.DAILY, hour, minute },
  });
}

async function scheduleInterval(id: string, title: string, body: string, intervalSeconds: number) {
  const N = await loadExpoNotifications();
  if (!N) return;
  await cancelById(id);
  await N.scheduleNotificationAsync({
    identifier: id,
    content: { title, body, sound: true },
    trigger: { type: N.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: intervalSeconds, repeats: true },
  });
}

// ─── Apply Settings ──────────────────────────────────────────────────────────

export async function applyReminderSettings(settings: ReminderSettings) {
  storeSettings(settings);

  if (Platform.OS === 'web') {
    // Sync settings with service worker for background notifications
    syncSettingsWithSW(settings);
    return;
  }

  const granted = await requestNotificationPermissions();
  if (!granted) return;

  // Water — every 2h
  if (settings.water) {
    await scheduleInterval('reminder-water', '💧 Hidratación', '¡Toma un vaso de agua! Registra en LifeOS.', 2 * 60 * 60);
  } else { await cancelById('reminder-water'); }

  // Breaks — every 90 min
  if (settings.breaks) {
    await scheduleInterval('reminder-breaks', '🏃 Pausa Activa', '5 minutos de movimiento para recargar.', 90 * 60);
  } else { await cancelById('reminder-breaks'); }

  // Affirmations — 8am and 10pm
  if (settings.affirmations) {
    await scheduleDaily('reminder-aff-am', '✨ Afirmación Maestra', 'El deseo ya está cumplido. Asume el sentimiento ahora.', 8, 0);
    await scheduleDaily('reminder-aff-pm', '🌙 Revisión Nocturna', 'Antes de dormir: revive el día desde el final deseado.', 22, 0);
  } else { await cancelById('reminder-aff-am'); await cancelById('reminder-aff-pm'); }

  // Finances — 8pm
  if (settings.finances) {
    await scheduleDaily('reminder-finances', '💰 Resumen del Día', '¿Registraste todos tus gastos e ingresos de hoy?', 20, 0);
  } else { await cancelById('reminder-finances'); }

  // Habits — 9am
  if (settings.habits) {
    await scheduleDaily('reminder-habits', '🎯 Hábitos del Día', '¡Buenos días! Revisa y completa tus hábitos diarios.', 9, 0);
  } else { await cancelById('reminder-habits'); }

  // Sleep — 10:30pm
  if (settings.sleep) {
    await scheduleDaily('reminder-sleep', '🌙 Hora de Dormir', 'Es hora de descansar. No olvides registrar tu sueño.', 22, 30);
  } else { await cancelById('reminder-sleep'); }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNotificationSetup() {
  const waterRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const checkRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startWebReminders = useCallback(async () => {
    if (Platform.OS !== 'web') return;

    // Register service worker for background notifications
    await registerServiceWorker();

    const ok = await requestWebPermission();
    if (!ok) return;
    const s = getStoredSettings();

    // Sync settings with SW
    syncSettingsWithSW(s);

    if (waterRef.current) clearInterval(waterRef.current);
    if (checkRef.current) clearInterval(checkRef.current);

    // Water — every 2h (only 8am-10pm)
    if (s.water) {
      waterRef.current = setInterval(() => {
        const h = new Date().getHours();
        if (h >= 8 && h < 22) sendWebNotification('💧 Hora de hidratarte', 'Registra tu consumo de agua en LifeOS.', 'water');
      }, 2 * 60 * 60 * 1000);
    }

    // Time-based checks (every 60s)
    checkRef.current = setInterval(() => {
      const now = new Date();
      const t = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      if (s.habits && t === '09:00') sendWebNotification('🎯 Hábitos del Día', '¡Buenos días! Completa tus hábitos.', 'habits');
      if (s.affirmations && t === '08:00') sendWebNotification('✨ Afirmación Maestra', 'Asume el sentimiento del deseo cumplido.', 'aff-am');
      if (s.sleep && t === '22:30') sendWebNotification('🌙 Hora de Dormir', 'Registra tu sueño y descansa bien.', 'sleep');
      if (s.affirmations && t === '22:00') sendWebNotification('🌙 Revisión Nocturna', 'Revive el día desde el final deseado.', 'aff-pm');
      if (s.finances && t === '20:00') sendWebNotification('💰 Resumen Financiero', '¿Registraste tus gastos de hoy?', 'finances');
    }, 60 * 1000);
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      startWebReminders();
      return () => {
        if (waterRef.current) clearInterval(waterRef.current);
        if (checkRef.current) clearInterval(checkRef.current);
      };
    } else {
      loadExpoNotifications().then(async (N) => {
        if (!N) return;
        const granted = await requestNotificationPermissions();
        if (!granted) return;
        const scheduled = await N.getAllScheduledNotificationsAsync();
        if (scheduled.length === 0) applyReminderSettings(getStoredSettings());
      });
    }
  }, [startWebReminders]);

  return {
    getSettings: getStoredSettings,
    sendTest: () => {
      if (Platform.OS === 'web') {
        sendWebNotification('🔔 LifeOS', 'Las notificaciones están funcionando correctamente.', 'test');
      }
    },
  };
}
