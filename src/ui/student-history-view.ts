import { BaseComponent, sharedCss } from './base';
import { repo } from '../core/db';
import type { Exercise, Student, Submission } from '../core/types';

const CSS = `
:host { display: block; padding: 18px; max-width: 1000px; margin: 0 auto; }
.head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
`;

export class StudentHistoryView extends BaseComponent {
  student: Student;
  private submissions: Submission[] = [];
  private exercises = new Map<string, Exercise>();

  constructor(student: Student) {
    super();
    this.student = student;
  }

  protected render(): void {
    this.shadow.innerHTML = `<style>${sharedCss}${CSS}</style>
      <div class="head">
        <h2>我的提交记录</h2>
        <button id="btn-back">返回习题列表</button>
      </div>
      <div id="host"><div class="empty">加载中…</div></div>`;
    this.$('#btn-back')!.addEventListener('click', () => this.emitEvent('back'));
    void this.load();
  }

  private async load(): Promise<void> {
    const [subs, exs] = await Promise.all([
      repo.submissionsByStudent(this.student.id),
      repo.listExercises()
    ]);
    this.submissions = subs.sort((a, b) => b.submittedAt - a.submittedAt);
    this.exercises = new Map(exs.map(e => [e.id, e]));
    const host = this.$('#host')!;
    if (!subs.length) {
      host.innerHTML = '<div class="empty">还没有提交记录</div>';
      return;
    }
    host.innerHTML = `
      <div style="background:var(--panel);border:1px solid var(--border);border-radius:10px;overflow:hidden">
        <table>
          <thead><tr><th>习题</th><th>提交时间</th><th>自动分</th><th>教师复核</th><th>最终分</th><th>评语</th></tr></thead>
          <tbody>
            ${subs.map(s => `
              <tr>
                <td>${this.exercises.get(s.exerciseId)?.title ?? s.exerciseId}</td>
                <td>${new Date(s.submittedAt).toLocaleString('zh-CN')}</td>
                <td>${s.autoScore.total} / 60</td>
                <td>${s.reviewed ? s.manualScores.map(m => `${m.item.split('与')[0]} ${m.score}/${m.maxScore}`).join('<br>')
                  : '<span class="tag warn">待复核</span>'}</td>
                <td><b style="font-size:15px">${s.finalScore ?? '—'}</b></td>
                <td class="muted small">${s.teacherComment || '—'}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }
}

customElements.define('student-history-view', StudentHistoryView);
