import { createContext, useContext } from 'react';
import type { SpeedOption } from '@/core/constants';
import type {
  HistoryPoint,
  Kpi,
  NodeDef,
  ParamKey,
  Params,
  ScenarioDef,
  SchedulingPolicy,
  Snapshot,
  VariantDef,
  VariantId,
} from '@/core/types';

export type DemoMode = 'live' | 'compare' | 'presentation' | 'anatomy' | 'materials';

/** Stable slice: identity only changes when the user actually changes something. */
export interface SimulationControls {
  scenario: ScenarioDef;
  defs: Record<string, NodeDef>;
  /** Active product variant. */
  variantId: VariantId;
  /** Selectable variants (token colours resolved from VARIANT_COLORS). */
  variants: VariantDef[];
  /** Switch product variant: deterministically recreates the engine. */
  setVariant: (id: VariantId) => void;
  /** Mixed flow: all types on one line, routed and scheduled by type. */
  mixedMode: boolean;
  setMixedMode: (on: boolean) => void;
  /** Active seasonal release-plan preset id (mixed flow). */
  releasePlanId: string;
  setReleasePlan: (id: string) => void;
  /** Queue-selection policy (mixed flow). */
  schedulingPolicy: SchedulingPolicy;
  setSchedulingPolicy: (policy: SchedulingPolicy) => void;
  params: Params;
  playing: boolean;
  speed: SpeedOption;
  tocMode: boolean;
  apsMode: boolean;
  demoMode: DemoMode;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  step: () => void;
  reset: () => void;
  seek: (minutes: number) => void;
  setSpeed: (speed: SpeedOption) => void;
  setParam: (key: ParamKey, value: number) => void;
  restoreBaseline: () => void;
  applyOptimised: () => void;
  setTocMode: (value: boolean) => void;
  setApsMode: (value: boolean) => void;
  setDemoMode: (value: DemoMode) => void;
}

/** Per-frame slice: replaced on every animation frame. */
export interface SimulationFrame {
  snapshot: Snapshot;
}

/** Throttled slice: replaced every KPI_REFRESH_MS. */
export interface SimulationKpi {
  kpi: Kpi;
  history: HistoryPoint[];
  /** Simulation clock sampled at the KPI cadence. */
  time: number;
}

export const ControlsContext = createContext<SimulationControls | null>(null);
export const FrameContext = createContext<SimulationFrame | null>(null);
export const KpiContext = createContext<SimulationKpi | null>(null);

function required<T>(value: T | null, name: string): T {
  if (!value) throw new Error(`${name} must be used inside <SimulationProvider>`);
  return value;
}

/** Controls only — does not re-render when the simulation clock advances. */
export function useSimulationControls(): SimulationControls {
  return required(useContext(ControlsContext), 'useSimulationControls');
}

/** Live frame — re-renders at the animation frame rate. */
export function useSimulationFrame(): SimulationFrame {
  return required(useContext(FrameContext), 'useSimulationFrame');
}

/** KPI values — re-renders at the throttled KPI cadence. */
export function useSimulationKpi(): SimulationKpi {
  return required(useContext(KpiContext), 'useSimulationKpi');
}
