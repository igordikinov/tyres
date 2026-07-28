import { computeKpi, type ResourceStat } from './metrics';
import { countWip, type EngineState } from './runtime';
import type { NodeView, Snapshot, UnitView } from './types';

/** Flattens the runtime into the shape the metrics module expects. */
export function buildResourceStats(state: EngineState): ResourceStat[] {
  return state.scenario.nodes.map((def) => {
    const node = state.nodes.get(def.id)!;
    const previous = state.scenario.nodes.find((candidate) => candidate.next === def.id);
    const upstream = previous && previous.kind === 'buffer' ? state.nodes.get(previous.id)! : null;
    return {
      id: def.id,
      name: def.name,
      isProcess: def.kind === 'process',
      queue: node.queue.length,
      queueCapacity: node.queueCapacity,
      inService: node.slots.filter((slot) => slot !== null).length,
      capacity: node.capacity,
      utilization: node.utilization,
      upstreamQueue: upstream ? upstream.queue.length : 0,
      upstreamCapacity: upstream ? upstream.queueCapacity : 0,
    };
  });
}

/** Immutable view of the factory for one rendered frame. */
export function buildSnapshot(state: EngineState): Snapshot {
  const resources = buildResourceStats(state);
  const kpi = computeKpi({
    time: state.time,
    completionTimes: state.completionTimes,
    leadTimes: state.leadTimes,
    completed: state.completed,
    released: state.released,
    wip: countWip(state.units),
    resources,
  });

  const nodes: Record<string, NodeView> = {};
  for (const stat of resources) {
    const node = state.nodes.get(stat.id)!;
    nodes[stat.id] = {
      id: stat.id,
      state: node.state,
      queueLength: stat.queue,
      queueCapacity: stat.queueCapacity,
      inService: stat.inService,
      capacity: stat.capacity,
      slotCount: node.slots.length,
      utilization: stat.utilization,
      wip: stat.queue + stat.inService,
      processed: node.processed,
      processMinutes: node.processMinutes,
      isBottleneck: kpi.bottleneckId === stat.id,
    };
  }

  const queueIndex = new Map<number, number>();
  for (const node of state.nodes.values()) {
    node.queue.forEach((unitId, index) => queueIndex.set(unitId, index));
  }

  // Appearance stage = number of transformsAppearance nodes a unit has exited
  // (0 green → 1 cured → 2 studded). A unit sitting at, or moving toward, a node
  // has exited every node strictly upstream, so we compare chain positions.
  const chainOrder = new Map<string, number>();
  const byId = new Map(state.scenario.nodes.map((node) => [node.id, node]));
  let cursor = state.scenario.nodes.find((node) => node.kind === 'source')?.id ?? null;
  for (let order = 0; cursor && !chainOrder.has(cursor); order += 1) {
    chainOrder.set(cursor, order);
    cursor = byId.get(cursor)?.next ?? null;
  }
  const transformOrders = state.scenario.nodes
    .filter((node) => node.transformsAppearance)
    .map((node) => chainOrder.get(node.id) ?? Number.POSITIVE_INFINITY);
  const stageAt = (nodeId: string): number => {
    const position = chainOrder.get(nodeId) ?? 0;
    return transformOrders.reduce((count, order) => count + (order < position ? 1 : 0), 0);
  };

  const units: UnitView[] = [];
  for (const unit of state.units.values()) {
    if (unit.phase === 'done') continue;
    units.push({
      id: unit.id,
      nodeId: unit.nodeId,
      fromNodeId: unit.fromNodeId,
      phase: unit.phase,
      progress: unit.duration > 0 ? Math.min(unit.elapsed / unit.duration, 1) : 1,
      queueIndex: queueIndex.get(unit.id) ?? 0,
      slotIndex: unit.slotIndex,
      createdAt: unit.createdAt,
      appearanceStage: stageAt(unit.nodeId),
      productId: unit.productId ?? undefined,
    });
  }

  return {
    time: state.time,
    units,
    nodes,
    kpi,
    history: [...state.history],
    narration: state.narration,
    narrationAt: state.narrationAt,
  };
}
