// 统一注册所有 Web Components（导入即注册）
import './ui/app-root';
import './ui/login-view';
import './ui/editor-canvas';
import './ui/editor-view';
import './ui/teacher-classes-view';
import './ui/teacher-exercises-view';
import './ui/teacher-exercise-edit';
import './ui/teacher-review-view';
import './ui/teacher-summary-view';
import './ui/student-exercise-list';
import './ui/student-practice-view';
import './ui/student-history-view';

document.addEventListener('DOMContentLoaded', () => {
  if (!customElements.get('app-root')) {
    throw new Error('app-root 组件注册失败');
  }
});
