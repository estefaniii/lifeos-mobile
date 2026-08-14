/**
 * LifeOS — Almacenamiento LOCAL en el dispositivo
 * ------------------------------------------------------------------
 * Reemplazo de Supabase por una base de datos local (AsyncStorage) que
 * imita la misma API (`.from(tabla).select().eq()...`, `.insert()`,
 * `.update()`, `.upsert()`, `.delete()`, y `auth`).
 *
 * Motivo: la app es un tracker PERSONAL de un solo dispositivo. Antes
 * cada pantalla escribía en Supabase (nube) y, sin conexión/credenciales
 * configuradas en el build del celular, los datos (gastos, ganancias,
 * agua, etc.) NO se guardaban. Con este adaptador todo persiste dentro
 * del teléfono, funciona offline y sin cuentas ni servidor.
 *
 * Sustituye 1:1 el subconjunto de la API de Supabase que usa la app:
 *   - Query builder encadenable y "awaitable" que resuelve { data, error }
 *   - Filtros: eq, neq, gt, gte, lt, lte
 *   - Modificadores: order, limit, single, maybeSingle, select
 *   - Escrituras: insert, update, upsert (onConflict de 1+ columnas), delete
 *   - auth: sesión local automática (un único usuario "local")
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

type Row = Record<string, any>;
type Op = 'select' | 'insert' | 'update' | 'upsert' | 'delete';
type FilterOp = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte';
interface Filter { col: string; op: FilterOp; val: any; }

const KEY_PREFIX = 'lifeos_db_';
const tableKey = (t: string) => `${KEY_PREFIX}${t}`;

// ---------------------------------------------------------------------------
// Almacenamiento serializado (cache en memoria + escrituras en cola)
// ---------------------------------------------------------------------------
const cache = new Map<string, Row[]>();
let writeLock: Promise<unknown> = Promise.resolve();
let idCounter = 0;

function nextId(): number {
  // Entero monotónico: timestamp en ms * 1000 + contador → único aunque
  // se inserten varias filas en el mismo milisegundo.
  idCounter = (idCounter + 1) % 1000;
  return Date.now() * 1000 + idCounter;
}

async function loadTable(table: string): Promise<Row[]> {
  if (cache.has(table)) return cache.get(table)!;
  try {
    const raw = await AsyncStorage.getItem(tableKey(table));
    const rows: Row[] = raw ? JSON.parse(raw) : [];
    cache.set(table, rows);
    return rows;
  } catch {
    cache.set(table, []);
    return [];
  }
}

async function saveTable(table: string, rows: Row[]): Promise<void> {
  cache.set(table, rows);
  await AsyncStorage.setItem(tableKey(table), JSON.stringify(rows));
}

/** Serializa lectura-modificación-escritura para evitar carreras. */
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = writeLock.then(fn, fn);
  // mantener la cadena viva pero sin propagar rechazos
  writeLock = run.then(() => undefined, () => undefined);
  return run;
}

// ---------------------------------------------------------------------------
// Comparadores
// ---------------------------------------------------------------------------
/** Comparación numérica cuando ambos son números; si no, lexicográfica
 *  (correcta para fechas ISO 'YYYY-MM-DD'). */
function cmp(a: any, b: any): number {
  if (a === b) return 0;
  const na = Number(a);
  const nb = Number(b);
  const bothNum = a !== '' && b !== '' && a != null && b != null && !isNaN(na) && !isNaN(nb);
  if (bothNum) return na < nb ? -1 : na > nb ? 1 : 0;
  const sa = String(a);
  const sb = String(b);
  return sa < sb ? -1 : sa > sb ? 1 : 0;
}

function matches(row: Row, f: Filter): boolean {
  const v = row[f.col];
  switch (f.op) {
    case 'eq': return String(v) === String(f.val);
    case 'neq': return String(v) !== String(f.val);
    case 'gt': return cmp(v, f.val) > 0;
    case 'gte': return cmp(v, f.val) >= 0;
    case 'lt': return cmp(v, f.val) < 0;
    case 'lte': return cmp(v, f.val) <= 0;
    default: return true;
  }
}

// ---------------------------------------------------------------------------
// Query builder (encadenable + thenable)
// ---------------------------------------------------------------------------
class LocalQuery<T = any> implements PromiseLike<{ data: any; error: any }> {
  private filters: Filter[] = [];
  private _order: { col: string; ascending: boolean } | null = null;
  private _limit: number | null = null;
  private _single: 'strict' | 'maybe' | null = null;
  private op: Op = 'select';
  private payload: Row | Row[] | null = null;
  private conflictCols: string[] | null = null;

  constructor(private table: string) {}

  // --- filtros ---
  eq(col: string, val: any) { this.filters.push({ col, op: 'eq', val }); return this; }
  neq(col: string, val: any) { this.filters.push({ col, op: 'neq', val }); return this; }
  gt(col: string, val: any) { this.filters.push({ col, op: 'gt', val }); return this; }
  gte(col: string, val: any) { this.filters.push({ col, op: 'gte', val }); return this; }
  lt(col: string, val: any) { this.filters.push({ col, op: 'lt', val }); return this; }
  lte(col: string, val: any) { this.filters.push({ col, op: 'lte', val }); return this; }

  // --- modificadores ---
  order(col: string, opts?: { ascending?: boolean }) {
    this._order = { col, ascending: opts?.ascending !== false };
    return this;
  }
  limit(n: number) { this._limit = n; return this; }
  single() { this._single = 'strict'; return this; }
  maybeSingle() { this._single = 'maybe'; return this; }

