// Notificaciones en la app nativa (iOS/Android con expo-notifications).
// En la web van por push real (hooks/use-ajustes.ts y /api/push): esto ya no
// arranca temporizadores en la página, que solo sonaban con la app abierta.
import { Platform } from 'react-native';
import { RECORDATORIOS, type Recordatorios } from '@/lib/recordatorios';

type ExpoNotifs = typeof import('expo-notifications');
let N: ExpoNotifs | null = null;

async function cargar(): Promise<ExpoNotifs | null> {
  if (Platform.OS === 'web') return null;
  if (N) return N;
  try {
    N = await import('expo-notifications');
    N.setNotificationHandler({
      handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
    });
    return N;
  } catch {
    return null;
  }
}

/** Reprograma todos los recordatorios del celular según los ajustes. */
export async function programarEnNativo(ajustes: Recordatorios): Promise<boolean> {
  const n = await cargar();
  if (!n) return false;
  const { status } = await n.requestPermissionsAsync();
  if (status !== 'granted') return false;
  await n.cancelAllScheduledNotificationsAsync();
  for (const r of RECORDATORIOS) {
    const a = ajustes[r.clave];
    if (!a.on) continue;
    for (const h of a.horas) {
      await n.scheduleNotificationAsync({
        identifier: `${r.clave}-${h}`,
        content: { title: r.titulo, body: r.cuerpo, data: { url: r.url } },
        trigger: { type: n.SchedulableTriggerInputTypes.DAILY, hour: Number(h.slice(0, 2)), minute: Number(h.slice(3, 5)) },
      });
    }
  }
  return true;
}
