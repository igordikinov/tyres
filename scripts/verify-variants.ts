/**
 * Headless checks for the product-variant data layer (Phase 1, tyre-ag5.1).
 *
 * `resolveVariant(scenario, variantId)` must fold a variant patch into the base
 * scenario and hand back a *plain* ScenarioDef — the engine, canvas and KPIs
 * never learn that variants exist. These asserts pin that contract with a small
 * inline fixture, independent of the real tire-factory.json data (tyre-ag5.2).
 *
 * Exposed as checkVariants() so run-verify bundles a single entrypoint.
 */
import {
  DEFAULT_REST_MINUTES,
  DEFAULT_STUDDING_COUNT,
  DEFAULT_STUDDING_TIME,
  STUD_CALLOUT_HEIGHT,
  STUD_CALLOUT_WIDTH,
  STUD_PROTRUSION_MM,
  STUD_PROTRUSION_TOLERANCE_MM,
  VARIANT_COLORS,
} from '../src/core/constants';
import { HORIZON_MINUTES } from '../src/core/constants';
import { FactoryEngine } from '../src/core/engine';
import { baselineParams, DEFAULT_VARIANT_ID, listVariants, resolveVariant } from '../src/core/scenario';
import type { ParamDef, ScenarioDef, VariantId } from '../src/core/types';
import scenarioJson from '../src/scenarios/tire-factory.json';

const REAL = scenarioJson as unknown as ScenarioDef;

const PARAM_DEF: ParamDef = {
  key: 'pressTime',
  label: 'Вулканизация',
  unit: 'мин',
  min: 10,
  max: 20,
  step: 1,
  group: 'time',
  hint: '',
};

function makeBase(): ScenarioDef {
  return {
    id: 'fixture',
    name: 'Base',
    product: 'Base product',
    unitLabel: 'шина',
    releaseIntervalMinutes: 5,
    canvas: { width: 100, height: 100 },
    nodes: [
      { id: 'src', index: 1, name: 'Src', subtitle: '', kind: 'source', machine: 'raw', processMinutes: 0, capacity: 1, queueCapacity: 0, transportMinutes: 0, next: 'insp', x: 0, y: 0, dir: 1 },
      { id: 'insp', index: 2, name: 'Insp', subtitle: '', kind: 'process', machine: 'inspection', processMinutes: 1, capacity: 1, queueCapacity: 2, transportMinutes: 0, next: 'sink', x: 10, y: 0, dir: 1 },
      { id: 'sink', index: 3, name: 'W', subtitle: '', kind: 'sink', machine: 'warehouse', processMinutes: 0, capacity: 0, queueCapacity: 0, transportMinutes: 0, next: null, x: 20, y: 0, dir: 1 },
    ],
    params: { mixerTime: 3, extruderTime: 2.5, assemblyTime: 2, pressTime: 15, inspectionTime: 1.5, pressCount: 4, batchSize: 1, bufferCapacity: 40, studdingTime: 2, studdingCount: 1, restMinutes: 10 },
    paramDefs: [PARAM_DEF],
    optimisedParams: { pressCount: 8 },
    construction: [],
    assemblyLayers: [],
    materials: [],
    curing: { temperatureC: [150, 170], pressureBar: [15, 25] },
    variants: [
      { id: 'summer', name: 'Летняя', product: 'Летняя 205/55 R16', badge: 'Лето', tokenColor: '#111' },
      {
        id: 'winter-studded',
        name: 'Зимняя шипованная',
        product: 'Зимняя шипованная 205/55 R16 91T',
        badge: 'Шипы',
        tokenColor: '#2244ff',
        params: { pressTime: 16 },
        optimisedParams: { studdingTime: 2 },
        extraParamDefs: [
          { key: 'studdingTime', label: 'Ошиповка', unit: 'мин', min: 1, max: 4, step: 0.5, group: 'time', hint: '' },
        ],
        canvas: { width: 200, height: 300 },
        nodesPatch: { insp: { next: 'studding' }, sink: { x: 30 } },
        nodesAdd: [
          { id: 'studding', index: 4, name: 'Ошиповка', subtitle: '', kind: 'process', machine: 'studding', processMinutes: 2, capacity: 1, queueCapacity: 6, transportMinutes: 0, next: 'studcheck', x: 10, y: 100, dir: 1, transformsAppearance: true },
          { id: 'studcheck', index: 5, name: 'Контроль шипов', subtitle: '', kind: 'process', machine: 'studcheck', processMinutes: 0.8, capacity: 1, queueCapacity: 6, transportMinutes: 0, next: 'sink', x: 20, y: 100, dir: 1 },
        ],
      },
    ],
  };
}

