import { initializeApp, getApps, deleteApp, FirebaseApp } from 'firebase/app';
import { getDatabase, Database, ref, onValue, set, remove, get, Unsubscribe } from 'firebase/database';

export const DEFAULT_FIREBASE_RTDB_URL = 'https://restaurante1-695f7-default-rtdb.firebaseio.com';
const FIREBASE_URL_PREF_KEY = 'cusq_firebase_rtdb_url';

export type FirebaseSyncStatus = 'connecting' | 'connected' | 'permission_denied' | 'error';

export interface FirebaseSyncInfo {
  url: string;
  status: FirebaseSyncStatus;
  lastError: string | null;
  lastSyncAt: number | null;
}

let currentApp: FirebaseApp | null = null;
let currentDb: Database | null = null;
let currentUrl: string = '';

let syncInfo: FirebaseSyncInfo = {
  url: DEFAULT_FIREBASE_RTDB_URL,
  status: 'connecting',
  lastError: null,
  lastSyncAt: null,
};

export function normalizeFirebaseUrl(raw?: string): string {
  const trimmed = (raw || '').trim().replace(/\/+$/, '');
  if (!trimmed) return DEFAULT_FIREBASE_RTDB_URL;
  return trimmed;
}

export function getFirebaseDbUrl(): string {
  try {
    const saved = localStorage.getItem(FIREBASE_URL_PREF_KEY);
    if (saved && saved.trim().startsWith('https://')) {
      return normalizeFirebaseUrl(saved);
    }
  } catch {}
  return DEFAULT_FIREBASE_RTDB_URL;
}

export async function setFirebaseDbUrl(newUrl: string): Promise<void> {
  const clean = normalizeFirebaseUrl(newUrl);
  try {
    localStorage.setItem(FIREBASE_URL_PREF_KEY, clean);
  } catch {}
  if (currentApp && currentUrl !== clean) {
    try {
      await deleteApp(currentApp);
    } catch {}
    currentApp = null;
    currentDb = null;
  }
  syncInfo = { ...syncInfo, url: clean, status: 'connecting', lastError: null };
}

export function getFirebaseSyncInfo(): FirebaseSyncInfo {
  return { ...syncInfo, url: getFirebaseDbUrl() };
}

function extractProjectIdFromUrl(dbUrl: string): string {
  try {
    const host = new URL(dbUrl).hostname;
    const first = host.split('.')[0];
    return first.replace(/-default-rtdb$/, '') || 'restaurante1-695f7';
  } catch {
    return 'restaurante1-695f7';
  }
}

export function getFirebaseDatabase(): Database {
  const url = getFirebaseDbUrl();
  if (currentDb && currentUrl === url) {
    return currentDb;
  }

  const existing = getApps().find((a) => a.name === 'chuspa-rtdb');
  if (existing && currentUrl === url) {
    currentApp = existing;
    currentDb = getDatabase(existing, url);
    return currentDb;
  }

  const projectId = extractProjectIdFromUrl(url);
  currentApp = initializeApp(
    {
      projectId,
      databaseURL: url,
    },
    'chuspa-rtdb'
  );
  currentUrl = url;
  currentDb = getDatabase(currentApp, url);
  syncInfo = { ...syncInfo, url };
  return currentDb;
}

/**
 * Firebase Realtime Database rechaza valores `undefined`.
 * Limpia recursivamente objetos y arreglos antes de escribir en la nube.
 */
export function sanitizeForFirebase<T>(value: T): T {
  if (value === undefined) return null as unknown as T;
  if (value === null || typeof value !== 'object') return value;

  if (Array.isArray(value)) {
    return value.map((item) => (item === undefined ? null : sanitizeForFirebase(item))) as unknown as T;
  }

  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(value as Record<string, any>)) {
    if (v !== undefined) {
      out[k] = sanitizeForFirebase(v);
    }
  }
  return out as T;
}

export function normalizeFirebaseList<T>(raw: any): T[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.filter((item) => item !== null && item !== undefined);
  }
  if (typeof raw === 'object') {
    return Object.values(raw).filter((item) => item !== null && item !== undefined) as T[];
  }
  return [];
}

function classifyFirebaseError(err: unknown): { status: FirebaseSyncStatus; message: string } {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  if (lower.includes('permission_denied') || lower.includes('permission denied') || lower.includes('401')) {
    return {
      status: 'permission_denied',
      message:
        `Permiso denegado en ${getFirebaseDbUrl()}. Verifica las Reglas de Realtime Database en Firebase Console (".read" y ".write").`,
    };
  }
  return {
    status: 'error',
    message: msg,
  };
}

