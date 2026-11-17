import { BaseComponent, sharedCss, toast } from './base';
import { repo } from '../core/db';
import { DocumentStore } from '../core/store';
import { EditorView } from './editor-view';
import { autoScore, gapCoverage } from '../core/scoring';
import type { Exercise, ManualScore, Submission } from '../core/types';

const CSS = `
:host { display: block; padding: 18px; max-width: 1200px; margin: 0 auto; }
.head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; gap: 10px; }
.head select { width: 240px; }
.split { display: grid; grid-template-columns: 1fr 360px; gap: 14px; }
.review-card { background: var(--panel); border: 1px solid var(--border); border-radius: 10px; padding: 14px; }
.mini-canvas { height: 420px; border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
.score-line { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #1e293b; }
.manual-item { background: var(--panel-2); border: 1px solid var(--border); border-radius: 8px; padding: 9px; margin-bottom: 8px; }
.manual-item input[type=number] { width: 70px; }
.big-score { font-size: 30px; font-weight: 700; color: var(--accent); }
`;

const DEFAULT_ITEMS: { item: string; maxScore: number }[] = [
  { item: '缺口段几何形状与参考轮廓吻合度', maxScore: 15 },
  { item: '圆弧/折线运用与曲率合理性', maxScore: 10 },
  { item: '布尔运算思路与结果正确性', maxScore: 10 },
  { item: '图层规范与图面整洁度', maxScore: 5 }
];

export class TeacherReviewView extends BaseComponent {
  private submissions: Submission[] = [];
  private exercises = new Map<string, Exercise>();
  private current: Submission | null = null;
  private store = new DocumentStore();

  protected render(): void {
    this.shadow.innerHTML = `<style>${sharedCss}${CSS}</style>
      <div class="head">
        <h2>作业复核评分</h2>
        <select id="filter-ex"><option value="">全部习题</option></select>
        <select id="filter-status">
          <option value="">全部状态</option>
          <option value="pending">待复核</option>
          <option value="reviewed">已复核</option>
        </select>
      </div>
      <div id="list"></div>
      <div id="review-host"></div>`;
    this.$('#filter-ex')!.addEventListener('change', () => this.renderList());
    this.$('#filter-status')!.addEventListener('change', () => this.renderList());
    void this.load();
  }

  private async load(): Promise<void> {
    const [subs, exs] = await Promise.all([repo.listSubmissions(), repo.listExercises()]);
    this.submissions = subs.sort((a, b) => b.submittedAt - a.submittedAt);
    this.exercises = new Map(exs.map(e => [e.id, e]));
    const sel = this.$('#filter-ex') as HTMLSelectElement;
    sel.innerHTML = '<option value="">全部习题</option>' +
      exs.map(e => `<option value="${e.id}">${e.title}</option>`).join('');
    this.renderList();
  }

  private renderList(): void {
    const fEx = (this.$('#filter-ex') as HTMLSelectElement).value;
    const fStatus = (this.$('#filter-status') as HTMLSelectElement).value;
    const rows = this.submissions
      .filter(s => !fEx || s.exerciseId === fEx)
      .filter(s => !fStatus || (fStatus === 'reviewed' ? s.reviewed : !s.reviewed));
    const el = this.$('#list')!;
    if (!rows.length) {
      el.innerHTML = '<div class="empty">暂无符合条件的提交</div>';
      this.$('#review-host')!.innerHTML = '';
      return;
    }
    el.innerHTML = `<div class="review-card" style="padding:0;overflow:hidden">
      <table>
        <thead><tr>
          <th>学员</th><th>习题</th><th>提交时间</th><th>自动分</th><th>最终分</th><th>状态</th><th></th>
        </tr></thead>
        <tbody>
          ${rows.map(s => `
            <tr>
              <td>${s.studentName}<div class="muted small">${s.studentId}</div></td>
              <td>${this.exercises.get(s.exerciseId)?.title ?? s.exerciseId}</td>
              <td>${new Date(s.submittedAt).toLocaleString('zh-CN')}</td>
              <td>${s.autoScore.total}</td>
              <td>${s.finalScore ?? '—'}</td>
              <td><span class="tag ${s.reviewed ? 'ok' : 'warn'}">${s.reviewed ? '已复核' : '待复核'}</span></td>
              <td><button data-open="${s.id}">${s.reviewed ? '查看/改分' : '复核打分'}</button></td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
    this.shadow.querySelectorAll('[data-open]').forEach(b =>
      b.addEventListener('click', () => this.openReview((b as HTMLElement).dataset.open!)));
    this.$('#review-host')!.innerHTML = '';
  }

