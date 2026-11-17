// 项目库：localStorage 持久化 + 下单/制作/审核/交付工作流
import type { ProjectData, ProjectMeta, ProjectStatus, ReviewRecord, Role } from '../types';

const KEY = 'gvs.projects.v1';

function readAll(): ProjectData[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ProjectData[];
  } catch {
    return [];
  }
}

function writeAll(list: ProjectData[]): void {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export const DEFAULT_MATERIALS = [
  { id: 1, name: '杂填土', color: '#a27b54', pattern: 'dots' },
  { id: 2, name: '粉质黏土', color: '#c9a86a', pattern: 'lines' },
  { id: 3, name: '粉砂', color: '#d9c78e', pattern: 'grid' },
  { id: 4, name: '砾砂', color: '#9d9489', pattern: 'pebble' },
  { id: 5, name: '强风化岩', color: '#7d6b5d', pattern: 'slash' },
  { id: 6, name: '中风化岩', color: '#5f6b7a', pattern: 'cross' },
  { id: 7, name: '微风化岩', color: '#46536b', pattern: 'solid' }
];

export interface NewProjectInput {
  name: string;
  client: string;
  site: string;
  nx: number;
  ny: number;
  nz: number;
  cell: number;
}

export const Workflow: Record<ProjectStatus, { next: ProjectStatus | null; label: string; allow: Role[] }> = {
  ordered: { next: 'in_progress', label: '开始制作', allow: ['maker'] },
  in_progress: { next: 'submitted', label: '提交审核', allow: ['maker'] },
  submitted: { next: 'delivered', label: '审核通过', allow: ['supervisor'] },
  rework: { next: 'in_progress', label: '重新制作', allow: ['maker'] },
  delivered: { next: null, label: '已交付', allow: [] }
};

export class ProjectStore {
  list(): ProjectMeta[] {
    return readAll().map((p): ProjectMeta => ({
      id: p.id,
      name: p.name,
      client: p.client,
      site: p.site,
      status: p.status,
      role: p.role,
      nx: p.nx,
      ny: p.ny,
      nz: p.nz,
      cell: p.cell,
      reworkCount: p.reworkCount,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      reviewLog: p.reviewLog
    }));
  }

  get(id: string): ProjectData | undefined {
    return readAll().find((p) => p.id === id);
  }

  create(input: NewProjectInput): ProjectData {
    const now = Date.now();
    const project: ProjectData = {
      id: 'P' + now.toString(36).toUpperCase() + Math.floor(now % 7).toString(),
      name: input.name,
      client: input.client,
      site: input.site,
      status: 'ordered',
      role: 'maker',
      nx: input.nx,
      ny: input.ny,
      nz: input.nz,
      cell: input.cell,
      reworkCount: 0,
      createdAt: now,
      updatedAt: now,
      reviewLog: [],
      materials: DEFAULT_MATERIALS.map((m) => ({ ...m })),
      boreholes: [],
      sections: [],
      voxelsB64: ''
    };
    const all = readAll();
    all.push(project);
    writeAll(all);
    return project;
  }

  save(data: ProjectData): void {
    data.updatedAt = Date.now();
    const all = readAll();
    const i = all.findIndex((p) => p.id === data.id);
    if (i >= 0) all[i] = data;
    else all.push(data);
    writeAll(all);
  }

  remove(id: string): void {
    writeAll(readAll().filter((p) => p.id !== id));
  }

  /** 工作流流转；退回时累加返工次数 */
  transition(id: string, action: ReviewRecord['action'], operator: string, comment = ''): ProjectData {
    const all = readAll();
    const p = all.find((x) => x.id === id);
    if (!p) throw new Error('项目不存在');
    const rec: ReviewRecord = { time: Date.now(), action, comment, operator };
    switch (action) {
      case 'start':
        p.status = 'in_progress';
        break;
      case 'submit':
        p.status = 'submitted';
        break;
      case 'approve':
        p.status = 'delivered';
        break;
      case 'reject':
        p.status = 'rework';
        p.reworkCount += 1;
        break;
    }
    p.reviewLog.push(rec);
    p.updatedAt = Date.now();
    writeAll(all);
    return p;
  }
}

export const projectStore = new ProjectStore();
