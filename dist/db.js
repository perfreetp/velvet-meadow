// IndexedDB 档案库:编号归档 + 检索
const DB_NAME = 'tcn-archive';
const STORE = 'surveys';
function openDb() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE)) {
                const os = db.createObjectStore(STORE, { keyPath: 'id' });
                os.createIndex('year', 'year', { unique: false });
                os.createIndex('region', 'region', { unique: false });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}
function tx(mode, fn) {
    return openDb().then((db) => new Promise((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = fn(t.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        t.oncomplete = () => db.close();
    }));
}
export async function saveSurvey(a) {
    await tx('readwrite', (os) => os.put(a));
}
export async function getSurvey(id) {
    return tx('readonly', (os) => os.get(id));
}
export async function listSurveys() {
    const all = await tx('readonly', (os) => os.getAll());
    return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export async function deleteSurvey(id) {
    await tx('readwrite', (os) => os.delete(id));
}
/** 生成档案编号 TCN-YYYY-NNN(年内递增) */
export async function nextArchiveId(year) {
    const all = await listSurveys();
    const serial = all.filter((a) => a.year === year).length + 1;
    return `TCN-${year}-${String(serial).padStart(3, '0')}`;
}
export function filterArchives(all, f) {
    return all.filter((a) => {
        if (f.year != null && a.year !== f.year)
            return false;
        if (f.region && !a.region.includes(f.region))
            return false;
        if (f.level != null) {
            const lv = f.level;
            if (a.network.stats.counts[lv] <= 0)
                return false;
        }
        return true;
    });
}
//# sourceMappingURL=db.js.map