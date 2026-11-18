import type {
  ArchiveRecord,
  ProjectFile,
  ProjectMeta,
  ProjectStats,
  WorkSettings
} from '../../types';
import { idb, STORE_ARCHIVES, STORE_PROJECTS } from './idb';

export const DEFAULT_SETTINGS: WorkSettings = {
  offsetDistance: 30,
  cornerMode: 'round',
  gridSpacing: 5,
  idwPower: 2,
  idwRadius: 60,
  curvatureAlert: 0.0008,
  colorMode: 'elevation',
  resampleSpacing: 3
};

export interface ProjectQuery {
  code?: string;
  reach?: string;
  /** 建模日期（按天，起止时间戳） */
  dateFrom?: number;
  dateTo?: number;
}

type Listener = () => void;

/**
 * 项目档案库：建档编号、当前工作项目、版本快照与检索。
 * 当前项目同时缓存于内存，UI 通过 subscribe 获得变更通知。
 */
class ProjectStore {
  private current: ProjectFile | null = null;
  private listeners = new Set<Listener>();

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(): void {
    for (const fn of this.listeners) fn();
  }

  get currentProject(): ProjectFile | null {
    return this.current;
  }

  /** 新建项目并建档编号 */
  async createProject(meta: Omit<ProjectMeta, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProjectFile> {
    const existing = await idb.get<ProjectFile>(STORE_PROJECTS, meta.code);
    if (existing) throw new Error(`项目编号 ${meta.code} 已存在`);
    const now = Date.now();
    const file: ProjectFile = {
      meta: {
        ...meta,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now
      },
      elevPoints: [],
      boundaries: [],
      centerControls: [],
      crestLeftControls: [],
      crestRightControls: [],
      offsetLines: [],
      settings: { ...DEFAULT_SETTINGS },
      unfoldResults: [],
      versions: [],
      currentVersion: 0
    };
    await idb.put(STORE_PROJECTS, file);
    this.current = file;
    this.emit();
    return file;
  }

  async openProject(code: string): Promise<ProjectFile> {
    const file = await idb.get<ProjectFile>(STORE_PROJECTS, code);
    if (!file) throw new Error(`未找到项目 ${code}`);
    this.current = file;
    this.emit();
    return file;
  }

  closeProject(): void {
    this.current = null;
    this.emit();
  }

  /** 局部更新当前项目并落库 */
  async update(mutator: (f: ProjectFile) => void): Promise<void> {
    if (!this.current) throw new Error('没有打开的项目');
    mutator(this.current);
    this.current.meta.updatedAt = Date.now();
    await idb.put(STORE_PROJECTS, structuredClone(this.current));
    this.emit();
  }

  async save(): Promise<void> {
    if (!this.current) return;
    this.current.meta.updatedAt = Date.now();
    await idb.put(STORE_PROJECTS, structuredClone(this.current));
    this.emit();
  }

  /** 保存一个加工版本（版本比对依据） */
  async saveVersion(note: string, stats: ProjectStats): Promise<number> {
    if (!this.current) throw new Error('没有打开的项目');
    const next = this.current.currentVersion + 1;
    this.current.versions.push({ version: next, createdAt: Date.now(), note, stats });
    this.current.currentVersion = next;
    await this.save();
    return next;
  }

  async listProjects(query: ProjectQuery = {}): Promise<ProjectMeta[]> {
    const all = await idb.getAll<ProjectFile>(STORE_PROJECTS);
    let metas = all.map((f) => f.meta);
    if (query.code) {
      const k = query.code.trim().toLowerCase();
      metas = metas.filter((m) => m.code.toLowerCase().includes(k));
    }
    if (query.reach) {
      const k = query.reach.trim().toLowerCase();
      metas = metas.filter((m) => m.reach.toLowerCase().includes(k));
    }
    if (query.dateFrom !== undefined) {
      metas = metas.filter((m) => m.updatedAt >= query.dateFrom!);
    }
    if (query.dateTo !== undefined) {
      metas = metas.filter((m) => m.updatedAt <= query.dateTo!);
    }
    return metas.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async deleteProject(code: string): Promise<void> {
    await idb.delete(STORE_PROJECTS, code);
    if (this.current?.meta.code === code) this.closeProject();
  }

  // —— 成果归档 ——
  async archive(record: ArchiveRecord): Promise<void> {
    await idb.put(STORE_ARCHIVES, record);
  }

  async listArchives(query: ProjectQuery = {}): Promise<ArchiveRecord[]> {
    let records = await idb.getAll<ArchiveRecord>(STORE_ARCHIVES);
    if (query.code) {
      const k = query.code.trim().toLowerCase();
      records = records.filter((r) => r.projectCode.toLowerCase().includes(k));
    }
    if (query.reach) {
      const k = query.reach.trim().toLowerCase();
      records = records.filter((r) => r.reach.toLowerCase().includes(k));
    }
    if (query.dateFrom !== undefined) records = records.filter((r) => r.createdAt >= query.dateFrom!);
    if (query.dateTo !== undefined) records = records.filter((r) => r.createdAt <= query.dateTo!);
    return records.sort((a, b) => b.createdAt - a.createdAt);
  }
}

export const projectStore = new ProjectStore();
