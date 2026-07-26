import type { HistoryPoint, NodeDef, ResourceState, ScenarioDef, UnitView } from './types';

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
  };
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
