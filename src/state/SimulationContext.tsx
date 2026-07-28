import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  DEFAULT_SPEED,
  HORIZON_MINUTES,
  KPI_REFRESH_MS,
  MAX_FRAME_MINUTES,
  SIM_MINUTES_PER_REAL_SECOND,
  STEP_MINUTES,
  VARIANT_COLORS,
  type SpeedOption,
} from '@/core/constants';
import { FactoryEngine } from '@/core/engine';
import {
  baselineParams,
  DEFAULT_VARIANT_ID,
  getScenario,
  listVariants,
  nodeDefsById,
  optimisedParams,
  resolveMixed,
  resolveVariant,
} from '@/core/scenario';
import { DEFAULT_RELEASE_PLAN_ID, RELEASE_PLANS } from '@/core/releasePlans';
import type { ParamKey, Params, SchedulingPolicy, ScenarioDef, Snapshot, VariantDef, VariantId } from '@/core/types';
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
  const baseScenario = useMemo(() => getScenario(), []);
  // Token colours are single-sourced in VARIANT_COLORS; fill them in once here.
  const variants = useMemo<VariantDef[]>(
    () => listVariants(baseScenario).map((v) => ({ ...v, tokenColor: v.tokenColor ?? VARIANT_COLORS[v.id] })),
    [baseScenario],
  );

  const [variantId, setVariantId] = useState<VariantId>(DEFAULT_VARIANT_ID);
  const [mixedMode, setMixedFlag] = useState(false);
  const [releasePlanId, setReleasePlanId] = useState<string>(DEFAULT_RELEASE_PLAN_ID);
  const [schedulingPolicy, setPolicyState] = useState<SchedulingPolicy>('fifo');
  const scenario = useMemo(
    () =>
      mixedMode
        ? resolveMixed(baseScenario, RELEASE_PLANS[releasePlanId].plan)
        : resolveVariant(baseScenario, variantId),
    [baseScenario, mixedMode, releasePlanId, variantId],
  );
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

  // A hard, deterministic reset: build a fresh engine for the given scenario at
  // its baseline, apply the current policy, and republish from clock zero — the
  // same effect as seek(0), so the live run stays reproducible.
  const installScenario = useCallback(
    (nextScenario: ScenarioDef) => {
      const nextParams = baselineParams(nextScenario);
      const nextEngine = new FactoryEngine(nextScenario, nextParams);
      nextEngine.setSchedulingPolicy(schedulingPolicy);
      engineRef.current = nextEngine;
      playingRef.current = false;
      setPlaying(false);
      setParams(nextParams);
      const shot = nextEngine.getSnapshot();
      setSnapshot(shot);
      setKpiFrame({ kpi: shot.kpi, history: shot.history, time: shot.time });
      lastKpiRef.current = 0;
      markDirty();
    },
    [schedulingPolicy, markDirty],
  );

  const setVariant = useCallback(
    (id: VariantId) => {
      setMixedFlag(false);
      setVariantId(id);
      installScenario(resolveVariant(baseScenario, id));
    },
    [baseScenario, installScenario],
  );

  const setMixedMode = useCallback(
    (on: boolean) => {
      setMixedFlag(on);
      installScenario(
        on ? resolveMixed(baseScenario, RELEASE_PLANS[releasePlanId].plan) : resolveVariant(baseScenario, variantId),
      );
    },
    [baseScenario, releasePlanId, variantId, installScenario],
  );

  const setReleasePlan = useCallback(
    (id: string) => {
      setReleasePlanId(id);
      if (mixedMode) installScenario(resolveMixed(baseScenario, RELEASE_PLANS[id].plan));
    },
    [baseScenario, mixedMode, installScenario],
  );

  const setSchedulingPolicy = useCallback(
    (policy: SchedulingPolicy) => {
      setPolicyState(policy);
      engineRef.current?.setSchedulingPolicy(policy);
      markDirty();
    },
    [markDirty],
  );

  const controls = useMemo<SimulationControls>(
    () => ({
      scenario,
      defs,
      variantId,
      variants,
      setVariant,
      mixedMode,
      setMixedMode,
      releasePlanId,
      setReleasePlan,
      schedulingPolicy,
      setSchedulingPolicy,
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
      variantId,
      variants,
      setVariant,
      mixedMode,
      setMixedMode,
      releasePlanId,
      setReleasePlan,
      schedulingPolicy,
      setSchedulingPolicy,
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
