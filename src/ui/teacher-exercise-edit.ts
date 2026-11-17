import { BaseComponent, sharedCss, toast } from './base';
import { DocumentStore } from '../core/store';
import { EditorView } from './editor-view';
import { repo } from '../core/db';
import { uid } from '../core/math2d';
import type { Exercise, GapMark, PathData } from '../core/types';

const CSS = `
:host { display: flex; flex-direction: column; flex: 1; min-height: 0; }
.author-bar {
  display: flex; gap: 10px; align-items: center; flex-wrap: wrap;
  padding: 10px 14px; background: var(--panel); border-bottom: 1px solid var(--border);
}
.author-bar input { width: 260px; }
.author-bar select { width: 200px; }
.stage {
  display: flex; align-items: center; gap: 6px; padding: 5px 10px;
  border: 1px solid var(--border); border-radius: 20px; background: var(--panel-2);
}
.stage b { color: var(--accent); }
`;

export class TeacherExerciseEdit extends BaseComponent {
  exerciseId: string | null = null;
  private store = new DocumentStore();
  private editor!: EditorView;
  private classes: { id: string; name: string }[] = [];
  /** 缺口标记模式下已选的两个端点 */
  private gapPick: string[] = [];
  private gapMode = false;

  protected render(): void {
    this.shadow.innerHTML = `<style>${sharedCss}${CSS}</style>
      <div class="author-bar">
        <div class="stage">步骤 <b>1</b> 绘制带缺口槽型 → <b>2</b> 标记缺口端点 → <b>3</b> 保存习题</div>
        <div style="flex:1"></div>
        <select id="sel-class"></select>
        <input id="ex-title" placeholder="习题标题，如：练习 2 圆弧槽底补齐">
        <input id="ex-inter" type="number" value="2" style="width:150px" title="期望学员布尔运算产生的交点数，-1 表示不考核">
        <button id="btn-gap" class="active">标记缺口</button>
        <button id="btn-save" class="primary">保存习题</button>
        <button id="btn-cancel">返回列表</button>
      </div>
      <editor-view></editor-view>
      <div id="gap-banner" hidden style="padding:8px 14px;background:#7c2d12;color:#ffedd5;font-size:12px">
        缺口标记模式：请依次点击缺口两端的锚点（已选 <span id="gap-count">0</span>/2）。再次点击「标记缺口」退出。
      </div>`;
  }

  protected async afterRender(): Promise<void> {
    this.editor = this.$('editor-view') as EditorView;
    this.editor.store = this.store;
    this.classes = await repo.listClasses();
    const sel = this.$('#sel-class') as HTMLSelectElement;
    sel.innerHTML = this.classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('')
      || '<option value="">（请先建班级）</option>';

    this.$('#btn-gap')!.addEventListener('click', () => this.toggleGapMode());
    this.$('#btn-save')!.addEventListener('click', () => this.save());
    this.$('#btn-cancel')!.addEventListener('click', () => this.emitEvent('back'));
    this.addEventListener('click', () => this.handleGapPick());

    if (this.exerciseId) {
      const ex = await repo.getExercise(this.exerciseId);
      if (ex) {
        (this.$('#ex-title') as HTMLInputElement).value = ex.title;
        (this.$('#ex-inter') as HTMLInputElement).value = String(ex.expectedIntersections);
        sel.value = ex.classId;
        // 编辑已有题：载入完整参考文档（referencePaths 合并回模板）
        const doc = JSON.parse(JSON.stringify(ex.template));
        for (const [pid, p] of Object.entries(ex.referencePaths)) doc.paths[pid] = p;
        for (const layer of doc.layers) {
          if (!layer.pathIds.some((id: string) => doc.paths[id])) layer.pathIds.push(...Object.keys(ex.referencePaths));
        }
        this.store.load(doc);
        this.gapPick = ex.gaps.flatMap(g => [g.anchorA, g.anchorB]);
      }
    }
  }

