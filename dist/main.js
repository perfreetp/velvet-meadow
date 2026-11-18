// 入口:注册组件,初始化状态
import './components/viewport-canvas.js';
import './components/control-panel.js';
import './components/compare-view.js';
import './components/archive-panel.js';
import './components/report-view.js';
import './components/app-shell.js';
import { app } from './state.js';
async function boot() {
    document.body.innerHTML = '<tcn-app></tcn-app>';
    app.generate(); // 以默认参数 + 默认种子生成初始网络
    await app.refreshArchives();
}
void boot();
//# sourceMappingURL=main.js.map