export function subscribeFirebaseRoot(
  onData: (snapshotVal: Record<string, any> | null) => void,
  onStatusChange: (info: FirebaseSyncInfo) => void
): () => void {
  const db = getFirebaseDatabase();
  const rootRef = ref(db, '/');
  const connectedRef = ref(db, '.info/connected');

  const unsubConnected: Unsubscribe = onValue(connectedRef, (snap) => {
    const isConnected = snap.val() === true;
    if (!isConnected && syncInfo.status === 'connected') {
      syncInfo = { ...syncInfo, status: 'connecting' };
      onStatusChange({ ...syncInfo });
    }
  });

  const unsubRoot: Unsubscribe = onValue(
    rootRef,
    (snapshot) => {
      syncInfo = {
        url: getFirebaseDbUrl(),
        status: 'connected',
        lastError: null,
        lastSyncAt: Date.now(),
      };
      onStatusChange({ ...syncInfo });
      onData((snapshot.val() as Record<string, any> | null) ?? null);
    },
    (error) => {
      const classified = classifyFirebaseError(error);
      syncInfo = {
        url: getFirebaseDbUrl(),
        status: classified.status,
        lastError: classified.message,
        lastSyncAt: syncInfo.lastSyncAt,
      };
      onStatusChange({ ...syncInfo });
    }
  );

  return () => {
    unsubConnected();
    unsubRoot();
  };
}

export async function fbSet(path: string, value: any): Promise<boolean> {
  try {
    const db = getFirebaseDatabase();
    const cleanPath = path.replace(/^\/+/, '');
    const targetRef = ref(db, cleanPath || '/');
    await set(targetRef, sanitizeForFirebase(value));
    syncInfo = {
      url: getFirebaseDbUrl(),
      status: 'connected',
      lastError: null,
      lastSyncAt: Date.now(),
    };
    return true;
  } catch (err) {
    const classified = classifyFirebaseError(err);
    syncInfo = {
      url: getFirebaseDbUrl(),
      status: classified.status,
      lastError: classified.message,
      lastSyncAt: syncInfo.lastSyncAt,
    };
    console.error(`[Firebase RTDB Write Error @ ${path}]:`, classified.message);
    return false;
  }
}

export async function fbRemove(path: string): Promise<boolean> {
  try {
    const db = getFirebaseDatabase();
    const cleanPath = path.replace(/^\/+/, '');
    await remove(ref(db, cleanPath));
    syncInfo = {
      url: getFirebaseDbUrl(),
      status: 'connected',
      lastError: null,
      lastSyncAt: Date.now(),
    };
    return true;
  } catch (err) {
    const classified = classifyFirebaseError(err);
    syncInfo = {
      url: getFirebaseDbUrl(),
      status: classified.status,
      lastError: classified.message,
      lastSyncAt: syncInfo.lastSyncAt,
    };
    console.error(`[Firebase RTDB Remove Error @ ${path}]:`, classified.message);
    return false;
  }
}

export async function fbTestConnection(customUrl?: string): Promise<{
  ok: boolean;
  status: FirebaseSyncStatus;
  message: string;
}> {
  const url = normalizeFirebaseUrl(customUrl || getFirebaseDbUrl());
  try {
    // 1. Prueba directa REST de lectura sobre la raíz o nodo de verificación
    const readRes = await fetch(`${url}/config.json`, { method: 'GET' });
    if (readRes.status === 401 || readRes.status === 403) {
      return {
        ok: false,
        status: 'permission_denied',
        message: `HTTP ${readRes.status}: Firebase rechazó la lectura por reglas de seguridad ("Permission denied"). Abre Firebase Console -> Realtime Database -> Reglas y habilita ".read" / ".write".`,
      };
    }
    if (!readRes.ok) {
      return {
        ok: false,
        status: 'error',
        message: `HTTP ${readRes.status} al consultar ${url}`,
      };
    }

    // 2. Prueba real de escritura temporal en nodo _ping_test para confirmar permisos de escritura
    const writeRes = await fetch(`${url}/_ping_test.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkedAt: Date.now() }),
    });
    if (writeRes.status === 401 || writeRes.status === 403) {
      return {
        ok: false,
        status: 'permission_denied',
        message: `Lectura permitida, pero escritura bloqueada (HTTP ${writeRes.status}). Configura ".write": true en las reglas de Firebase Realtime Database.`,
      };
    }
    if (!writeRes.ok) {
      return {
        ok: false,
        status: 'error',
        message: `Error de escritura HTTP ${writeRes.status} en ${url}`,
      };
    }

    // Limpiar nodo temporal
    await fetch(`${url}/_ping_test.json`, { method: 'DELETE' }).catch(() => {});

    // Verificar también SDK get
    try {
      const db = getFirebaseDatabase();
      await get(ref(db, 'config'));
    } catch {}

    return {
      ok: true,
      status: 'connected',
      message: `Conexión en tiempo real activa (lectura y escritura verificadas) con ${url}`,
    };
  } catch (err) {
    return {
      ok: false,
      status: 'error',
      message: `Error de red al conectar con ${url}: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
