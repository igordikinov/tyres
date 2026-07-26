import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  DEFAULT_SPEED,
  HORIZON_MINUTES,
  KPI_REFRESH_MS,
  MAX_FRAME_MINUTES,
  SIM_MINUTES_PER_REAL_SECOND,
  STEP_MINUTES,
  type SpeedOption,
} from '@/core/constants';
import { FactoryEngine } from '@/core/engine';
import { baselineParams, getScenario, nodeDefsById, optimisedParams } from '@/core/scenario';
import type { ParamKey, Params, Snapshot } from '@/core/types';
import { useAnimationFrame } from '@/hooks/useAnimationFrame';
import {
  ControlsContext,
  FrameContext,
  KpiContext,
  useSimulationControls,
  useSimulationFrame,
  useSimulationKpi,
  type DemoMode,
  type SimulationControls,
} from './contexts';

export type { DemoMode } from './contexts';
export { useSimulationControls, useSimulationFrame, useSimulationKpi } from './contexts';

/**
 * Owns the engine and the animation loop, and publishes three separate
 * contexts so that a 60 fps canvas does not force the parameter panel and the
 * KPI cards to reconcile on every frame.
 */
export function SimulationProvider({ children }: { children: ReactNode }) {
  const scenario = useMemo(() => getScenario(), []);
  const defs = useMemo(() => nodeDefsById(scenario), [scenario]);
  const engineRef = useRef<FactoryEngine | null>(null);
  if (engineRef.current === null) {
    engineRef.current = new FactoryEngine(scenario, baselineParams(scenario));
  }
  const engine = engineRef.current;

  const [snapshot, setSnapshot] = useState<Snapshot>(() => engine.getSnapshot());
  const [kpiFrame, setKpiFrame] = useState(() => {
    const initial = engine.getSnapshot();
    return { kpi: initial.kpi, history: initial.history, time: initial.time };
  });
  const [params, setParams] = useState<Params>(() => baselineParams(scenario));
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<SpeedOption>(DEFAULT_SPEED);
  const [tocMode, setTocMode] = useState(false);
  const [apsMode, setApsMode] = useState(false);
  const [demoMode, setDemoMode] = useState<DemoMode>('live');

  const playingRef = useRef(playing);
  const speedRef = useRef<SpeedOption>(speed);
  const dirtyRef = useRef(true);
  const lastKpiRef = useRef(0);

  // Refs are written in an effect so a discarded render never mutates them.
  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  const publish = useCallback(
    (now: number) => {
      const next = engine.getSnapshot();
      setSnapshot(next);
      if (now - lastKpiRef.current >= KPI_REFRESH_MS) {
        lastKpiRef.current = now;
        setKpiFrame({ kpi: next.kpi, history: next.history, time: next.time });
      }
    },
    [engine],
  );

  useAnimationFrame((deltaSeconds, now) => {
    let advanced = false;
    if (playingRef.current) {
      const requested = deltaSeconds * SIM_MINUTES_PER_REAL_SECOND * speedRef.current;
      const minutes = Math.min(requested, MAX_FRAME_MINUTES);
      const remaining = HORIZON_MINUTES - engine.time;
      if (remaining <= 0) {
        playingRef.current = false;
        setPlaying(false);
      } else {
        engine.advance(Math.min(minutes, remaining));
        advanced = true;
      }
    }
    if (!advanced && !dirtyRef.current) return;
    dirtyRef.current = false;
    publish(now);
  });

  const markDirty = useCallback(() => {
    dirtyRef.current = true;
  }, []);

  const play = useCallback(() => {
    if (engine.time >= HORIZON_MINUTES) engine.seek(0);
    playingRef.current = true;
    setPlaying(true);
    markDirty();
  }, [engine, markDirty]);

  const pause = useCallback(() => {
    playingRef.current = false;
    setPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    const next = !playingRef.current;
    if (next && engine.time >= HORIZON_MINUTES) engine.seek(0);
    playingRef.current = next;
    setPlaying(next);
    markDirty();
  }, [engine, markDirty]);

  const step = useCallback(() => {
    playingRef.current = false;
    setPlaying(false);
    engine.advance(Math.min(STEP_MINUTES, Math.max(HORIZON_MINUTES - engine.time, 0)));
    markDirty();
  }, [engine, markDirty]);

  const reset = useCallback(() => {
    playingRef.current = false;
    setPlaying(false);
    engine.seek(0);
    markDirty();
  }, [engine, markDirty]);

  const seek = useCallback(
    (minutes: number) => {
      engine.seek(Math.min(Math.max(minutes, 0), HORIZON_MINUTES));
      markDirty();
    },
    [engine, markDirty],
  );

  const commitParams = useCallback(
    (next: Params) => {
      setParams(next);
      engine.applyParams(next);
      markDirty();
    },
    [engine, markDirty],
  );

  const setParam = useCallback(
    (key: ParamKey, value: number) => commitParams({ ...engine.getParams(), [key]: value }),
    [commitParams, engine],
  );

  const restoreBaseline = useCallback(
    () => commitParams(baselineParams(scenario)),
    [commitParams, scenario],
  );

  const applyOptimised = useCallback(
    () => commitParams(optimisedParams(scenario)),
    [commitParams, scenario],
  );

  const controls = useMemo<SimulationControls>(
    () => ({
      scenario,
      defs,
      params,
      playing,
      speed,
      tocMode,
      apsMode,
      demoMode,
      play,
      pause,
      togglePlay,
      step,
      reset,
      seek,
      setSpeed,
      setParam,
      restoreBaseline,
      applyOptimised,
      setTocMode,
      setApsMode,
      setDemoMode,
    }),
    [
      scenario,
      defs,
      params,
      playing,
      speed,
      tocMode,
      apsMode,
      demoMode,
      play,
      pause,
      togglePlay,
      step,
      reset,
      seek,
      setParam,
      restoreBaseline,
      applyOptimised,
    ],
  );

  const frame = useMemo(() => ({ snapshot }), [snapshot]);

  return (
    <ControlsContext.Provider value={controls}>
      <KpiContext.Provider value={kpiFrame}>
        <FrameContext.Provider value={frame}>{children}</FrameContext.Provider>
      </KpiContext.Provider>
    </ControlsContext.Provider>
  );
}

/** Convenience hook for components that legitimately need every slice. */
export function useSimulation() {
  const controls = useSimulationControls();
  const { snapshot } = useSimulationFrame();
  const { kpi, history } = useSimulationKpi();
  return { ...controls, snapshot, kpi, history };
}