  // --- operaciones ---
  select(_cols?: string) {
    // Si ya es una escritura, select() solo pide que devuelva las filas.
    if (this.op === 'select') this.op = 'select';
    return this;
  }
  insert(payload: Row | Row[]) { this.op = 'insert'; this.payload = payload; return this; }
  update(payload: Row) { this.op = 'update'; this.payload = payload; return this; }
  upsert(payload: Row | Row[], opts?: { onConflict?: string }) {
    this.op = 'upsert';
    this.payload = payload;
    this.conflictCols = opts?.onConflict ? opts.onConflict.split(',').map((c) => c.trim()) : ['id'];
    return this;
  }
  delete() { this.op = 'delete'; return this; }

  // --- ejecución ---
  private applyReadShaping(rows: Row[]): Row[] {
    let out = rows.filter((r) => this.filters.every((f) => matches(r, f)));
    if (this._order) {
      const { col, ascending } = this._order;
      out = [...out].sort((a, b) => (ascending ? cmp(a[col], b[col]) : -cmp(a[col], b[col])));
    }
    if (this._limit != null) out = out.slice(0, this._limit);
    return out;
  }

  private async run(): Promise<{ data: any; error: any }> {
    try {
      if (this.op === 'select') {
        const rows = await loadTable(this.table);
        const shaped = this.applyReadShaping(rows);
        if (this._single) {
          return { data: shaped.length ? shaped[0] : null, error: null };
        }
        return { data: shaped, error: null };
      }

      // Escrituras: serializadas
      return await withLock(async () => {
        const rows = await loadTable(this.table);

        if (this.op === 'insert') {
          const items = Array.isArray(this.payload) ? this.payload : [this.payload!];
          const inserted = items.map((it) => {
            const row: Row = { ...it };
            if (row.id == null) row.id = nextId();
            if (row.created_at == null) row.created_at = new Date().toISOString();
            return row;
          });
          await saveTable(this.table, [...rows, ...inserted]);
          const data = this._single ? inserted[0] ?? null : inserted;
          return { data, error: null };
        }

        if (this.op === 'update') {
          const updated: Row[] = [];
          const next = rows.map((r) => {
            if (this.filters.every((f) => matches(r, f))) {
              const merged = { ...r, ...(this.payload as Row) };
              updated.push(merged);
              return merged;
            }
            return r;
          });
          await saveTable(this.table, next);
          const data = this._single ? updated[0] ?? null : updated;
          return { data, error: null };
        }

        if (this.op === 'upsert') {
          const items = Array.isArray(this.payload) ? this.payload : [this.payload!];
          const next = [...rows];
          const result: Row[] = [];
          for (const it of items) {
            const idx = next.findIndex((r) =>
              this.conflictCols!.every((c) => String(r[c]) === String((it as Row)[c])),
            );
            if (idx >= 0) {
              next[idx] = { ...next[idx], ...it };
              result.push(next[idx]);
            } else {
              const row: Row = { ...it };
              if (row.id == null) row.id = nextId();
              if (row.created_at == null) row.created_at = new Date().toISOString();
              next.push(row);
              result.push(row);
            }
          }
          await saveTable(this.table, next);
          const data = this._single ? result[0] ?? null : result;
          return { data, error: null };
        }

        if (this.op === 'delete') {
          const next = rows.filter((r) => !this.filters.every((f) => matches(r, f)));
          await saveTable(this.table, next);
          return { data: null, error: null };
        }

        return { data: null, error: null };
      });
    } catch (e: any) {
      return { data: null, error: { message: e?.message ?? String(e) } };
    }
  }

  then<TResult1 = { data: any; error: any }, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: any }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.run().then(onfulfilled, onrejected);
  }
}

// ---------------------------------------------------------------------------
// Auth local (un solo usuario, sesión automática)
// ---------------------------------------------------------------------------
const LOCAL_USER = {
  id: 'local',
  email: 'local@lifeos.app',
  user_metadata: {} as Record<string, any>,
  app_metadata: {} as Record<string, any>,
  aud: 'authenticated',
  created_at: new Date(0).toISOString(),
};
const LOCAL_SESSION = { user: LOCAL_USER, access_token: 'local', token_type: 'bearer' };

const auth = {
  async getSession() { return { data: { session: LOCAL_SESSION }, error: null }; },
  async getUser() { return { data: { user: LOCAL_USER }, error: null }; },
  onAuthStateChange(cb: (event: string, session: any) => void) {
    // Notifica "ya autenticado" en el próximo tick (auto-login local).
    Promise.resolve().then(() => cb('SIGNED_IN', LOCAL_SESSION));
    return { data: { subscription: { unsubscribe() {} } } };
  },
  async signInWithPassword() { return { data: { user: LOCAL_USER, session: LOCAL_SESSION }, error: null }; },
  async signUp() { return { data: { user: LOCAL_USER, session: LOCAL_SESSION }, error: null }; },
  async signInWithOAuth() { return { data: { provider: 'local', url: null }, error: null }; },
  async signOut() { return { error: null }; },
  async updateUser(attrs: Record<string, any>) {
    Object.assign(LOCAL_USER.user_metadata, attrs?.data ?? {});
    return { data: { user: LOCAL_USER }, error: null };
  },
  async resetPasswordForEmail() { return { data: {}, error: null }; },
  async exchangeCodeForSession() { return { data: { session: LOCAL_SESSION }, error: null }; },
};

// ---------------------------------------------------------------------------
// Cliente
// ---------------------------------------------------------------------------
export const localClient = {
  from<T = any>(table: string) { return new LocalQuery<T>(table); },
  auth,
};

export type LocalClient = typeof localClient;
