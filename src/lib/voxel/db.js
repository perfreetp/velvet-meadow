// IndexedDB 持久化：项目建档、版本快照、审批意见、归档检索
const DB_NAME = 'mold-voxel-studio';
const DB_VER = 1;

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('projects')) {
        const s = db.createObjectStore('projects', { keyPath: 'id' });
        s.createIndex('moldNo', 'moldNo', { unique: false });
        s.createIndex('materialNo', 'materialNo', { unique: false });
        s.createIndex('updatedAt', 'updatedAt', { unique: false });
        s.createIndex('archivedAt', 'archivedAt', { unique: false });
      }
      if (!db.objectStoreNames.contains('versions')) {
        const s = db.createObjectStore('versions', { keyPath: 'id' });
        s.createIndex('projectId', 'projectId', { unique: false });
        s.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(db, store, mode = 'readonly') {
  return db.transaction(store, mode).objectStore(store);
}

function reqPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function putProject(project) {
  const db = await openDB();
  project.updatedAt = Date.now();
  await reqPromise(tx(db, 'projects', 'readwrite').put(project));
  return project;
}

export async function getProject(id) {
  const db = await openDB();
  return reqPromise(tx(db, 'projects').get(id));
}

export async function listProjects({ includeArchived = true } = {}) {
  const db = await openDB();
  const all = await reqPromise(tx(db, 'projects').getAll());
  return all
    .filter((p) => includeArchived || !p.archivedAt)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * 归档检索：模号 / 料号 / 日期范围
 * @param {{moldNo?:string, materialNo?:string, from?:number, to?:number}} q
 */
export async function searchArchive(q = {}) {
  const db = await openDB();
  const all = await reqPromise(tx(db, 'projects').getAll());
  return all
    .filter((p) => p.archivedAt)
    .filter((p) => !q.moldNo || p.moldNo.includes(q.moldNo.trim()))
    .filter((p) => !q.materialNo || p.materialNo.includes(q.materialNo.trim()))
    .filter((p) => !q.from || p.archivedAt >= q.from)
    .filter((p) => !q.to || p.archivedAt <= q.to)
    .sort((a, b) => b.archivedAt - a.archivedAt);
}

export async function archiveProject(id, archived = true) {
  const db = await openDB();
  const p = await reqPromise(tx(db, 'projects').get(id));
  if (!p) throw new Error('项目不存在');
  p.archivedAt = archived ? Date.now() : null;
  p.updatedAt = Date.now();
  await reqPromise(tx(db, 'projects', 'readwrite').put(p));
  return p;
}

export async function deleteProject(id) {
  const db = await openDB();
  await reqPromise(tx(db, 'projects', 'readwrite').delete(id));
  const vStore = tx(db, 'versions', 'readwrite');
  const idx = vStore.index('projectId');
  const keys = await reqPromise(idx.getAllKeys(id));
  await Promise.all(keys.map((k) => reqPromise(vStore.delete(k))));
}

/**
 * 保存版本快照
 * doc: { id?, projectId, version, label, dims:{nx,ny,nz}, snapshot:Uint8Array,
 *        author, status, stats, createdAt?, reviewComment? }
 */
export async function putVersion(doc) {
  const db = await openDB();
  if (!doc.id) doc.id = `${doc.projectId}_v${doc.version}_${doc.createdAt || Date.now()}`;
  doc.createdAt = doc.createdAt || Date.now();
  await reqPromise(tx(db, 'versions', 'readwrite').put(doc));
  return doc;
}

export async function listVersions(projectId) {
  const db = await openDB();
  const all = await reqPromise(tx(db, 'versions').index('projectId').getAll(projectId));
  return all.sort((a, b) => b.version - a.version);
}

export async function getVersion(id) {
  const db = await openDB();
  return reqPromise(tx(db, 'versions').get(id));
}

/** 审批：通过 / 退回（退回意见挂在版本上） */
export async function reviewVersion(id, decision, comment = '') {
  const db = await openDB();
  const store = tx(db, 'versions', 'readwrite');
  const doc = await reqPromise(store.get(id));
  if (!doc) throw new Error('版本不存在');
  if (doc.status !== 'submitted') throw new Error('仅待审批版本可审批');
  doc.status = decision === 'approve' ? 'approved' : 'rejected';
  doc.reviewComment = decision === 'reject' ? comment : '';
  doc.reviewedAt = Date.now();
  await reqPromise(store.put(doc));
  return doc;
}

export async function exportDB() {
  const db = await openDB();
  const [projects, versions] = await Promise.all([
    reqPromise(tx(db, 'projects').getAll()),
    reqPromise(tx(db, 'versions').getAll())
  ]);
  return { exportedAt: Date.now(), projects, versions };
}
