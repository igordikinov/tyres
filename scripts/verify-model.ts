/**
 * Headless verification of the simulation model.
 *
 * Run with:  npm run verify
 *
 * Checks the Theory of Constraints scenario described in the PRD:
 * with 4 presses a queue must build up in front of vulcanisation, and
 * with 8 presses that queue must disappear.
 */
import { FactoryEngine } from '../src/core/engine';
import type { Params, ScenarioDef } from '../src/core/types';
import scenarioJson from '../src/scenarios/tire-factory.json';
import {
  checkAppearanceStage,
  checkBottleneckMigration,
  checkScenarioVariants,
  checkVariantConstants,
  checkVariantDeterminism,
  checkVariants,
} from './verify-variants';

const scenario = scenarioJson as unknown as ScenarioDef;

interface Result {
  label: string;
  throughput: number;
  cycleTime: number;
  wip: number;
  queue: number;
  bufferQueue: number;
  pressUtilization: number;
  bottleneck: string;
  completed: number;
}

function run(label: string, overrides: Partial<Params>, minutes: number): Result {
  const params: Params = { ...scenario.params, ...overrides };
  const engine = new FactoryEngine(scenario, params);
  engine.advance(minutes);
  const snapshot = engine.getSnapshot();
  return {
    label,
    throughput: snapshot.kpi.throughput,
    cycleTime: snapshot.kpi.cycleTimeMinutes,
    wip: snapshot.kpi.wip,
    queue: snapshot.kpi.queue,
    bufferQueue: snapshot.nodes.greenBuffer.queueLength,
    pressUtilization: snapshot.nodes.press.utilization,
    bottleneck: snapshot.kpi.bottleneckName,
    completed: snapshot.kpi.completed,
  };
}

function report(result: Result): void {
  console.log(
    [
      result.label.padEnd(22),
      `thr ${result.throughput.toFixed(1).padStart(5)}/h`,
      `cycle ${result.cycleTime.toFixed(0).padStart(4)}m`,
      `wip ${String(result.wip).padStart(3)}`,
      `queue ${String(result.queue).padStart(3)}`,
      `buffer ${String(result.bufferQueue).padStart(3)}`,
      `press ${(result.pressUtilization * 100).toFixed(0).padStart(3)}%`,
      `done ${String(result.completed).padStart(4)}`,
      `bottleneck ${result.bottleneck}`,
    ].join('  '),
  );
}

const HORIZON = 300;
const FULL_SHIFT = 480;
const baseline = run('baseline (4 presses)', {}, HORIZON);
const doubled = run('optimised (8 presses)', { pressCount: 8 }, HORIZON);
const batched = run('batch of 4', { batchSize: 4 }, HORIZON);

[baseline, doubled, batched].forEach(report);

const failures: string[] = [];
if (baseline.bufferQueue < 10) failures.push('expected a queue to build up with 4 presses');
if (doubled.bufferQueue > 2) failures.push('expected the queue to disappear with 8 presses');
if (doubled.throughput <= baseline.throughput) failures.push('expected higher throughput with 8 presses');
if (doubled.cycleTime >= baseline.cycleTime) failures.push('expected a shorter cycle time with 8 presses');
if (!baseline.bottleneck.toLowerCase().includes('вулкан')) {
  failures.push(`expected vulcanization to be the constraint, got "${baseline.bottleneck}"`);
}

// A live run is fed jittery browser frame deltas; a replay uses one big step.
// Both must land on exactly the same state, otherwise scrubbing the timeline
// would silently rewrite the run the audience just watched.
const jittery = new FactoryEngine(scenario, { ...scenario.params });
let elapsed = 0;
let seedState = 7;
while (elapsed < FULL_SHIFT) {
  seedState = (seedState * 1103515245 + 12345) % 2147483648;
  const frame = Math.min(0.02 + (seedState / 2147483648) * 0.12, FULL_SHIFT - elapsed);
  jittery.advance(frame);
  elapsed += frame;
}
const replay = new FactoryEngine(scenario, { ...scenario.params });
replay.seek(FULL_SHIFT);
const live = jittery.getSnapshot();
const replayed = replay.getSnapshot();
if (live.kpi.completed !== replayed.kpi.completed || live.kpi.wip !== replayed.kpi.wip) {
  failures.push(
    `seek() diverges from a jittery live run: ` +
      `completed ${live.kpi.completed} vs ${replayed.kpi.completed}, ` +
      `wip ${live.kpi.wip} vs ${replayed.kpi.wip}`,
  );
}

// The narration must cycle rather than freeze on the final caption.
const story = new FactoryEngine(scenario, { ...scenario.params });
const captions = new Set<string>();
for (let minute = 0; minute < FULL_SHIFT; minute += 1) {
  story.advance(1);
  const { narration } = story.getSnapshot();
  if (narration) captions.add(narration);
}
if (captions.size < 5) {
  failures.push(`expected the narration to cycle, saw only ${captions.size} captions`);
}

// Every documented resource state must actually be reachable over a full shift.
const states = new Set<string>();
const observer = new FactoryEngine(scenario, { ...scenario.params });
for (let minute = 0; minute < FULL_SHIFT; minute += 1) {
  observer.advance(1);
  Object.values(observer.getSnapshot().nodes).forEach((node) => states.add(node.state));
}
for (const expected of ['idle', 'working', 'blocked', 'starved']) {
  if (!states.has(expected)) failures.push(`resource state "${expected}" is never reached`);
}

// Product-variant data layer (Phase 1): resolveVariant folds a variant patch
// into the base scenario and returns a plain ScenarioDef.
failures.push(...checkVariants());
failures.push(...checkVariantConstants());
failures.push(...checkScenarioVariants());
failures.push(...checkVariantDeterminism());
failures.push(...checkAppearanceStage());
failures.push(...checkBottleneckMigration());

if (failures.length > 0) {
  console.error('\nMODEL CHECK FAILED');
  failures.forEach((message) => console.error(`  - ${message}`));
  process.exit(1);
}
console.log('\nMODEL CHECK PASSED');
