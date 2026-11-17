import { BaseComponent, sharedCss, toast } from './base';
import { repo } from '../core/db';
import type { Exercise, Student, Submission } from '../core/types';

const CSS = `
:host { display: block; padding: 18px; max-width: 1000px; margin: 0 auto; }
.head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.ex-card {
  background: var(--panel); border: 1px solid var(--border); border-radius: 10px;
  padding: 16px; margin-bottom: 12px; display: flex; gap: 14px; align-items: center;
}
.ex-card .info { flex: 1; }
`;

export class StudentExerciseList extends BaseComponent {
  student: Student;
  classId: string;
  private exercises: Exercise[] = [];
  private submissions: Submission[] = [];

  constructor(student: Student, classId: string) {
    super();
    this.student = student;
    this.classId = classId;
  }

  protected render(): void {
    this.shadow.innerHTML = `<style>${sharedCss}${CSS}</style>
      <div class="head">
        <h2>你好，${this.student.name} · 待做习题</h2>
        <button id="btn-history">我的提交记录</button>
      </div>
      <div id="list"><div class="empty">加载中…</div></div>`;
    this.$('#btn-history')!.addEventListener('click', () => this.emitEvent('history'));
    void this.load();
  }

  private async load(): Promise<void> {
    const [exs, subs] = await Promise.all([
      repo.exercisesByClass(this.classId),
      repo.submissionsByStudent(this.student.id)
    ]);
    this.exercises = exs.sort((a, b) => b.createdAt - a.createdAt);
    this.submissions = subs;
    const el = this.$('#list')!;
    if (!exs.length) {
      el.innerHTML = '<div class="empty">教师还没有发布习题</div>';
      return;
    }
    el.innerHTML = exs.map(ex => {
      const mine = this.submissions.filter(s => s.exerciseId === ex.id);
      const latest = mine[0];
      const best = mine.reduce((m, s) => Math.max(m, s.finalScore ?? s.autoScore.total), 0);
      return `
      <div class="ex-card">
        <div class="info">
          <h3>${ex.title}</h3>
          <div class="muted small">${ex.description}</div>
          <div class="row" style="margin-top:6px">
            <span class="tag">缺口 ${ex.gaps.length} 处</span>
            <span class="tag">已提交 ${mine.length} 次</span>
            ${latest ? `<span class="tag ${latest.reviewed ? 'ok' : 'warn'}">${latest.reviewed ? `最终分 ${latest.finalScore}` : '待教师复核'}</span>` : ''}
            ${best > 0 ? `<span class="tag ok">历史最佳 ${best}</span>` : ''}
          </div>
        </div>
        <button class="primary" data-start="${ex.id}">${mine.length ? '再次练习' : '开始练习'}</button>
      </div>`;
    }).join('');
    this.shadow.querySelectorAll('[data-start]').forEach(b =>
      b.addEventListener('click', () => {
        const ex = this.exercises.find(e => e.id === (b as HTMLElement).dataset.start)!;
        this.emitEvent('start', { exercise: ex });
      }));
  }
}

customElements.define('student-exercise-list', StudentExerciseList);
void toast;
