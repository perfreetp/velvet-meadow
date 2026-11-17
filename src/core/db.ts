import type { ClassInfo, Exercise, Submission } from './types';

const DB_NAME = 'chipbreaker-trainer';
const DB_VERSION = 1;
const STORES = ['meta', 'classes', 'exercises', 'submissions'] as const;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const name of STORES) {
        if (!db.objectStoreNames.contains(name)) {
          const store = db.createObjectStore(name, { keyPath: 'id' });
          if (name === 'exercises') {
            store.createIndex('classId', 'classId');
            store.createIndex('createdAt', 'createdAt');
          }
          if (name === 'submissions') {
            store.createIndex('classId', 'classId');
            store.createIndex('exerciseId', 'exerciseId');
            store.createIndex('studentId', 'studentId');
          }
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDB().then(db => new Promise<T>((resolve, reject) => {
    const t = db.transaction(store, mode);
    const req = fn(t.objectStore(store));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
}

export async function dbPut<T extends { id: string }>(store: string, value: T): Promise<void> {
  await tx(store, 'readwrite', s => s.put(value) as IDBRequest<IDBValidKey>);
}

export async function dbGet<T>(store: string, id: string): Promise<T | undefined> {
  return tx<T | undefined>(store, 'readonly', s => s.get(id) as IDBRequest<T | undefined>);
}

export async function dbGetAll<T>(store: string): Promise<T[]> {
  return tx<T[]>(store, 'readonly', s => s.getAll() as IDBRequest<T[]>);
}

export async function dbDelete(store: string, id: string): Promise<void> {
  await tx(store, 'readwrite', s => s.delete(id) as IDBRequest<undefined>);
}

export async function dbGetAllByIndex<T>(store: string, index: string, value: string): Promise<T[]> {
  const db = await openDB();
  return new Promise<T[]>((resolve, reject) => {
    const t = db.transaction(store, 'readonly');
    const req = t.objectStore(store).index(index).getAll(value);
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

export const repo = {
  // 班级
  listClasses: () => dbGetAll<ClassInfo>('classes'),
  getClass: (id: string) => dbGet<ClassInfo>('classes', id),
  saveClass: (c: ClassInfo) => dbPut('classes', c),
  deleteClass: (id: string) => dbDelete('classes', id),

  // 习题
  listExercises: () => dbGetAll<Exercise>('exercises'),
  exercisesByClass: (classId: string) => dbGetAllByIndex<Exercise>('exercises', 'classId', classId),
  getExercise: (id: string) => dbGet<Exercise>('exercises', id),
  saveExercise: (e: Exercise) => dbPut('exercises', e),
  deleteExercise: (id: string) => dbDelete('exercises', id),

  // 提交
  listSubmissions: () => dbGetAll<Submission>('submissions'),
  submissionsByExercise: (exerciseId: string) =>
    dbGetAllByIndex<Submission>('submissions', 'exerciseId', exerciseId),
  submissionsByClass: (classId: string) =>
    dbGetAllByIndex<Submission>('submissions', 'classId', classId),
  submissionsByStudent: (studentId: string) =>
    dbGetAllByIndex<Submission>('submissions', 'studentId', studentId),
  saveSubmission: (s: Submission) => dbPut('submissions', s),
  deleteSubmission: (id: string) => dbDelete('submissions', id)
};