export function checkVariants(): string[] {
  const failures: string[] = [];
  const expect = (cond: boolean, message: string) => {
    if (!cond) failures.push(message);
  };

  // Default variant id is summer.
  expect(DEFAULT_VARIANT_ID === 'summer', `expected default variant "summer", got "${DEFAULT_VARIANT_ID}"`);

  // Summer: product overridden, factory name preserved, no structural change.
  const base = makeBase();
  const summer = resolveVariant(base, 'summer');
  expect(summer.name === 'Base', `factory name must be preserved, got "${summer.name}"`);
  expect(summer.product === 'Летняя 205/55 R16', `summer product not applied: "${summer.product}"`);
  expect(summer.params.pressTime === 15, `summer must keep base pressTime 15, got ${summer.params.pressTime}`);
  expect(summer.nodes.length === 3, `summer must keep 3 nodes, got ${summer.nodes.length}`);
  expect((summer as { variants?: unknown }).variants === undefined, 'resolved scenario must not carry the variants array');

  // Studded: params, optimised, paramDefs, canvas and node chain all folded in.
  const studded = resolveVariant(base, 'winter-studded');
  expect(studded.name === 'Base', `factory name must be preserved for studded, got "${studded.name}"`);
  expect(studded.product === 'Зимняя шипованная 205/55 R16 91T', `studded product not applied: "${studded.product}"`);
  expect(studded.params.pressTime === 16, `studded pressTime override failed: ${studded.params.pressTime}`);
  expect(studded.params.studdingTime === 2, `studded must keep base studdingTime 2, got ${studded.params.studdingTime}`);
  expect(studded.optimisedParams.pressCount === 8, `studded must keep base optimised pressCount 8, got ${String(studded.optimisedParams.pressCount)}`);
  expect(studded.optimisedParams.studdingTime === 2, `studded optimised studdingTime not merged: ${String(studded.optimisedParams.studdingTime)}`);
  expect(studded.paramDefs.length === 2, `studded must append extraParamDefs (expected 2), got ${studded.paramDefs.length}`);
  expect(studded.canvas.width === 200 && studded.canvas.height === 300, `studded canvas override failed: ${JSON.stringify(studded.canvas)}`);
  expect(studded.nodes.length === 5, `studded must have 3 base + 2 added nodes, got ${studded.nodes.length}`);
  const insp = studded.nodes.find((n) => n.id === 'insp');
  expect(insp?.next === 'studding', `studded predecessor rewire failed: insp.next="${String(insp?.next)}"`);
  const sink = studded.nodes.find((n) => n.id === 'sink');
  expect(sink?.x === 30, `studded nodesPatch on sink failed: sink.x=${String(sink?.x)}`);
  const studNode = studded.nodes.find((n) => n.id === 'studding');
  expect(studNode?.machine === 'studding', `studding node missing or wrong machine: ${String(studNode?.machine)}`);
  expect(studNode?.transformsAppearance === true, 'studding node must set transformsAppearance');

  // Purity: the base scenario is never mutated.
  expect(base.nodes.find((n) => n.id === 'insp')?.next === 'sink', 'resolveVariant mutated base node chain');
  expect(base.params.pressTime === 15, 'resolveVariant mutated base params');
  expect(base.paramDefs.length === 1, 'resolveVariant mutated base paramDefs');

  // A scenario without a variants block resolves to itself, no crash.
  const plain = makeBase();
  delete (plain as { variants?: unknown }).variants;
  const fallback = resolveVariant(plain, 'winter-studded');
  expect(fallback.nodes.length === 3, `variant-less scenario must pass through unchanged, got ${fallback.nodes.length} nodes`);

  return failures;
}

