/** 极简 IndexedDB Promise 封装 */

const DB_NAME = 'river-workbench-db';
const DB_VERSION = 1;
export const STORE_PROJECTS = 'projects';
export const STORE_ARCHIVES = 'archives';

let dbPromise: Promise<IDBDatabase> | null = null;

export function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        db.createObjectStore(STORE_PROJECTS, { keyPath: 'meta.code' });
      }
      if (!db.objectStoreNames.contains(STORE_ARCHIVES)) {
        const s = db.createObjectStore(STORE_ARCHIVES, { keyPath: 'id' });
        s.createIndex('projectCode', 'projectCode', { unique: false });
        s.createIndex('reach', 'reach', { unique: false });
        s.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const req = fn(t.objectStore(store));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      })
  );
}

export const idb = {
  put<T>(store: string, value: T): Promise<IDBValidKey> {
    return tx(store, 'readwrite', (s) => s.put(value as unknown as object));
  },
  get<T>(store: string, key: IDBValidKey): Promise<T | undefined> {
    return tx(store, 'readonly', (s) => s.get(key) as IDBRequest<T | undefined>);
  },
  delete(store: string, key: IDBValidKey): Promise<undefined> {
    return tx(store, 'readonly', (s) => s.delete(key) as IDBRequest<undefined>);
  },
  async getAll<T>(store: string): Promise<T[]> {
    const db = await openDb();
    return new Promise<T[]>((resolve, reject) => {
      const t = db.transaction(store, 'readonly');
      const req = t.objectStore(store).getAll();
      req.onsuccess = () => resolve(req.result as T[]);
      req.onerror = () => reject(req.error);
    });
  },
  async getAllByIndex<T>(store: string, index: string, range?: IDBKeyRange): Promise<T[]> {
    const db = await openDb();
    return new Promise<T[]>((resolve, reject) => {
      const t = db.transaction(store, 'readonly');
      const req = t.objectStore(store).index(index).getAll(range);
      req.onsuccess = () => resolve(req.result as T[]);
      req.onerror = () => reject(req.error);
    });
  }
};
