import { useEffect, useRef } from 'react';
import { useStore } from '../store';
import { ThreeStage, type CameraState } from '../three/ThreeStage';
import { locateBus } from '../locateBus';
import type { ProjectData, SimResult, Vec2 } from '../types';

interface Props {
  data: ProjectData;
  sim: SimResult | null;
  /** 共享相机状态：传入后该画布的平移缩放会写回，并接收外部更新（用于比对联动） */
  sharedCam?: React.MutableRefObject<CameraState | null>;
  height: number | string;
}

export default function SceneCanvas({ data, sim, sharedCam, height }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<ThreeStage | null>(null);
  const selectedId = useStore((s) => s.selectedId);
  const drawing = useStore((s) => s.drawing);

  useEffect(() => {
    if (!containerRef.current) return;
    const stage = new ThreeStage(containerRef.current, {
      onPick: (id) => useStore.getState().select(id),
      onDrag: (id, pos) => {
        const el = useStore.getState().data.elements.find((e) => e.id === id);
        if (!el) return;
        if (el.type === 'lamp') {
          useStore.getState().updateLamp(id, { pos });
        }
      },
      onVertexDrag: (id, index, pos) => {
        const el = useStore.getState().data.elements.find((e) => e.id === id);
        if (!el || el.type === 'lamp') return;
        const points = [...(el as { points: Vec2[] }).points];
        points[index] = pos;
        useStore.getState().updateElement(id, { points } as never);
      },
      onCanvasClick: (pos, shift) => {
        const st = useStore.getState();
        if (st.tool === 'comment') {
          st.addComment(pos, '审核人', shift ? '请核查此处照度是否达标' : '请在此处补充灯具或调整投射方向');
          st.setTool('select');
        } else if (st.tool !== 'select') {
          st.addDrawingPoint(pos);
        }
      },
      onCameraChange: (cam) => {
        if (sharedCam) {
          sharedCam.current = cam;
        }
      },
    });
    stageRef.current = stage;
    const onResize = () => stage.resize();
    window.addEventListener('resize', onResize);
    // 初始取景
    const waters = data.elements.filter((e) => e.type === 'water');
    const pts = waters.flatMap((e) => (e as { points: Vec2[] }).points);
    if (pts.length) stage.fitTo(pts, 1.15);
    if (sharedCam?.current) stage.setCamera(sharedCam.current, true);
    const unsub = locateBus.subscribe((x, y) => {
      const c = stage.getCamera();
      stage.setCamera({ centerX: x, centerY: y, zoom: Math.max(c.zoom, 8) });
    });
    return () => {
      window.removeEventListener('resize', onResize);
      unsub();
      stage.dispose();
      stageRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 数据变化重建
  useEffect(() => {
    stageRef.current?.rebuild(data, sim, selectedId, drawing);
  }, [data, sim, selectedId, drawing]);

  // 共享相机联动：每帧检查外部相机是否变化
  useEffect(() => {
    if (!sharedCam) return;
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const target = sharedCam.current;
      const cur = stageRef.current?.getCamera();
      if (target && cur && (
        Math.abs(target.centerX - cur.centerX) > 0.01 ||
        Math.abs(target.centerY - cur.centerY) > 0.01 ||
        Math.abs(target.zoom - cur.zoom) > 0.001
      )) {
        stageRef.current?.setCamera(target, true);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [sharedCam]);

  // 拖拽灯具库
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const kind = e.dataTransfer.getData('application/x-lamp-kind') as
      | 'flood' | 'wallWasher' | 'underwater' | 'lanternString' | null;
    if (!kind || !stageRef.current) return;
    const world = stageRef.current.toWorld(e.clientX, e.clientY);
    useStore.getState().addLamp(kind, world);
  };

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height, position: 'relative' }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    />
  );
}