  private toggleGapMode(): void {
    this.gapMode = !this.gapMode;
    this.gapPick = [];
    this.$('#btn-gap')!.classList.toggle('active', this.gapMode);
    this.$('#gap-banner')!.hidden = !this.gapMode;
    const canvas = this.editor['canvas'] as { setTool: (t: string) => void };
    if (this.gapMode) canvas.setTool('select');
  }

  private handleGapPick(): void {
    if (!this.gapMode) return;
    const sel = this.store.selectedAnchor;
    if (!sel) return;
    if (this.gapPick.includes(sel.anchorId)) return;
    this.gapPick.push(sel.anchorId);
    (this.$('#gap-count')!).textContent = String(this.gapPick.length);
    if (this.gapPick.length === 2) {
      toast('缺口两端已标记，保存习题时系统将记录中间缺失锚点为参考答案');
      this.gapMode = false;
      this.$('#btn-gap')!.classList.remove('active');
      this.$('#gap-banner')!.hidden = true;
    }
  }

  private async save(): Promise<void> {
    const title = (this.$('#ex-title') as HTMLInputElement).value.trim();
    const classId = (this.$('#sel-class') as HTMLSelectElement).value;
    const expected = parseInt((this.$('#ex-inter') as HTMLInputElement).value, 10);
    if (!title) return toast('请填写习题标题', 'warn');
    if (!classId) return toast('请选择所属班级', 'warn');

    const closedPaths = Object.values(this.store.doc.paths).filter(p => p.closed && p.anchors.length >= 3);
    if (!closedPaths.length) return toast('至少需要一条闭合轮廓作为槽型', 'err');
    if (this.gapPick.length !== 2) return toast('请标记缺口的两个端点', 'warn');

    const refPath = closedPaths[0];
    const idxA = refPath.anchors.findIndex(a => a.id === this.gapPick[0]);
    const idxB = refPath.anchors.findIndex(a => a.id === this.gapPick[1]);
    if (idxA < 0 || idxB < 0) return toast('缺口端点不属于参考轮廓，请重新标记', 'err');

    // 缺失锚点 = 两端点之间（沿锚点顺序、不含端点）的点
    const missing: string[] = [];
    for (let i = (idxA + 1) % refPath.anchors.length; i !== idxB; i = (i + 1) % refPath.anchors.length) {
      missing.push(refPath.anchors[i].id);
      if (missing.length > refPath.anchors.length) break;
    }

    const gap: GapMark = {
      id: uid('gap'),
      pathId: refPath.id,
      anchorA: this.gapPick[0],
      anchorB: this.gapPick[1],
      missingAnchorIds: missing
    };

    // 模板文档：从参考路径中删除缺失锚点与相连边，形成开放缺口
    const templateDoc = this.store.snapshot;
    const tplPath = templateDoc.paths[refPath.id] as PathData;
    const removeSet = new Set(missing);
    tplPath.anchors = tplPath.anchors.filter(a => !removeSet.has(a.id));
    tplPath.segs = tplPath.segs.filter(s => !removeSet.has(s.a) && !removeSet.has(s.b));
    tplPath.closed = false;

    const referencePaths: Record<string, PathData> = {};
    for (const p of closedPaths) referencePaths[p.id] = JSON.parse(JSON.stringify(this.store.doc.paths[p.id]));

    const existing = this.exerciseId ? await repo.getExercise(this.exerciseId) : undefined;
    const exercise: Exercise = {
      id: existing?.id ?? uid('ex'),
      title,
      description: existing?.description ?? `请补齐橙色标记之间的缺口，使「${refPath.name}」重新闭合，并完成规定的布尔运算练习。`,
      classId,
      createdAt: existing?.createdAt ?? Date.now(),
      template: templateDoc,
      referencePaths,
      gaps: [gap],
      expectedIntersections: Number.isFinite(expected) ? expected : -1
    };
    await repo.saveExercise(exercise);
    toast('习题已保存到题库');
    this.emitEvent('back');
  }
}

customElements.define('teacher-exercise-edit', TeacherExerciseEdit);