/** The real tire-factory.json variants block resolves to the expected lines (tyre-ag5.2). */
export function checkScenarioVariants(): string[] {
  const failures: string[] = [];
  const expect = (cond: boolean, message: string) => {
    if (!cond) failures.push(message);
  };

  const ids = listVariants(REAL).map((v) => v.id);
  expect(
    ids.length === 3 && ['summer', 'winter', 'winter-studded'].every((i) => ids.includes(i as VariantId)),
    `scenario must declare summer/winter/winter-studded, got ${JSON.stringify(ids)}`,
  );

  // Base params must be a complete dictionary including the studding keys.
  expect(REAL.params.studdingTime === 2 && REAL.params.studdingCount === 1 && REAL.params.restMinutes === 10,
    'base params must default the studding keys (2/1/10)');

  // Summer = current defaults, 10 nodes, factory name preserved.
  const summer = resolveVariant(REAL, 'summer');
  expect(summer.nodes.length === 10, `summer must keep 10 nodes, got ${summer.nodes.length}`);
  expect(summer.name === REAL.name, 'summer must preserve the factory name');
  expect(summer.params.mixerTime === 3 && summer.params.pressTime === 15, 'summer params must match base defaults');
  expect(summer.product.includes('Летняя'), `summer product should read "Летняя…", got "${summer.product}"`);

  // Winter friction: slower mix + press, tuned optimised press time, same 10 nodes.
  const winter = resolveVariant(REAL, 'winter');
  expect(winter.params.mixerTime === 4 && winter.params.pressTime === 16, 'winter params must be mixer 4 / press 16');
  expect(winter.optimisedParams.pressTime === 14, `winter optimised pressTime must be 14, got ${String(winter.optimisedParams.pressTime)}`);
  expect(winter.nodes.length === 10, `winter must keep 10 nodes, got ${winter.nodes.length}`);

  // Studded: three extra nodes, taller canvas, three extra sliders.
  const studded = resolveVariant(REAL, 'winter-studded');
  expect(studded.nodes.length === 13, `studded must have 13 nodes, got ${studded.nodes.length}`);
  expect(studded.canvas.height === 1240 && studded.canvas.width === 1520, `studded canvas must be 1520×1240, got ${JSON.stringify(studded.canvas)}`);
  expect(studded.paramDefs.length === 11, `studded must expose 11 sliders (8+3), got ${studded.paramDefs.length}`);
  expect(studded.params.studdingTime === 2 && studded.params.studdingCount === 1 && studded.params.restMinutes === 10, 'studded studding params must default 2/1/10');
  expect(studded.optimisedParams.studdingTime === 2, `studded optimised must add studdingTime 2, got ${String(studded.optimisedParams.studdingTime)}`);

  const by = Object.fromEntries(studded.nodes.map((n) => [n.id, n]));
  expect(by.inspection?.next === 'studding', `inspection must route into studding, got "${String(by.inspection?.next)}"`);
  expect(by.studding?.machine === 'studding' && by.studding?.transformsAppearance === true, 'studding node must use the studding machine and transform appearance');
  expect(by.studding?.timeParam === 'studdingTime' && by.studding?.capacityParam === 'studdingCount', 'studding node must bind studdingTime/studdingCount');
  expect(by.restRack?.kind === 'process' && by.restRack?.capacity === 24 && by.restRack?.timeParam === 'restMinutes', 'restRack must be a process node with capacity 24 driven by restMinutes');
  expect(
    by.studding?.next === 'studCheck' && by.studCheck?.next === 'restRack' && by.restRack?.next === 'warehouse' && by.warehouse?.next === null,
    'studded chain must be inspection→studding→studCheck→restRack→warehouse→∅',
  );
  // Serpentine third row lives below the base two rows.
  expect(by.studCheck?.y === 1040 && by.restRack?.y === 1040 && by.warehouse?.y === 1040, 'third row nodes must sit at y=1040');

  // Bill of materials: each variant's shares sum to 100%, studs only on studded.
  for (const id of ['summer', 'winter', 'winter-studded'] as VariantId[]) {
    const materials = resolveVariant(REAL, id).materials;
    const sum = materials.reduce((total, material) => total + material.share, 0);
    expect(sum === 100, `${id} material shares must sum to 100, got ${sum}`);
    const hasStuds = materials.some((material) => material.stage === 'studding');
    expect(hasStuds === (id === 'winter-studded'), `${id} studding-stage material presence is wrong (${hasStuds})`);
  }

  // Presentation: base 8 chapters, winter +1, studded +2 (last = constraint migration).
  expect(resolveVariant(REAL, 'summer').presentation?.length === 8, `summer must keep 8 chapters, got ${resolveVariant(REAL, 'summer').presentation?.length}`);
  expect(resolveVariant(REAL, 'winter').presentation?.length === 9, `winter must have 9 chapters, got ${resolveVariant(REAL, 'winter').presentation?.length}`);
  const studdedScript = resolveVariant(REAL, 'winter-studded').presentation;
  expect(studdedScript?.length === 10, `studded must have 10 chapters, got ${studdedScript?.length}`);
  expect(
    studdedScript?.[9]?.title === 'Миграция ограничения' && studdedScript?.[9]?.params?.pressCount === 8 && studdedScript?.[9]?.params?.studdingTime === 3,
    'studded final chapter must be the constraint migration with pressCount 8 / studdingTime 3',
  );

  return failures;
}

