// Tus ajustes: foto de perfil, recordatorios y las notificaciones push de este celular.
// Tablas y bucket «perfil» en supabase/perfil-push.sql.
import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { conDefectos, type Recordatorios } from '@/lib/recordatorios';
import { programarEnNativo } from '@/hooks/use-notifications';

const useUserId = () => useAuth({ autoFetch: false }).user?.id ?? null;
const VAPID = process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY ?? '';

type Fila = { avatar_path: string | null; reminders: Record<string, unknown>; timezone: string };

export function useAjustes() {
  const userId = useUserId();
  return useQuery({
    queryKey: ['ajustes', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase.from('user_settings').select('avatar_path, reminders, timezone').eq('user_id', userId!).maybeSingle();
      const f = (data ?? { avatar_path: null, reminders: {}, timezone: 'America/Panama' }) as Fila;
      let avatarUrl: string | null = null;
      if (f.avatar_path) {
        const { data: u } = await supabase.storage.from('perfil').createSignedUrl(f.avatar_path, 60 * 60 * 24);
        avatarUrl = u?.signedUrl ?? null;
      }
      return { ...f, avatarUrl, recordatorios: conDefectos(f.reminders as never) };
    },
    staleTime: 30 * 60 * 1000,
  });
}

const zonaLocal = () => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Panama' } catch { return 'America/Panama' }
};

export function useGuardarRecordatorios() {
  const qc = useQueryClient(), userId = useUserId();
  return useMutation({
    mutationFn: async (r: Recordatorios) => {
      if (!userId) throw new Error('Sesión no válida.');
      const { error } = await supabase.from('user_settings')
        .upsert({ user_id: userId, reminders: r, timezone: zonaLocal(), updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      if (error) throw error;
      if (Platform.OS !== 'web') await programarEnNativo(r);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ajustes'] }),
  });
}

export function useFotoPerfil() {
  const qc = useQueryClient(), userId = useUserId();
  const subir = useMutation({
    mutationFn: async ({ uri, mime, anterior }: { uri: string; mime?: string | null; anterior?: string | null }) => {
      if (!userId) throw new Error('Sesión no válida.');
      const tipo = mime || 'image/jpeg';
      // Nombre nuevo en cada cambio: así la foto vieja no se queda en la caché
      const path = `${userId}/avatar-${Date.now()}.${tipo.includes('png') ? 'png' : 'jpg'}`;
      const cuerpo = await (await fetch(uri)).arrayBuffer();
      const { error: e1 } = await supabase.storage.from('perfil').upload(path, cuerpo, { contentType: tipo });
      if (e1) throw e1;
      const { error: e2 } = await supabase.from('user_settings')
        .upsert({ user_id: userId, avatar_path: path, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      if (e2) throw e2;
      if (anterior) await supabase.storage.from('perfil').remove([anterior]);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ajustes'] }),
  });
  const quitar = useMutation({
    mutationFn: async (anterior: string) => {
      if (!userId) throw new Error('Sesión no válida.');
      await supabase.from('user_settings').update({ avatar_path: null }).eq('user_id', userId);
      await supabase.storage.from('perfil').remove([anterior]);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ajustes'] }),
  });
  return { subir, quitar };
}

// ─── Push en la web ──────────────────────────────────────────────────────────

export type EstadoPush =
  | 'cargando'
  | 'sin-soporte'          // navegador sin push
  | 'instalar'             // iPhone en Safari: hay que añadirla a la pantalla de inicio
  | 'bloqueado'            // el permiso se negó: solo se cambia en Ajustes del sistema
  | 'apagado'
  | 'activo';

const esIOS = () => typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent);
const instalada = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone === true);

function aBytes(base64: string) {
  const relleno = '='.repeat((4 - (base64.length % 4)) % 4);
  const b = atob((base64 + relleno).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
}

const nombreDispositivo = () => {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua)) return 'iPad';
  if (/Android/.test(ua)) return 'Android';
  if (/Mac/.test(ua)) return 'Mac';
  return 'Navegador';
};

export function usePush() {
  const userId = useUserId();
  const [estado, setEstado] = useState<EstadoPush>('cargando');

  const revisar = useCallback(async () => {
    if (Platform.OS !== 'web') return setEstado('activo');
    if (esIOS() && !instalada()) return setEstado('instalar');
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return setEstado('sin-soporte');
    if (Notification.permission === 'denied') return setEstado('bloqueado');
    const reg = await navigator.serviceWorker.getRegistration('/');
    const sub = await reg?.pushManager.getSubscription();
    setEstado(sub && Notification.permission === 'granted' ? 'activo' : 'apagado');
  }, []);

  useEffect(() => { revisar() }, [revisar]);

  // Tiene que llamarse desde un toque: iOS solo pide permiso tras un gesto
  const activar = useCallback(async () => {
    if (!userId) throw new Error('Sesión no válida.');
    if (!VAPID) throw new Error('Falta la clave pública de notificaciones en la app.');
    const permiso = await Notification.requestPermission();
    if (permiso !== 'granted') { await revisar(); throw new Error(permiso === 'denied' ? 'Permiso negado.' : 'No diste permiso.') }
    const reg = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    const sub = (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: aBytes(VAPID) }));
    const j = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
    const { error } = await supabase.from('push_subscriptions')
      .upsert({ user_id: userId, endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth, device: nombreDispositivo() }, { onConflict: 'endpoint' });
    if (error) throw error;
    // La zona horaria también, para que «22:30» sea tu 22:30
    await supabase.from('user_settings').upsert({ user_id: userId, timezone: zonaLocal() }, { onConflict: 'user_id' });
    setEstado('activo');
  }, [userId, revisar]);

  const desactivar = useCallback(async () => {
    const reg = await navigator.serviceWorker.getRegistration('/');
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      await sub.unsubscribe();
    }
    setEstado('apagado');
  }, []);

  const probar = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error('Sesión no válida.');
    const r = await fetch('/api/push', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prueba: true }),
    });
    if (!r.ok) throw new Error(((await r.json().catch(() => ({}))) as { error?: string }).error ?? `Error ${r.status}`);
  }, []);

  return { estado, activar, desactivar, probar, revisar };
}
