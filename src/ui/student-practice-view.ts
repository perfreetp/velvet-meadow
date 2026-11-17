import { BaseComponent, sharedCss, toast } from './base';
import { DocumentStore } from '../core/store';
import { EditorView } from './editor-view';
import { repo } from '../core/db';
import { autoScore } from '../core/scoring';
import { uid } from '../core/math2d';
import type { Exercise, Student, Submission, Vec2 } from '../core/types';

const CSS = `
:host { display: flex; flex-direction: column; flex: 1; min-height: 0; }
.brief {
  padding: 10px 16px; background: #1c1917; border-bottom: 1px solid #57341c;
  display: flex; gap: 14px; align-items: center;
}
.brief .txt { flex: 1; }
.brief h3 { color: #fdba74; }
.brief .muted { font-size: 12px; margin-top: 2px; }
.auto-panel {
  background: var(--panel); border: 1px solid var(--border); border-radius: 10px;
  padding: 14px; margin-top: 10px;
}
.score-big { font-size: 34px; font-weight: 700; color: var(--ok); }
`;

export class StudentPracticeView extends BaseComponent {
  exercise: Exercise;
  student: Student;
  classId: string;
  private store = new DocumentStore();
  private editor!: EditorView;

  constructor(exercise: Exercise, student: Student, classId: string) {
    super();
    this.exercise = exercise;
    this.student = student;
    this.classId = classId;
  }

  protected render(): void {
    this.shadow.innerHTML = `<style>${sharedCss}${CSS}</style>
      <div class="brief">
        <div class="txt">
          <h3>${this.exercise.title}</h3>
          <div class="muted">${this.exercise.description} ｜ 橙色圆圈标记缺口两端，请补齐后再做布尔运算。</div>
        </div>
        <button id="btn-check">自动预检</button>
        <button id="btn-submit" class="primary">提交作业</button>
        <button id="btn-back">返回列表</button>
      </div>
      <editor-view></editor-view>
      <div id="result-host" style="padding:0 16px 16px"></div>`;
  }

  protected afterRender(): void {
    this.editor = this.$('editor-view') as EditorView;
    this.editor.store = this.store;
    this.editor.showSubmit = false;

    // 载入带缺口模板
    this.store.load(JSON.parse(JSON.stringify(this.exercise.template)));

    // 缺口端点高亮
    requestAnimationFrame(() => {
      const canvas = this.editor['canvas'] as {
        setGapEnds: (pts: Vec2[]) => void;
        fitView: () => void;
      };
      const gapPts: Vec2[] = [];
      for (const gap of this.exercise.gaps) {
        for (const pid of [gap.pathId]) {
          const p = this.store.doc.paths[pid];
          if (!p) continue;
          for (const aid of [gap.anchorA, gap.anchorB]) {
            const a = p.anchors.find(x => x.id === aid);
            if (a) gapPts.push({ x: a.x, y: a.y });
          }
        }
      }
      canvas.setGapEnds(gapPts);
      canvas.fitView();
    });

    this.$('#btn-back')!.addEventListener('click', () => this.emitEvent('back'));
    this.$('#btn-check')!.addEventListener('click', () => this.precheck(false));
    this.$('#btn-submit')!.addEventListener('click', () => this.submit());
  }

  private precheck(persist: boolean): { score: ReturnType<typeof autoScore> } {
    const score = autoScore(this.store.doc, this.exercise);
    const host = this.$('#result-host')!;
    host.innerHTML = `
      <div class="auto-panel row" style="justify-content:space-between;flex-wrap:wrap">
        <div>
          <div class="panel-title">自动评分（占总分 60 分）</div>
          <div class="muted small" style="margin:6px 0">${score.detail}</div>
          <div class="row" style="gap:18px">
            <span>轮廓闭合度：<b>${score.closure}</b> / 40</span>
            <span>交点数：<b>${score.intersection}</b> / 20</span>
          </div>
        </div>
        <div class="score-big">${score.total}<span class="muted" style="font-size:14px"> / 60</span></div>
      </div>
      <div class="muted small" style="margin-top:8px">
        提交后教师将按几何吻合度、曲率合理性、布尔运算思路、图面规范四项复核，补齐剩余 40 分。
      </div>`;
    if (!persist) toast(`预检完成：自动分 ${score.total}/60`);
    return { score };
  }

  private async submit(): Promise<void> {
    const closed = Object.values(this.store.doc.paths).filter(p => p.closed);
    if (!closed.length) {
      if (!confirm('当前还没有闭合轮廓，确认要提交吗？')) return;
    }
    const { score } = this.precheck(true);
    const submission: Submission = {
      id: uid('sub'),
      exerciseId: this.exercise.id,
      classId: this.classId,
      studentId: this.student.id,
      studentName: this.student.name,
      submittedAt: Date.now(),
      doc: this.store.snapshot,
      autoScore: {
        closure: score.closure,
        intersection: score.intersection,
        total: score.total,
        detail: score.detail
      },
      manualScores: [],
      finalScore: null,
      teacherComment: '',
      reviewed: false
    };
    await repo.saveSubmission(submission);
    toast('作业已提交，等待教师复核', 'info', 3600);
    this.emitEvent('submitted', { submission });
  }
}

customElements.define('student-practice-view', StudentPracticeView);