/**
 * Every resolved variant must run in a freshly-created engine and stay
 * deterministic: a jittery live run and a single seek() must land bit-identical
 * (spec §4.9.1). This underpins tyre-ag5.4 recreating the engine on a switch.
 */
export function checkVariantDeterminism(): string[] {
  const failures: string[] = [];
  const ids: VariantId[] = ['summer', 'winter', 'winter-studded'];

  for (const id of ids) {
    const sc = resolveVariant(REAL, id);
    const params = baselineParams(sc);

    const live = new FactoryEngine(sc, { ...params });
    let elapsed = 0;
    let seed = 7;
    while (elapsed < HORIZON_MINUTES) {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      const frame = Math.min(0.02 + (seed / 2147483648) * 0.12, HORIZON_MINUTES - elapsed);
      live.advance(frame);
      elapsed += frame;
    }
    const replay = new FactoryEngine(sc, { ...params });
    replay.seek(HORIZON_MINUTES);

    const a = live.getSnapshot();
    const b = replay.getSnapshot();
    if (a.kpi.completed !== b.kpi.completed || a.kpi.wip !== b.kpi.wip) {
      failures.push(
        `variant "${id}" diverges live vs seek(): completed ${a.kpi.completed}/${b.kpi.completed}, wip ${a.kpi.wip}/${b.kpi.wip}`,
      );
    }
    if (a.kpi.completed <= 0) {
      failures.push(`variant "${id}" produced nothing over a full shift — chain likely broken`);
    }
  }

  return failures;
}

/**
 * Units carry an appearance stage = number of transformsAppearance nodes exited
 * (0 green → 1 cured → 2 studded). Summer has one such node (the press), studded
 * has two (press + studding). Verifies snapshot populates it (tyre-ag5.3).
 */
export function checkAppearanceStage(): string[] {
  const failures: string[] = [];

  const scan = (id: VariantId): { min: number; max: number } => {
    const sc = resolveVariant(REAL, id);
    const engine = new FactoryEngine(sc, baselineParams(sc));
    let min = 9;
    let max = -1;
    for (let t = 0; t < HORIZON_MINUTES; t += 1) {
      engine.advance(1);
      for (const unit of engine.getSnapshot().units) {
        const stage = unit.appearanceStage ?? -1;
        if (stage < min) min = stage;
        if (stage > max) max = stage;
      }
    }
    return { min, max };
  };

  const summer = scan('summer');
  if (summer.min !== 0) failures.push(`summer must show green units (stage 0), got min ${summer.min}`);
  if (summer.max !== 1) failures.push(`summer max appearance stage must be 1 (cured), got ${summer.max}`);

  const studded = scan('winter-studded');
  if (studded.min !== 0) failures.push(`studded must show green units (stage 0), got min ${studded.min}`);
  if (studded.max !== 2) failures.push(`studded max appearance stage must be 2 (studded), got ${studded.max}`);

  return failures;
}

