import { BaseComponent, sharedCss, toast } from './base';
import { repo } from '../core/db';
import { buildSeedData } from '../core/seed';
import { LoginView, type LoginResult } from './login-view';
import { TeacherClassesView } from './teacher-classes-view';
import { TeacherExercisesView } from './teacher-exercises-view';
import { TeacherExerciseEdit } from './teacher-exercise-edit';
import { TeacherReviewView } from './teacher-review-view';
import { TeacherSummaryView } from './teacher-summary-view';
import { StudentExerciseList } from './student-exercise-list';
import { StudentPracticeView } from './student-practice-view';
import { StudentHistoryView } from './student-history-view';
import type { Exercise, Role, Student } from '../core/types';

const CSS = `
:host { position: absolute; inset: 0; display: flex; flex-direction: column; background: var(--bg); }
.topbar {
  display: flex; align-items: center; gap: 4px; padding: 0 14px;
  height: 50px; background: #0b1220; border-bottom: 1px solid var(--border); flex-shrink: 0;
}
.brand { font-weight: 700; margin-right: 22px; color: var(--accent); white-space: nowrap; }
.topbar nav button { background: transparent; border: none; border-bottom: 2px solid transparent; border-radius: 0; padding: 0 14px; height: 50px; }
.topbar nav button.active { color: var(--accent); border-bottom-color: var(--accent); background: rgba(56,189,248,.08); }
.userbox { margin-left: auto; display: flex; align-items: center; gap: 12px; color: var(--muted); }
.content { flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: auto; }
.content.fit { overflow: hidden; }
`;

type TeacherPage = 'classes' | 'exercises' | 'review' | 'summary';

export class AppRoot extends BaseComponent {
  private userRole: Role | null = null;
  private student: Student | null = null;
  private classId = '';
  private teacherPage: TeacherPage = 'classes';
  private studentPage: 'list' | 'practice' | 'history' = 'list';
  private seeded = false;

  protected render(): void {
    this.shadow.innerHTML = `<style>${sharedCss}${CSS}</style>
      <div id="root" style="position:absolute;inset:0"></div>`;
    void this.ensureSeed();
    this.showLogin();
  }

  private async ensureSeed(): Promise<void> {
    if (this.seeded) return;
    const meta = await repo.getClass('__meta__');
    void meta;
    const classes = await repo.listClasses();
    if (classes.length === 0) {
      const seed = await buildSeedData();
      for (const c of seed.classes) await repo.saveClass(c);
      for (const e of seed.exercises) await repo.saveExercise(e);
      this.seeded = true;
      console.info('[练习台] 已写入示例班级与示例习题');
    }
  }

  private mount(el: HTMLElement, fit = false): void {
    const root = this.$('#root')!;
    root.innerHTML = '';
    root.appendChild(el);
    root.classList.toggle('fit', fit);
  }

  // ---------- 登录 ----------

  private showLogin(): void {
    const login = new LoginView();
    login.onLogin = (r: LoginResult) => {
      this.userRole = r.role;
      this.student = r.student ?? null;
      this.classId = r.classId ?? '';
      if (r.role === 'teacher') this.showTeacher();
      else this.showStudentList();
    };
    const host = document.createElement('div');
    host.style.cssText = 'position:absolute;inset:0';
    host.appendChild(login);
    this.mount(host, true);
  }

  // ---------- 教师端 ----------

  private showTeacher(): void {
    const shell = document.createElement('div');
    shell.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column';
    shell.innerHTML = `
      <div class="topbar">
        <span class="brand">🛠 断屑槽练习台 · 教师端</span>
        <nav>
          <button data-page="classes">班级学员</button>
          <button data-page="exercises">题库</button>
          <button data-page="review">作业复核</button>
          <button data-page="summary">成绩汇总</button>
        </nav>
        <div class="userbox">
          <span>教师</span>
          <button id="logout" class="icon">退出</button>
        </div>
      </div>
      <div class="content" id="page" style="flex:1"></div>`;
    this.mount(shell, true);
    shell.querySelectorAll('[data-page]').forEach(b => {
      b.addEventListener('click', () => {
        this.teacherPage = (b as HTMLElement).dataset.page as TeacherPage;
        this.renderTeacherPage();
        shell.querySelectorAll('[data-page]').forEach(x =>
          x.classList.toggle('active', (x as HTMLElement).dataset.page === this.teacherPage));
      });
    });
    shell.querySelector('#logout')!.addEventListener('click', () => {
      this.userRole = null;
      this.showLogin();
    });
    this.renderTeacherPage(shell);
    shell.querySelector(`[data-page="${this.teacherPage}"]`)?.classList.add('active');
  }

  private renderTeacherPage(shell?: HTMLElement): void {
    const host = (shell ?? this.$('#page')) as HTMLElement;
    const page = shell ? (shell.querySelector('#page') as HTMLElement) : host;
    page.innerHTML = '';
    if (this.teacherPage === 'classes') page.appendChild(new TeacherClassesView());
    if (this.teacherPage === 'exercises') {
      const view = new TeacherExercisesView();
      view.addEventListener('edit', (e: Event) => {
        const id = (e as CustomEvent).detail?.exerciseId as string | null;
        this.openExerciseEditor(id);
      });
      page.appendChild(view);
    }
    if (this.teacherPage === 'review') page.appendChild(new TeacherReviewView());
    if (this.teacherPage === 'summary') page.appendChild(new TeacherSummaryView());
  }

  private openExerciseEditor(exerciseId: string | null): void {
    const root = this.$('#root')!;
    root.innerHTML = '';
    const edit = new TeacherExerciseEdit();
    edit.exerciseId = exerciseId;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column';
    wrap.appendChild(edit);
    root.appendChild(wrap);
    root.classList.add('fit');
    edit.addEventListener('back', () => this.showTeacher());
  }

  // ---------- 学员端 ----------

  private showStudentList(): void {
    const shell = document.createElement('div');
    shell.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column';
    shell.innerHTML = `
      <div class="topbar">
        <span class="brand">🛠 断屑槽练习台 · 学员端</span>
        <div class="userbox">
          <span>${this.student?.studentNo} · ${this.student?.name}</span>
          <button id="logout" class="icon">退出</button>
        </div>
      </div>
      <div class="content" id="page" style="flex:1"></div>`;
    this.mount(shell, true);
    shell.querySelector('#logout')!.addEventListener('click', () => {
      this.userRole = null;
      this.showLogin();
    });
    const page = shell.querySelector('#page') as HTMLElement;
    const list = new StudentExerciseList(this.student!, this.classId);
    list.addEventListener('start', (e: Event) => {
      const ex = (e as CustomEvent).detail.exercise as Exercise;
      this.openPractice(ex);
    });
    list.addEventListener('history', () => this.openHistory(shell));
    page.appendChild(list);
  }

  private openPractice(exercise: Exercise): void {
    const root = this.$('#root')!;
    root.innerHTML = '';
    const view = new StudentPracticeView(exercise, this.student!, this.classId);
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column';
    wrap.appendChild(view);
    root.appendChild(wrap);
    root.classList.add('fit');
    view.addEventListener('back', () => this.showStudentList());
    view.addEventListener('submitted', () => {
      toast('已返回习题列表');
      this.showStudentList();
    });
  }

  private openHistory(shell: HTMLElement): void {
    const page = shell.querySelector('#page') as HTMLElement;
    page.innerHTML = '';
    const view = new StudentHistoryView(this.student!);
    view.addEventListener('back', () => this.showStudentList());
    page.appendChild(view);
  }
}

customElements.define('app-root', AppRoot);
