import rawTireFactory from '@/scenarios/tire-factory.json';
import { SHIFT_START_HOUR } from './constants';
import type { Params, ScenarioDef } from './types';

/**
 * Scenarios are plain data. Adding a new industry means adding a JSON file,
 * not touching the engine or the components.
 */
export const SCENARIOS: Record<string, ScenarioDef> = {
  'tire-factory': rawTireFactory as unknown as ScenarioDef,
};

export const DEFAULT_SCENARIO_ID = 'tire-factory';

export function getScenario(id: string = DEFAULT_SCENARIO_ID): ScenarioDef {
  return SCENARIOS[id] ?? SCENARIOS[DEFAULT_SCENARIO_ID];
}

export function baselineParams(scenario: ScenarioDef): Params {
  return { ...scenario.params };
}

export function optimisedParams(scenario: ScenarioDef): Params {
  return { ...scenario.params, ...scenario.optimisedParams };
}

export function nodeDefsById(scenario: ScenarioDef) {
  return Object.fromEntries(scenario.nodes.map((node) => [node.id, node]));
}

/** Formats simulated minutes as a shift clock, e.g. 06:00 → 09:24. */
export function formatShiftClock(minutes: number): string {
  const total = SHIFT_START_HOUR * 60 + Math.max(0, minutes);
  const hours = Math.floor(total / 60) % 24;
  const mins = Math.floor(total % 60);
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/** Formats a duration in minutes as `1ч 24м` or `42м`. */
export function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return '0м';
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return hours > 0 ? `${hours}ч ${String(mins).padStart(2, '0')}м` : `${mins}м`;
}

export function formatNumber(value: number, fractionDigits = 0): string {
  if (!Number.isFinite(value)) return '—';
  return value.toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

export function formatPercent(ratio: number): string {
  if (!Number.isFinite(ratio)) return '—';
  return `${Math.round(ratio * 100)}%`;
}
