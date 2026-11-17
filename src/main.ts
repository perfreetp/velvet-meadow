// 入口：注册全部 Web Components
import { GvsApp } from './ui/GvsApp';
import { IsoView } from './ui/IsoView';
import { TopView } from './ui/TopView';
import { SliceView } from './ui/SliceView';
import { LegendPanel } from './ui/LegendPanel';
import { BoreholePanel } from './ui/BoreholePanel';
import { SectionPanel } from './ui/SectionPanel';
import { Toolbar } from './ui/Toolbar';
import { ProjectList } from './ui/ProjectList';
import { WorkflowBar } from './ui/WorkflowBar';
import { StatBar } from './ui/StatBar';
import { ToastHost } from './ui/Toast';

const components: [string, CustomElementConstructor][] = [
  ['gvs-app', GvsApp],
  ['iso-view', IsoView],
  ['top-view', TopView],
  ['slice-view', SliceView],
  ['legend-panel', LegendPanel],
  ['borehole-panel', BoreholePanel],
  ['section-panel', SectionPanel],
  ['gvs-toolbar', Toolbar],
  ['project-list', ProjectList],
  ['workflow-bar', WorkflowBar],
  ['stat-bar', StatBar],
  ['toast-host', ToastHost]
];

for (const [name, ctor] of components) {
  if (!customElements.get(name)) customElements.define(name, ctor);
}

// 调试/自动化测试钩子（生产环境无副作用）
import { editorState } from './state/EditorState';
import { projectStore } from './state/ProjectStore';
import { fillFromBoreholes } from './core/BoreholeFiller';
import { buildProfile } from './core/Section';
import { buildMesh } from './core/Mesher';
import { exportOBJ, exportGLB, exportColorTable, buildDeliveryZip } from './core/Exporters';
(window as unknown as { __gvs?: unknown }).__gvs = {
  editorState,
  projectStore,
  fillFromBoreholes,
  buildProfile,
  buildMesh,
  exportOBJ,
  exportGLB,
  exportColorTable,
  buildDeliveryZip
};
