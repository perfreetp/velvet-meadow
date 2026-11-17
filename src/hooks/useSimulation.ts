import { useEffect, useRef, useState } from 'react';
import type { ProjectData, SimResult } from '../types';
import { simulate } from '../engine/simulation';

/**
 * 仿真调度：数据变更后合并到动画帧执行，连续拖动时按 120ms 节流，
 * 结果通过 state 返回，保证热力图实时刷新又不阻塞拖拽。
 */
export function useSimulation(data: ProjectData, simVersion: number): SimResult | null {
  const [result, setResult] = useState<SimResult | null>(null);
  const timer = useRef<number | null>(null);
  const latest = useRef<ProjectData>(data);
  latest.current = data;

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const r = simulate(latest.current);
      setResult(r);
    }, 120);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [simVersion, data.timeHour, data.heatmapMode, data.luxThreshold, data.heatmapVisible, data.darkZoneVisible]);

  // 首次立即算一次
  useEffect(() => {
    setResult(simulate(latest.current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return result;
}
