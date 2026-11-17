import { BaseComponent, sharedCss, toast } from './base';
import { repo } from '../core/db';
import { uid } from '../core/math2d';
import type { ClassInfo, Student } from '../core/types';

const CSS = `
:host { display: block; padding: 18px; max-width: 1100px; margin: 0 auto; }
.head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.class-card { background: var(--panel); border: 1px solid var(--border); border-radius: 10px; padding: 16px; margin-bottom: 14px; }
.class-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.student-row { display: flex; gap: 8px; align-items: center; padding: 5px 0; border-bottom: 1px solid #1e293b; }
.student-row input { width: 130px; }
.student-row .grow { flex: 1; }
.dialog-mask {
  position: fixed; inset: 0; background: rgba(2,6,23,.65); z-index: 100;
  display: flex; align-items: center; justify-content: center;
}
.dialog {
  background: var(--panel); border: 1px solid var(--border); border-radius: 12px;
  padding: 22px; width: 460px; max-width: 92vw;
}
`;

export class TeacherClassesView extends BaseComponent {
  private classes: ClassInfo[] = [];
  private showAdd = false;

  protected render(): void {
    this.shadow.innerHTML = `<style>${sharedCss}${CSS}</style>
      <div class="head">
        <h2>班级与学员管理</h2>
        <button class="primary" id="btn-add-class">＋ 新建班级</button>
      </div>
      <div id="list"><div class="empty">加载中…</div></div>
      <div id="dialog-host"></div>`;
    this.$('#btn-add-class')!.addEventListener('click', () => { this.showAdd = true; this.renderDialog(); });
    void this.load();
  }

  private async load(): Promise<void> {
    this.classes = await repo.listClasses();
    const list = this.$('#list')!;
    if (!this.classes.length) {
      list.innerHTML = '<div class="empty">还没有班级，点击右上角新建</div>';
      return;
    }
    list.innerHTML = this.classes.map(c => `
      <div class="class-card">
        <div class="class-head">
          <h3>${c.name} <span class="tag">${c.students.length} 名学员</span></h3>
          <div class="row">
            <button data-addstu="${c.id}">＋ 添加学员</button>
            <button data-delcls="${c.id}" class="danger">删除班级</button>
          </div>
        </div>
        <table>
          <thead><tr><th style="width:160px">学号</th><th>姓名</th><th style="width:90px">操作</th></tr></thead>
          <tbody>
            ${c.students.map(s => `
              <tr>
                <td>${s.studentNo}</td><td>${s.name}</td>
                <td><button class="icon danger" data-delstu="${c.id}|${s.id}">移除</button></td>
              </tr>`).join('') || '<tr><td colspan="3" class="muted">暂无学员</td></tr>'}
          </tbody>
        </table>
      </div>`).join('');

    this.shadow.querySelectorAll('[data-addstu]').forEach(b => b.addEventListener('click', () => this.addStudent((b as HTMLElement).dataset.addstu!)));
    this.shadow.querySelectorAll('[data-delcls]').forEach(b => b.addEventListener('click', () => this.deleteClass((b as HTMLElement).dataset.delcls!)));
    this.shadow.querySelectorAll('[data-delstu]').forEach(b => b.addEventListener('click', () => {
      const [cid, sid] = (b as HTMLElement).dataset.delstu!.split('|');
      void this.removeStudent(cid!, sid!);
    }));
  }

  private renderDialog(): void {
    const host = this.$('#dialog-host')!;
    if (!this.showAdd) { host.innerHTML = ''; return; }
    host.innerHTML = `
      <div class="dialog-mask">
        <div class="dialog col">
          <h3>新建班级</h3>
          <div><label>班级名称</label><input id="cls-name" placeholder="如：数控车 2602 班"></div>
          <div class="row" style="justify-content:flex-end">
            <button id="dlg-cancel">取消</button>
            <button class="primary" id="dlg-ok">创建</button>
          </div>
        </div>
      </div>`;
    this.$('#dlg-cancel')!.addEventListener('click', () => { this.showAdd = false; this.renderDialog(); });
    this.$('#dlg-ok')!.addEventListener('click', async () => {
      const name = (this.$('#cls-name') as HTMLInputElement).value.trim();
      if (!name) return toast('请输入班级名称', 'warn');
      const cls: ClassInfo = { id: uid('class'), name, students: [], createdAt: Date.now() };
      await repo.saveClass(cls);
      this.showAdd = false;
      toast('班级已创建');
      void this.load();
      this.renderDialog();
    });
  }

  private async addStudent(classId: string): Promise<void> {
    const no = prompt('学员学号');
    if (!no) return;
    const name = prompt('学员姓名');
    if (!name) return;
    const cls = await repo.getClass(classId);
    if (!cls) return;
    if (cls.students.some(s => s.studentNo === no)) return toast('该学号已存在', 'err');
    const stu: Student = { id: uid('stu'), studentNo: no.trim(), name: name.trim() };
    cls.students.push(stu);
    await repo.saveClass(cls);
    toast('学员已添加');
    void this.load();
  }

  private async removeStudent(classId: string, studentId: string): Promise<void> {
    const cls = await repo.getClass(classId);
    if (!cls) return;
    cls.students = cls.students.filter(s => s.id !== studentId);
    await repo.saveClass(cls);
    void this.load();
  }

  private async deleteClass(id: string): Promise<void> {
    if (!confirm('删除班级将同时保留历史提交记录，确认删除？')) return;
    await repo.deleteClass(id);
    toast('班级已删除');
    void this.load();
  }
}

customElements.define('teacher-classes-view', TeacherClassesView);
