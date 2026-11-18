// 应用状态:持有当前参数/网络/底图/选中段,协调生成、锁定、归档。
import { DEFAULT_PARAMS } from './types.js';
import { generateNetwork } from './generator.js';
import { listSurveys, saveSurvey, deleteSurvey, nextArchiveId } from './db.js';
import { buildReport } from './report.js';
export class AppState extends EventTarget {
    params = { ...DEFAULT_PARAMS };
    network = null;
    basemap = null;
    opacities = [1, 1, 1];
    selectedId = null;
    archives = [];
    editMode = false;
    /** 生成代数:每次整体生成/载入档案时 +1,供视图决定是否复位相机 */
    genCounter = 0;
    emit(name) {
        this.dispatchEvent(new CustomEvent(name));
    }
    setParams(patch) {
        Object.assign(this.params, patch);
        this.emit('params-changed');
    }
    /** 整体生成/重生成:锁定段自动保留并与新网络接上 */
    generate() {
        const locked = this.network ? this.network.segments.filter((s) => s.locked) : [];
        // 连接段是派生物,不保留
        const lockedClean = locked.filter((s) => !s.id.includes('#link')).map((s) => ({ ...s }));
        this.network = generateNetwork(this.params, lockedClean);
        this.genCounter++;
        if (this.selectedId && !this.network.segments.some((s) => s.id === this.selectedId)) {
            this.selectedId = null;
        }
        this.emit('network-changed');
        this.emit('selection-changed');
    }
    get selected() {
        if (!this.network || !this.selectedId)
            return null;
        return this.network.segments.find((s) => s.id === this.selectedId) ?? null;
    }
    select(id) {
        this.selectedId = id;
        this.emit('selection-changed');
    }
    setLocked(id, locked) {
        const seg = this.network?.segments.find((s) => s.id === id);
        if (!seg)
            return;
        seg.locked = locked;
        if (locked)
            seg.custom = true;
        this.emit('network-changed');
    }
    /** 手动编辑顶点后调用:标记为手动修改 */
    markEdited(seg) {
        seg.custom = true;
        let L = 0;
        for (let i = 2; i < seg.points.length; i += 2) {
            L += Math.hypot(seg.points[i] - seg.points[i - 2], seg.points[i + 1] - seg.points[i - 1]);
        }
        seg.length = L;
        this.emit('network-changed');
    }
    setOpacities(o) {
        this.opacities = [...o];
        this.emit('opacities-changed');
    }
    async setBasemap(file) {
        const bmp = await createImageBitmap(file);
        this.basemap = { bmp, name: file.name, blob: file };
        this.emit('basemap-changed');
    }
    clearBasemap() {
        this.basemap = null;
        this.emit('basemap-changed');
    }
    async refreshArchives() {
        this.archives = await listSurveys();
        this.emit('archives-changed');
    }
    /** 归档当前网络(含底图与调查说明),返回档案编号 */
    async archiveCurrent(region, name) {
        if (!this.network)
            throw new Error('尚未生成网络');
        const year = new Date().getFullYear();
        const id = await nextArchiveId(year);
        const report = buildReport({ id, region, name, network: this.network, basemapName: this.basemap?.name ?? null });
        const archive = {
            id,
            year,
            region,
            name: name || id,
            params: { ...this.params },
            network: JSON.parse(JSON.stringify(this.network)),
            basemapName: this.basemap?.name ?? null,
            basemap: this.basemap?.blob,
            report,
            createdAt: new Date().toISOString(),
        };
        await saveSurvey(archive);
        await this.refreshArchives();
        return id;
    }
    async deleteArchive(id) {
        await deleteSurvey(id);
        await this.refreshArchives();
    }
    /** 载入档案到当前视图(参数与网络一并恢复) */
    loadArchive(a) {
        this.params = { ...a.params };
        this.network = JSON.parse(JSON.stringify(a.network));
        this.genCounter++;
        this.selectedId = null;
        this.emit('params-changed');
        this.emit('network-changed');
        this.emit('selection-changed');
    }
}
export const app = new AppState();
//# sourceMappingURL=state.js.map