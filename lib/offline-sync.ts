import { Platform } from 'react-native';
import { supabase } from './supabase';

export interface QueuedOperation {
  id: string;
  table: string;
  type: 'insert' | 'update' | 'upsert' | 'delete';
  data: any;
  filter?: { column: string; value: string };
  upsertOptions?: { onConflict: string };
  timestamp: number;
  retries: number;
}

const STORAGE_KEY = 'lifeos_offline_queue';
const MAX_RETRIES = 5;

// ─── Queue Management ────────────────────────────────────────────────────────

function getQueue(): QueuedOperation[] {
  if (Platform.OS !== 'web') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedOperation[]) {
  if (Platform.OS !== 'web') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {}
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ─── Online Detection ────────────────────────────────────────────────────────

export function isOnline(): boolean {
  if (Platform.OS !== 'web') return true;
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

let listeners: Array<(online: boolean) => void> = [];

export function onConnectivityChange(fn: (online: boolean) => void): () => void {
  listeners.push(fn);
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const handleOnline = () => {
      listeners.forEach(l => l(true));
      processQueue();
    };
    const handleOffline = () => listeners.forEach(l => l(false));
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      listeners = listeners.filter(l => l !== fn);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }
  return () => {
    listeners = listeners.filter(l => l !== fn);
  };
}

// ─── Queue Operations ────────────────────────────────────────────────────────

export function enqueue(op: Omit<QueuedOperation, 'id' | 'timestamp' | 'retries'>) {
  const queue = getQueue();
  queue.push({
    ...op,
    id: generateId(),
    timestamp: Date.now(),
    retries: 0,
  });
  saveQueue(queue);
}

export function getQueueSize(): number {
  return getQueue().length;
}

export function clearQueue() {
  saveQueue([]);
}

// ─── Process Queue ───────────────────────────────────────────────────────────

let processing = false;

export async function processQueue(): Promise<{ success: number; failed: number }> {
  if (processing || !isOnline()) return { success: 0, failed: 0 };
  processing = true;

  const queue = getQueue();
  if (queue.length === 0) {
    processing = false;
    return { success: 0, failed: 0 };
  }

  let success = 0;
  let failed = 0;
  const remaining: QueuedOperation[] = [];

  for (const op of queue) {
    try {
      let result: { error: any };

      switch (op.type) {
        case 'insert':
          result = await supabase.from(op.table).insert(op.data);
          break;
        case 'update':
          if (!op.filter) throw new Error('Update requires filter');
          result = await supabase.from(op.table).update(op.data).eq(op.filter.column, op.filter.value);
          break;
        case 'upsert':
          result = await supabase.from(op.table).upsert(op.data, op.upsertOptions);
          break;
        case 'delete':
          if (!op.filter) throw new Error('Delete requires filter');
          result = await supabase.from(op.table).delete().eq(op.filter.column, op.filter.value);
          break;
        default:
          throw new Error(`Unknown operation type: ${op.type}`);
      }

      if (result.error) throw result.error;
      success++;
    } catch (err) {
      op.retries++;
      if (op.retries < MAX_RETRIES) {
        remaining.push(op);
      }
      failed++;
      console.warn(`[OfflineSync] Failed op ${op.id} (retry ${op.retries}):`, err);
    }
  }

  saveQueue(remaining);
  processing = false;

  return { success, failed };
}

// ─── Smart Write (auto-queues when offline) ──────────────────────────────────

export async function offlineInsert(table: string, data: any): Promise<{ error: any }> {
  if (isOnline()) {
    const result = await supabase.from(table).insert(data);
    if (result.error && !isOnline()) {
      enqueue({ table, type: 'insert', data });
      return { error: null };
    }
    return result;
  }
  enqueue({ table, type: 'insert', data });
  return { error: null };
}

export async function offlineUpdate(table: string, data: any, column: string, value: string): Promise<{ error: any }> {
  if (isOnline()) {
    const result = await supabase.from(table).update(data).eq(column, value);
    if (result.error && !isOnline()) {
      enqueue({ table, type: 'update', data, filter: { column, value } });
      return { error: null };
    }
    return result;
  }
  enqueue({ table, type: 'update', data, filter: { column, value } });
  return { error: null };
}

export async function offlineUpsert(table: string, data: any, options?: { onConflict: string }): Promise<{ error: any }> {
  if (isOnline()) {
    const result = await supabase.from(table).upsert(data, options);
    if (result.error && !isOnline()) {
      enqueue({ table, type: 'upsert', data, upsertOptions: options });
      return { error: null };
    }
    return result;
  }
  enqueue({ table, type: 'upsert', data, upsertOptions: options });
  return { error: null };
}

// ─── Auto-sync on reconnect ─────────────────────────────────────────────────

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[OfflineSync] Back online — processing queue...');
    processQueue().then(({ success, failed }) => {
      if (success > 0 || failed > 0) {
        console.log(`[OfflineSync] Processed: ${success} success, ${failed} failed`);
      }
    });
  });
}
