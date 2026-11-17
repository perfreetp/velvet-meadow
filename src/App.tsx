import LeftSidebar from './components/LeftSidebar';
import MapView, { data } from './components/MapView';
import RightSidebar from './components/RightSidebar';
import './styles.css';

export default function App() {
  const pointN = data.points.length;
  const featureN = pointN + data.buildings.length + data.pipelines.length + data.roads.length;

  return (
    <div class="app">
      <header class="topbar">
        <h1>智慧校园设施分层总图</h1>
        <span class="sub">后勤保障中心值班台</span>
        <span class="spacer" />
        <span class="stat">楼栋 <b>{data.buildings.length}</b> · 点位 <b>{pointN.toLocaleString()}</b> · 管线 <b>{data.pipelines.length}</b> · 总要素 <b>{featureN.toLocaleString()}</b></span>
      </header>
      <div class="main">
        <LeftSidebar />
        <MapView />
        <RightSidebar />
      </div>
    </div>
  );
}