/**
 * The studded constraint story (spec §4.9.3): at defaults the press is the
 * bottleneck and studding has spare capacity; widening the presses to 8 and
 * slowing studding to 3 min migrates the constraint onto studding. The studded
 * lead time is also strictly longer than summer's.
 */
export function checkBottleneckMigration(): string[] {
  const failures: string[] = [];
  const HORIZON = 300;

  const studded = resolveVariant(REAL, 'winter-studded');
  const summer = resolveVariant(REAL, 'summer');

  const atDefault = new FactoryEngine(studded, baselineParams(studded));
  atDefault.advance(HORIZON);
  const def = atDefault.getSnapshot();
  if (def.kpi.bottleneckId !== 'press') {
    failures.push(`studded default bottleneck must be the press, got "${def.kpi.bottleneckId}"`);
  }
  if (!(def.kpi.throughput > 12 && def.kpi.throughput < 18)) {
    failures.push(`studded default throughput should sit near 15–16/h, got ${def.kpi.throughput.toFixed(1)}`);
  }

  const migrated = new FactoryEngine(studded, { ...baselineParams(studded), pressCount: 8, studdingTime: 3 });
  migrated.advance(HORIZON);
  const mig = migrated.getSnapshot();
  if (mig.kpi.bottleneckId !== 'studding') {
    failures.push(`with 8 presses and studdingTime 3 the constraint must move to studding, got "${mig.kpi.bottleneckId}"`);
  }

  const summerRun = new FactoryEngine(summer, baselineParams(summer));
  summerRun.advance(HORIZON);
  const summerCycle = summerRun.getSnapshot().kpi.cycleTimeMinutes;
  if (!(def.kpi.cycleTimeMinutes > summerCycle)) {
    failures.push(`studded lead time (${def.kpi.cycleTimeMinutes.toFixed(0)}) must exceed summer (${summerCycle.toFixed(0)})`);
  }

  return failures;
}

/** Variant-related constants live in constants.ts and nowhere else (tyre-ag5.14). */
export function checkVariantConstants(): string[] {
  const failures: string[] = [];
  const expect = (cond: boolean, message: string) => {
    if (!cond) failures.push(message);
  };
  const hex = /^#[0-9a-fA-F]{6}$/;

  const ids: VariantId[] = ['summer', 'winter', 'winter-studded'];
  for (const id of ids) {
    const color = VARIANT_COLORS[id];
    expect(hex.test(color ?? ''), `VARIANT_COLORS.${id} must be a #rrggbb hex, got "${String(color)}"`);
  }
  const distinct = new Set(ids.map((id) => VARIANT_COLORS[id]));
  expect(distinct.size === ids.length, 'each variant must have a distinct token colour');

  // Defaults for the three studding params (spec §4.4).
  expect(DEFAULT_STUDDING_TIME === 2, `DEFAULT_STUDDING_TIME expected 2, got ${DEFAULT_STUDDING_TIME}`);
  expect(DEFAULT_STUDDING_COUNT === 1, `DEFAULT_STUDDING_COUNT expected 1, got ${DEFAULT_STUDDING_COUNT}`);
  expect(DEFAULT_REST_MINUTES === 10, `DEFAULT_REST_MINUTES expected 10, got ${DEFAULT_REST_MINUTES}`);

  // Stud protrusion spec: 1.2 mm ± 0.3 (spec §2.2 / §4.6).
  expect(STUD_PROTRUSION_MM === 1.2, `STUD_PROTRUSION_MM expected 1.2, got ${STUD_PROTRUSION_MM}`);
  expect(STUD_PROTRUSION_TOLERANCE_MM === 0.3, `STUD_PROTRUSION_TOLERANCE_MM expected 0.3, got ${STUD_PROTRUSION_TOLERANCE_MM}`);

  // StudCallout box dimensions are positive viewBox units.
  expect(STUD_CALLOUT_WIDTH > 0, `STUD_CALLOUT_WIDTH must be positive, got ${STUD_CALLOUT_WIDTH}`);
  expect(STUD_CALLOUT_HEIGHT > 0, `STUD_CALLOUT_HEIGHT must be positive, got ${STUD_CALLOUT_HEIGHT}`);

  return failures;
}
