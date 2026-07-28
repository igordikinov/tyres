import { HISTORY_INTERVAL_MINUTES, HISTORY_MAX_POINTS, TICK_MINUTES } from './constants';
import { throughputPerHour } from './metrics';
import type { HistoryPoint, NodeDef, Params, ResourceState, ScenarioDef, UnitView, VariantId } from './types';

/** One physical unit travelling through the factory. */
export interface Unit {
  id: number;
  createdAt: number;
  nodeId: string;
  fromNodeId: string | null;
  phase: UnitView['phase'];
  elapsed: number;
  duration: number;
  slotIndex: number;
  /** Product variant this unit belongs to (null when the scenario is untyped). */
  productId: VariantId | null;
}

/** Mutable runtime state of a single resource, buffer, source or sink. */
export interface NodeRuntime {
  def: NodeDef;
  processMinutes: number;
  capacity: number;
  queueCapacity: number;
  queue: number[];
  slots: Array<number | null>;
  reserved: number;
  utilization: number;
  processed: number;
  state: ResourceState;
  /** Changeover time when the product type switches; 0 when the node never retools. */
  changeoverMinutes: number;
  /** Installed mould form per slot (null before the first unit). */
  slotForm: Array<VariantId | null>;
  /** Retool time prepended to the current unit's service, per slot (0 when none). */
  slotChangeover: number[];
  /** Total minutes spent retooling, for the changeover-share KPI. */
  changeoverAccrued: number;
  /** Active campaign product type and how many more units it may still pull. */
  campaignType: VariantId | null;
  campaignRemaining: number;
}

/** Everything the snapshot builder needs, without touching the engine class. */
export interface EngineState {
  scenario: ScenarioDef;
  time: number;
  nodes: Map<string, NodeRuntime>;
  units: Map<number, Unit>;
  completionTimes: number[];
  leadTimes: number[];
  completed: number;
  /** Completions counted per product type, for the mixed-flow KPIs. */
  completedByType: Record<string, number>;
  released: number;
  history: HistoryPoint[];
  narration: string;
  narrationAt: number;
}

export function createNodeRuntime(def: NodeDef): NodeRuntime {
  return {
    def,
    processMinutes: def.processMinutes,
    capacity: def.capacity,
    queueCapacity: def.queueCapacity,
    queue: [],
    slots: new Array<number | null>(def.capacity).fill(null),
    reserved: 0,
    utilization: 0,
    processed: 0,
    state: 'idle',
    changeoverMinutes: 0,
    slotForm: new Array<VariantId | null>(def.capacity).fill(null),
    slotChangeover: new Array<number>(def.capacity).fill(0),
    changeoverAccrued: 0,
    campaignType: null,
    campaignRemaining: 0,
  };
}

/** Applies tunables to a node, growing/shrinking the parallel slot arrays. */
export function configureNode(node: NodeRuntime, params: Params): void {
  const { timeParam, capacityParam, queueParam, changeoverParam } = node.def;
  if (timeParam) node.processMinutes = Math.max(params[timeParam], TICK_MINUTES);
  if (queueParam) node.queueCapacity = Math.round(params[queueParam]);
  if (changeoverParam) node.changeoverMinutes = Math.max(0, params[changeoverParam]);
  if (!capacityParam) return;
  node.capacity = Math.max(1, Math.round(params[capacityParam]));
  while (node.slots.length < node.capacity) {
    node.slots.push(null);
    node.slotForm.push(null);
    node.slotChangeover.push(0);
  }
  while (node.slots.length > node.capacity && node.slots[node.slots.length - 1] === null) {
    node.slots.pop();
    node.slotForm.pop();
    node.slotChangeover.pop();
  }
}

export function countWip(units: Map<number, Unit>): number {
  let wip = 0;
  for (const unit of units.values()) if (unit.phase !== 'done') wip += 1;
  return wip;
}

export function countQueued(nodes: Map<string, NodeRuntime>): number {
  let queued = 0;
  for (const node of nodes.values()) queued += node.queue.length;
  return queued;
}

/** Samples the throughput/WIP/queue history up to the clock; returns the next due time. */
export function recordHistory(state: EngineState, nextHistoryAt: number): number {
  let at = nextHistoryAt;
  while (state.time >= at) {
    state.history.push({
      t: at,
      throughput: throughputPerHour(state.completionTimes, Math.max(state.time, TICK_MINUTES)),
      wip: countWip(state.units),
      queue: countQueued(state.nodes),
    });
    if (state.history.length > HISTORY_MAX_POINTS) state.history.shift();
    at += HISTORY_INTERVAL_MINUTES;
  }
  return at;
}
