import { BaseComponent, sharedCss, toast } from './base';
import { repo } from '../core/db';
import type { ClassInfo, Exercise } from '../core/types';

const CSS = `
:host { display: block; padding: 18px; max-width: 1100px; margin: 0 auto; }
.head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.ex-card {
  background: var(--panel); border: 1px solid var(--border); border-radius: 10px;
  padding: 14px 16px; margin-bottom: 10px; display: flex; gap: 14px; align-items: center;
}
.ex-card .info { flex: 1; }
.ex-card h3 { margin-bottom: 4px; }
`;

export class TeacherExercisesView extends BaseComponent {
  private exercises: Exercise[] = [];
  private classes: ClassInfo[] = [];

  protected render(): void {
    this.shadow.innerHTML = `<style>${sharedCss}${CSS}</style>
      <div class="head">
        <h2>题库管理</h2>
        <button class="primary" id="btn-new">＋ 新建习题</button>
      </div>
      <div id="list"><div class="empty">加载中…</div></div>`;
    this.$('#btn-new')!.addEventListener('click', () => this.emitEvent('edit', { exerciseId: null }));
    void this.load();
  }

  private async load(): Promise<void> {
    [this.exercises, this.classes] = await Promise.all([repo.listExercises(), repo.listClasses()]);
    const className = (id: string) => this.classes.find(c => c.id === id)?.name ?? '（班级已删除）';
    const el = this.$('#list')!;
    if (!this.exercises.length) {
      el.innerHTML = '<div class="empty">题库为空，点击「新建习题」在矢量编辑器里绘制带缺口槽型</div>';
      return;
    }
    el.innerHTML = this.exercises
      .sort((a, b) => b.createdAt - a.createdAt)
      .map(ex => `
      <div class="ex-card">
        <div class="info">
          <h3>${ex.title}</h3>
          <div class="muted small">${ex.description}</div>
          <div style="margin-top:6px" class="row">
            <span class="tag">${className(ex.classId)}</span>
            <span class="tag">缺口 ${ex.gaps.length} 处</span>
            <span class="tag">期望交点 ${ex.expectedIntersections < 0 ? '不考核' : ex.expectedIntersections}</span>
            <span class="tag">${new Date(ex.createdAt).toLocaleDateString('zh-CN')}</span>
          </div>
        </div>
        <div class="col">
          <button data-edit="${ex.id}">编辑</button>
          <button data-del="${ex.id}" class="danger">删除</button>
        </div>
      </div>`).join('');

    this.shadow.querySelectorAll('[data-edit]').forEach(b =>
      b.addEventListener('click', () => this.emitEvent('edit', { exerciseId: (b as HTMLElement).dataset.edit })));
    this.shadow.querySelectorAll('[data-del]').forEach(b =>
      b.addEventListener('click', () => this.deleteExercise((b as HTMLElement).dataset.del!)));
  }

  private async deleteExercise(id: string): Promise<void> {
    if (!confirm('确认删除该习题？历史提交记录不会被删除。')) return;
    await repo.deleteExercise(id);
    toast('习题已删除');
    void this.load();
  }
}

customElements.define('teacher-exercises-view', TeacherExercisesView);
