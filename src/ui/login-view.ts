import { BaseComponent, sharedCss } from './base';
import { repo } from '../core/db';
import type { ClassInfo, Role, Student } from '../core/types';
import { uid } from '../core/math2d';

const CSS = `
:host { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  background: radial-gradient(circle at 30% 20%, #12304b 0%, #0b111a 60%); }
.card {
  width: 420px; background: var(--panel); border: 1px solid var(--border);
  border-radius: 14px; padding: 30px; box-shadow: 0 20px 60px rgba(0,0,0,.5);
}
.logo { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
.sub { color: var(--muted); margin-bottom: 22px; font-size: 12px; }
.role-switch { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 18px; }
.role-switch button.active { background: #075985; border-color: var(--accent); }
.student-pick { display: grid; gap: 8px; }
`;

export interface LoginResult {
  role: Role;
  student?: Student;
  classId?: string;
}

export class LoginView extends BaseComponent {
  onLogin: (r: LoginResult) => void = () => {};
  private userRole: Role = 'teacher';
  private classes: ClassInfo[] = [];

  protected render(): void {
    this.shadow.innerHTML = `<style>${sharedCss}${CSS}</style>
      <div class="card">
        <div class="logo">🛠 断屑槽矢量编辑练习台</div>
        <div class="sub">数控车床培训中心 · 刀片槽型轮廓训练与评分系统</div>
        <div class="role-switch">
          <button id="r-teacher" class="active">教师端</button>
          <button id="r-student">学员端</button>
        </div>
        <div id="pane"></div>
      </div>`;
    this.$('#r-teacher')!.addEventListener('click', () => { this.userRole = 'teacher'; this.rerender(); });
    this.$('#r-student')!.addEventListener('click', () => { this.userRole = 'student'; this.rerender(); });
    this.renderPane();
  }

  private async renderPane(): Promise<void> {
    const pane = this.$('#pane')!;
    if (this.userRole === 'teacher') {
      pane.innerHTML = `
        <div class="col">
          <div class="muted small">教师可管理班级、出题、复核作业并查看班级汇总。数据保存在本机浏览器 IndexedDB。</div>
          <button class="primary" id="go-teacher" style="padding:10px">进入教师后台</button>
        </div>`;
      this.$('#go-teacher')!.addEventListener('click', () => this.onLogin({ role: 'teacher' }));
      return;
    }
    this.classes = await repo.listClasses();
    if (this.classes.length === 0) {
      pane.innerHTML = '<div class="empty">还没有班级，请先请教师在后台创建班级并添加学员</div>';
      return;
    }
    pane.innerHTML = `
      <div class="student-pick">
        <div><label>选择班级</label><select id="sel-class">
          ${this.classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
        </select></div>
        <div><label>选择学员</label><select id="sel-student"></select></div>
        <button class="primary" id="go-student" style="padding:10px">进入练习台</button>
      </div>`;
    const classSel = this.$('#sel-class') as HTMLSelectElement;
    const studentSel = this.$('#sel-student') as HTMLSelectElement;
    const fillStudents = () => {
      const cls = this.classes.find(c => c.id === classSel.value)!;
      studentSel.innerHTML = cls.students.map(s => `<option value="${s.id}">${s.studentNo} · ${s.name}</option>`).join('')
        || '<option value="">（该班暂无学员）</option>';
    };
    classSel.addEventListener('change', fillStudents);
    fillStudents();
    this.$('#go-student')!.addEventListener('click', () => {
      const cls = this.classes.find(c => c.id === classSel.value)!;
      const stu = cls.students.find(s => s.id === studentSel.value);
      if (!stu) return;
      this.onLogin({ role: 'student', student: stu, classId: cls.id });
    });
  }
}

customElements.define('login-view', LoginView);
void uid;
