import rawTireFactory from '@/scenarios/tire-factory.json';
import { SHIFT_START_HOUR } from './constants';
import type { NodeDef, ParamDef, Params, ReleaseOrder, ScenarioDef, VariantDef, VariantId } from './types';

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

export const DEFAULT_VARIANT_ID: VariantId = 'summer';

/** Variants declared by a scenario, or an empty list. */
export function listVariants(scenario: ScenarioDef): VariantDef[] {
  return scenario.variants ?? [];
}

/**
 * Folds a variant's data patch into the base scenario and returns a plain
 * ScenarioDef. The engine, canvas, KPIs and tabs stay variant-agnostic — they
 * only ever see resolved scenarios. Pure: the base is never mutated, and the
 * `variants` array is stripped from the result so it can't be resolved twice.
 */
export function resolveVariant(scenario: ScenarioDef, variantId: VariantId): ScenarioDef {
  const { variants, ...rest } = scenario;
  const base: ScenarioDef = {
    ...rest,
    params: { ...scenario.params },
    optimisedParams: { ...scenario.optimisedParams },
    paramDefs: [...scenario.paramDefs],
    nodes: scenario.nodes.map((node) => ({ ...node })),
  };

  base.productId = variantId;
  const variant = variants?.find((candidate) => candidate.id === variantId);
  if (!variant) return base;

  const patched = base.nodes.map((node) => {
    const patch = variant.nodesPatch?.[node.id];
    return patch ? { ...node, ...patch } : node;
  });
  const added: NodeDef[] = (variant.nodesAdd ?? []).map((node) => ({ ...node }));

  return {
    ...base,
    // The scenario name is the factory title (Header/canvas); only the product
    // string tracks the variant. The variant's short name is metadata the
    // Header's variant switcher reads from the VariantDef directly.
    product: variant.product,
    canvas: variant.canvas ?? base.canvas,
    params: { ...base.params, ...variant.params },
    optimisedParams: { ...base.optimisedParams, ...variant.optimisedParams },
    paramDefs: [...base.paramDefs, ...(variant.extraParamDefs ?? [])],
    nodes: [...patched, ...added],
    construction: variant.construction ?? base.construction,
    assemblyLayers: variant.assemblyLayers ?? base.assemblyLayers,
    materials: variant.materials ?? base.materials,
    curing: variant.curing ?? base.curing,
    // Variant chapters extend the base script (§4.7): summer keeps the base 8,
    // winter/studded append their own.
    presentation:
      base.presentation || variant.presentation
        ? [...(base.presentation ?? []), ...(variant.presentation ?? [])]
        : undefined,
  };
}

/**
 * Builds the mixed-flow scenario (Phase 2): the studded superset line carries
 * all product types, but «Контроль» routes only studded units into the studding
 * branch — summer and winter go straight to the warehouse. The release plan
 * feeds the seasonal mix; there is no single productId.
 */
export function resolveMixed(scenario: ScenarioDef, releasePlan: ReleaseOrder[]): ScenarioDef {
  const studded = resolveVariant(scenario, 'winter-studded');
  const nodes = studded.nodes.map((node) => {
    if (node.id === 'inspection') {
      return { ...node, next: 'warehouse', routes: { 'winter-studded': 'studding' } as NodeDef['routes'] };
    }
    // The vulcanisation press carries a mould that must be changed per product.
    if (node.id === 'press') return { ...node, changeoverParam: 'changeoverMinutes' as NodeDef['changeoverParam'] };
    return node;
  });
  const paramDefs: ParamDef[] = [
    ...studded.paramDefs,
    { key: 'changeoverMinutes', label: 'Переналадка формы', unit: 'мин', min: 15, max: 120, step: 5, group: 'mixed', hint: 'Время смены пресс-формы при переходе на другой тип шины' },
    { key: 'campaignSize', label: 'Размер кампании', unit: 'шт', min: 2, max: 12, step: 1, group: 'mixed', hint: 'Сколько шин одного типа идёт подряд в режиме «Кампании»' },
  ];
  return { ...studded, nodes, paramDefs, productId: undefined, releasePlan, product: 'Смешанный поток' };
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
