import { BaseComponent, sharedCss, toast } from './base';
import { repo } from '../core/db';
import { summarizeClass, summaryToCsv } from '../core/scoring';
import type { ClassInfo, Exercise, Submission } from '../core/types';

const CSS = `
:host { display: block; padding: 18px; max-width: 1200px; margin: 0 auto; }
.head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; gap: 10px; }
.head select { width: 260px; }
.stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
.stat { background: var(--panel); border: 1px solid var(--border); border-radius: 10px; padding: 14px; }
.stat .num { font-size: 26px; font-weight: 700; color: var(--accent); }
.stat .lbl { color: var(--muted); font-size: 12px; margin-top: 4px; }
.weak { background: #451a1a; border: 1px solid #991b1b; border-radius: 8px; padding: 8px 10px; margin-top: 6px; }
`;

export class TeacherSummaryView extends BaseComponent {
  private classes: ClassInfo[] = [];
  private submissions: Submission[] = [];
  private exercises: Exercise[] = [];
  private classId = '';

  protected render(): void {
    this.shadow.innerHTML = `<style>${sharedCss}${CSS}</style>
      <div class="head">
        <h2>班级成绩与错题汇总</h2>
        <select id="sel-class"></select>
        <button id="btn-csv">导出 CSV 汇总</button>
      </div>
      <div id="stats"></div>
      <div id="table-host"></div>
      <div id="weak-host"></div>`;
    this.$('#sel-class')!.addEventListener('change', () => {
      this.classId = (this.$('#sel-class') as HTMLSelectElement).value;
      this.renderData();
    });
    this.$('#btn-csv')!.addEventListener('click', () => this.exportCsv());
    void this.load();
  }

  private async load(): Promise<void> {
    [this.classes, this.submissions, this.exercises] = await Promise.all([
      repo.listClasses(), repo.listSubmissions(), repo.listExercises()
    ]);
    const sel = this.$('#sel-class') as HTMLSelectElement;
    sel.innerHTML = this.classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('')
      || '<option value="">（暂无班级）</option>';
    this.classId = sel.value;
    this.renderData();
  }

  private renderData(): void {
    const clsSubs = this.submissions.filter(s => s.classId === this.classId);
    const titles = new Map(this.exercises.map(e => [e.id, e.title]));
    const rows = summarizeClass(clsSubs, titles);

    const reviewed = clsSubs.filter(s => s.reviewed).length;
    const avgAuto = clsSubs.length ? clsSubs.reduce((a, s) => a + s.autoScore.total, 0) / clsSubs.length : 0;
    const finals = clsSubs.filter(s => s.finalScore !== null).map(s => s.finalScore!);
    const avgFinal = finals.length ? finals.reduce((a, b) => a + b, 0) / finals.length : 0;
    const failCount = finals.filter(f => f < 60).length;

    this.$('#stats')!.innerHTML = `
      <div class="stat-grid">
        <div class="stat"><div class="num">${clsSubs.length}</div><div class="lbl">提交总数</div></div>
        <div class="stat"><div class="num">${reviewed}</div><div class="lbl">已复核</div></div>
        <div class="stat"><div class="num">${avgAuto.toFixed(1)}</div><div class="lbl">自动分平均</div></div>
        <div class="stat"><div class="num">${finals.length ? avgFinal.toFixed(1) : '—'}</div><div class="lbl">最终分平均（不及格 ${failCount} 人）</div></div>
      </div>`;

    this.$('#table-host')!.innerHTML = rows.length ? `
      <div class="review-card" style="background:var(--panel);border:1px solid var(--border);border-radius:10px;overflow:hidden">
        <table>
          <thead><tr>
            <th>学号</th><th>姓名</th><th>提交</th><th>已复核</th>
            <th>自动均分</th><th>最终均分</th><th>最高</th><th>最低</th>
          </tr></thead>
          <tbody>
            ${rows.map(r => `
              <tr>
                <td>${r.studentId}</td><td>${r.studentName}</td>
                <td>${r.submitted}</td><td>${r.reviewed}</td>
                <td>${r.avgAuto}</td><td><b>${r.avgFinal || '—'}</b></td>
                <td>${r.maxFinal || '—'}</td><td>${r.minFinal || '—'}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>` : '<div class="empty">该班还没有提交记录</div>';

    const weakItems = rows.flatMap(r => r.weakExercises.map(w => ({ student: r.studentName, ...w })));
    const byExercise = new Map<string, { title: string; students: string[] }>();
    for (const w of weakItems) {
      const entry = byExercise.get(w.exerciseId) ?? { title: w.title, students: [] };
      entry.students.push(`${w.student}(${w.failCount}次)`);
      byExercise.set(w.exerciseId, entry);
    }
    this.$('#weak-host')!.innerHTML = byExercise.size ? `
      <h3 style="margin:18px 0 8px">高频错题（最终分 &lt; 60）</h3>
      ${[...byExercise.entries()].map(([, v]) => `
        <div class="weak"><b>${v.title}</b>
          <div class="muted small" style="margin-top:4px">涉及学员：${v.students.join('、')}</div>
        </div>`).join('')}` : '';
  }

  private exportCsv(): void {
    const clsSubs = this.submissions.filter(s => s.classId === this.classId);
    if (!clsSubs.length) return toast('没有可导出的数据', 'warn');
    const titles = new Map(this.exercises.map(e => [e.id, e.title]));
    const csv = summaryToCsv(summarizeClass(clsSubs, titles));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `班级成绩汇总_${this.classes.find(c => c.id === this.classId)?.name ?? this.classId}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

customElements.define('teacher-summary-view', TeacherSummaryView);
