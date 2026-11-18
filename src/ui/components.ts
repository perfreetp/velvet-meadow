import { AppHeader } from './app-header.js';
import { ProjectDialog } from './project-dialog.js';
import { ToolBar } from './tool-bar.js';
import { SidePanel } from './side-panel.js';
import { CurvaturePanel } from './curvature-panel.js';
import { SectionPanel } from './section-panel.js';
import { UnfoldPanel } from './unfold-panel.js';
import { VersionDialog } from './version-dialog.js';
import { ArchiveDialog } from './archive-dialog.js';
import { StatusBar } from './status-bar.js';

export function registerComponents(): void {
  const defs: [string, CustomElementConstructor][] = [
    ['app-header', AppHeader],
    ['project-dialog', ProjectDialog],
    ['tool-bar', ToolBar],
    ['side-panel', SidePanel],
    ['curvature-panel', CurvaturePanel],
    ['section-panel', SectionPanel],
    ['unfold-panel', UnfoldPanel],
    ['version-dialog', VersionDialog],
    ['archive-dialog', ArchiveDialog],
    ['status-bar', StatusBar]
  ];
  for (const [name, ctor] of defs) {
    if (!customElements.get(name)) customElements.define(name, ctor);
  }
}