  private async openReview(id: string): Promise<void> {
    const sub = this.submissions.find(s => s.id === id);
    if (!sub) return;
    this.current = sub;
    const ex = this.exercises.get(sub.exerciseId);
    this.store.load(JSON.parse(JSON.stringify(sub.doc)));
    const coverage = ex ? gapCoverage(sub.doc, ex) : { covered: 0, total: 0, ratio: 1 };

    const host = this.$('#review-host')!;
    host.innerHTML = `
      <div class="split" style="margin-top:16px">
        <div class="review-card">
          <h3>学员提交的矢量文档</h3>
          <div class="muted small" style="margin:6px 0 10px">
            ${sub.autoScore.detail}；缺口参考点覆盖 ${coverage.covered}/${coverage.total}
          </div>
          <div class="mini-canvas"><editor-view id="rv-editor"></editor-view></div>
        </div>
        <div class="review-card col">
          <h3>评分（满分 100）</h3>
          <div class="score-line"><span class="muted">自动 · 轮廓闭合度（40）</span><b>${sub.autoScore.closure}</b></div>
          <div class="score-line"><span class="muted">自动 · 交点数（20）</span><b>${sub.autoScore.intersection}</b></div>
          <div class="score-line"><span>自动小计</span><b>${sub.autoScore.total}</b></div>
          <hr>
          <div class="panel-title">教师逐项复核（手工部分 40 分）</div>
          <div id="manual-items"></div>
          <div class="score-line"><span>手工小计</span><b id="manual-sum">0</b></div>
          <div class="score-line"><span class="big-score">最终成绩</span><span class="big-score" id="final-score">${sub.autoScore.total}</span></div>
          <div><label>评语</label><textarea id="comment" rows="3">${sub.teacherComment}</textarea></div>
          <div class="row">
            <button class="primary" id="btn-save-score" style="flex:1">保存复核结果</button>
            <button id="btn-close">关闭</button>
          </div>
        </div>
      </div>`;

    const editor = this.$('#rv-editor') as EditorView;
    editor.store = this.store;
    editor.setReadOnly(true);

    const itemsHost = this.$('#manual-items')!;
    const existing = new Map(sub.manualScores.map(m => [m.item, m]));
    const items: ManualScore[] = DEFAULT_ITEMS.map(d => existing.get(d.item) ?? {
      item: d.item, score: 0, maxScore: d.maxScore, comment: ''
    });
    itemsHost.innerHTML = items.map((m, i) => `
      <div class="manual-item">
        <div class="row" style="justify-content:space-between">
          <span style="flex:1">${m.item}</span>
          <input type="number" min="0" max="${m.maxScore}" value="${m.score}" data-idx="${i}" data-role="score">
          <span class="muted">/ ${m.maxScore}</span>
        </div>
        <input placeholder="单项评语（可选）" value="${m.comment}" data-idx="${i}" data-role="comment" style="margin-top:6px">
      </div>`).join('');

    const recalc = () => {
      const sum = items.reduce((a, m) => a + (Number.isFinite(m.score) ? m.score : 0), 0);
      (this.$('#manual-sum')!).textContent = String(sum);
      (this.$('#final-score')!).textContent = String(sub.autoScore.total + sum);
    };
    itemsHost.querySelectorAll('input').forEach(inp => {
      inp.addEventListener('input', () => {
        const idx = parseInt((inp as HTMLElement).dataset.idx!, 10);
        const role = (inp as HTMLElement).dataset.role;
        if (role === 'score') items[idx].score = Math.max(0, Math.min(items[idx].maxScore, parseFloat((inp as HTMLInputElement).value) || 0));
        else items[idx].comment = (inp as HTMLInputElement).value;
        recalc();
      });
    });
    recalc();

    this.$('#btn-close')!.addEventListener('click', () => { host.innerHTML = ''; });
    this.$('#btn-save-score')!.addEventListener('click', async () => {
      const manualSum = items.reduce((a, m) => a + m.score, 0);
      const updated: Submission = {
        ...sub,
        manualScores: items,
        teacherComment: (this.$('#comment') as HTMLTextAreaElement).value,
        finalScore: sub.autoScore.total + manualSum,
        reviewed: true
      };
      await repo.saveSubmission(updated);
      toast(`复核完成，最终成绩 ${updated.finalScore} 分`);
      void this.load();
    });
  }
}

customElements.define('teacher-review-view', TeacherReviewView);
void autoScore;
