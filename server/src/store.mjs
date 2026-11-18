import { promises as fs } from 'node:fs';
import path from 'node:path';
import { nanoid } from 'nanoid';

const DATA_DIR = path.resolve(process.env.LIGHTING_DATA_DIR || path.join(process.cwd(), 'data'));
const FILES = {
  plans: path.join(DATA_DIR, 'plans.json'),
  reviews: path.join(DATA_DIR, 'reviews.json'),
  annotations: path.join(DATA_DIR, 'annotations.json'),
};

async function ensure() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  for (const f of Object.values(FILES)) {
    try {
      await fs.access(f);
    } catch {
      await fs.writeFile(f, '[]', 'utf8');
    }
  }
}

async function readAll(kind) {
  await ensure();
  const raw = await fs.readFile(FILES[kind], 'utf8');
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

let writeChain = Promise.resolve();

async function writeAll(kind, rows) {
  await ensure();
  const target = FILES[kind];
  const tmp = `${target}.tmp-${process.pid}-${nanoid(6)}`;
  const payload = JSON.stringify(rows, null, 2);
  // 串行化写入，避免并发请求互相覆盖
  writeChain = writeChain.then(async () => {
    await fs.writeFile(tmp, payload, 'utf8');
    await fs.rename(tmp, target);
  });
  return writeChain;
}

export const Store = {
  async list(kind) {
    return readAll(kind);
  },

  async get(kind, id) {
    const rows = await readAll(kind);
    return rows.find((r) => r.id === id) || null;
  },

  async insert(kind, row) {
    const rows = await readAll(kind);
    const now = new Date().toISOString();
    const record = { id: nanoid(10), createdAt: now, updatedAt: now, ...row };
    rows.push(record);
    await writeAll(kind, rows);
    return record;
  },

  async update(kind, id, patch) {
    const rows = await readAll(kind);
    const idx = rows.findIndex((r) => r.id === id);
    if (idx < 0) return null;
    const now = new Date().toISOString();
    const next = { ...rows[idx], ...patch, id, updatedAt: now };
    rows[idx] = next;
    await writeAll(kind, rows);
    return next;
  },

  async remove(kind, id) {
    const rows = await readAll(kind);
    const idx = rows.findIndex((r) => r.id === id);
    if (idx < 0) return false;
    rows.splice(idx, 1);
    await writeAll(kind, rows);
    return true;
  },
};
