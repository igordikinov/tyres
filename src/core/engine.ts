import { TICK_EPSILON, TICK_MINUTES, UTILIZATION_TAU_MINUTES } from './constants';
import { Narrator } from './narrator';
import {
  configureNode,
  createNodeRuntime,
  recordHistory,
  type EngineState,
  type NodeRuntime,
  type Unit,
} from './runtime';
import { changeoverFor, pickIndex, ReleasePlanCursor, routeFor } from './scheduling';
import { buildSnapshot } from './snapshot';
import type { Params, ScenarioDef, SchedulingPolicy, Snapshot } from './types';

/**
 * Deterministic, fixed-step factory simulation.
 *
 * The engine knows nothing about tires: it moves units through Resources,
 * Buffers and Routes described by a scenario. Determinism lets the timeline
 * rewind by replaying from t = 0.
 */
export class FactoryEngine {
  readonly scenario: ScenarioDef;
  private params: Params;
  private state: EngineState;
  private order: string[] = [];
  private nextUnitId = 1;
  private pendingRelease = 0;
  private nextReleaseAt = 0;
  private nextHistoryAt = 0;
  private readonly narrator: Narrator;
  private readonly releasePlan: ReleasePlanCursor;
  private policy: SchedulingPolicy = 'fifo';
  /** Whole ticks executed so far; the clock is derived from this integer. */
  private ticks = 0;
  /** Total minutes requested, so partial frames accumulate without drift. */
  private requestedMinutes = 0;

  constructor(scenario: ScenarioDef, params: Params) {
    this.scenario = scenario;
    this.params = { ...params };
    this.narrator = new Narrator(scenario);
    this.releasePlan = new ReleasePlanCursor(scenario.releasePlan, scenario.productId ?? null);
    this.state = this.createState();
    this.reset();
  }

  get time(): number {
    return this.state.time;
  }

  private createState(): EngineState {
    return {
      scenario: this.scenario,
      time: 0,
      nodes: new Map<string, NodeRuntime>(),
      units: new Map<number, Unit>(),
      completionTimes: [], leadTimes: [], completed: 0, completedByType: {}, released: 0,
      history: [], narration: '', narrationAt: 0,
    };
  }

  reset(): void {
    this.state = this.createState();
    this.order = this.scenario.nodes.map((node) => node.id);
    for (const def of this.scenario.nodes) {
      this.state.nodes.set(def.id, createNodeRuntime(def));
    }
    this.nextUnitId = 1;
    this.pendingRelease = 0;
    this.nextReleaseAt = 0;
    this.nextHistoryAt = 0;
    this.narrator.reset();
    this.releasePlan.reset();
    this.ticks = 0;
    this.requestedMinutes = 0;
    this.applyParams(this.params);
  }

  getParams(): Params {
    return { ...this.params };
  }

  /** Switches the queue-selection policy; seek() replays with the current one. */
  setSchedulingPolicy(policy: SchedulingPolicy): void {
    this.policy = policy;
  }

  /** Applies tunables to the running model without discarding current state. */
  applyParams(params: Params): void {
    this.params = { ...params };
    for (const node of this.state.nodes.values()) configureNode(node, this.params);
  }

  /** Rebuilds the run from t = 0 up to `target`, used by the timeline. */
  seek(target: number): void {
    this.reset();
    this.advance(Math.max(0, target));
  }

  /**
   * Advances in whole ticks only; a browser frame's fractional remainder carries
   * over so a live run stays bit-identical to a seek() replay.
   */
  advance(minutes: number): void {
    if (!(minutes > 0)) return;
    this.requestedMinutes += minutes;
    const target = Math.floor(this.requestedMinutes / TICK_MINUTES + TICK_EPSILON);
    while (this.ticks < target) {
      this.ticks += 1;
      this.tick(TICK_MINUTES);
    }
  }

  getSnapshot(): Snapshot {
    return buildSnapshot(this.state);
  }

  private tick(dt: number): void {
    // Derived from the integer tick count so the clock cannot drift.
    this.state.time = this.ticks * TICK_MINUTES;
    this.updateMovers(dt);
    for (let i = this.order.length - 1; i >= 0; i -= 1) {
      this.updateNode(this.state.nodes.get(this.order[i])!, dt);
    }
    this.release();
    this.nextHistoryAt = recordHistory(this.state, this.nextHistoryAt);
  }

  private updateMovers(dt: number): void {
    for (const unit of this.state.units.values()) {
      if (unit.phase !== 'moving') continue;
      unit.elapsed += dt;
      if (unit.elapsed < unit.duration) continue;
      const target = this.state.nodes.get(unit.nodeId)!;
      target.reserved = Math.max(0, target.reserved - 1);
      unit.elapsed = 0;
      if (target.def.kind === 'sink') {
        unit.phase = 'done';
        this.state.completed += 1;
        const pid = unit.productId ?? 'all';
        this.state.completedByType[pid] = (this.state.completedByType[pid] ?? 0) + 1;
        this.state.completionTimes.push(this.state.time);
        this.state.leadTimes.push(this.state.time - unit.createdAt);
        this.narrator.announce(target.def, this.state.time, this.state);
        this.state.units.delete(unit.id);
      } else {
        unit.phase = 'queued';
        target.queue.push(unit.id);
      }
    }
  }

  private updateNode(node: NodeRuntime, dt: number): void {
    const kind = node.def.kind;
    if (kind === 'source' || kind === 'sink') return;
    if (kind === 'buffer') {
      this.updateBuffer(node, dt);
      return;
    }

    let working = 0;
    let blocked = 0;
    let retooling = 0;
    for (let slot = 0; slot < node.slots.length; slot += 1) {
      const unitId = node.slots[slot];
      if (unitId === null) continue;
      const unit = this.state.units.get(unitId)!;
      const wasDone = unit.elapsed >= unit.duration;
      if (!wasDone) {
        const before = unit.elapsed;
        unit.elapsed = Math.min(unit.duration, unit.elapsed + dt);
        if (before < node.slotChangeover[slot]) {
          retooling += 1;
          node.changeoverAccrued += Math.min(unit.elapsed, node.slotChangeover[slot]) - before;
        } else working += 1;
      }
      if (unit.elapsed >= unit.duration) {
        if (this.tryDepart(node, unitId)) {
          node.slots[slot] = null;
          node.processed += 1;
        } else if (wasDone) {
          blocked += 1;
        }
      }
    }
    const campaignSize = this.params.campaignSize;
    for (let slot = 0; slot < node.capacity && slot < node.slots.length; slot += 1) {
      if (node.slots[slot] !== null) continue;
      const idx = pickIndex(node, this.policy, campaignSize, (id) => this.state.units.get(id)!.productId);
      if (idx < 0) break;
      const unitId = node.queue.splice(idx, 1)[0];
      const unit = this.state.units.get(unitId)!;
      const retool = changeoverFor(node, slot, unit.productId);
      node.slotForm[slot] = unit.productId;
      node.slotChangeover[slot] = retool;
      unit.phase = 'service';
      unit.slotIndex = slot;
      unit.elapsed = 0;
      unit.duration = retool + node.processMinutes;
      node.slots[slot] = unitId;
      if (retool > 0) retooling += 1;
      else working += 1;
    }
    // A retooling slot is busy (occupied, just not producing), so it counts
    // toward utilisation — that is how a changeover-choked press becomes the
    // constraint the TOC view highlights.
    this.trackUtilization(node, working + retooling, dt);
    // idle = work incoming (queue/reserved); starved = upstream route ran dry.
    const awaiting = node.queue.length > 0 || node.reserved > 0;
    node.state =
      blocked > 0 ? 'blocked' : retooling > 0 ? 'changeover' : working > 0 ? 'working' : awaiting ? 'idle' : 'starved';
  }

  private updateBuffer(node: NodeRuntime, dt: number): void {
    const next = node.def.next ? this.state.nodes.get(node.def.next)! : null;
    while (node.queue.length > 0 && next && this.hasRoom(next)) {
      this.startMove(node, next, node.queue.shift()!);
      this.narrator.announce(node.def, this.state.time, this.state);
    }
    const full = node.queue.length >= node.queueCapacity;
    node.state = node.queue.length === 0 ? 'starved' : full ? 'blocked' : 'idle';
    this.trackUtilization(node, node.queue.length > 0 ? 1 : 0, dt);
  }

  private trackUtilization(node: NodeRuntime, working: number, dt: number): void {
    // While extra servers drain after a capacity cut, they still count.
    const servers = Math.max(node.capacity, node.slots.length);
    const instant = servers > 0 ? Math.min(working / servers, 1) : 0;
    const alpha = Math.min(dt / UTILIZATION_TAU_MINUTES, 1);
    node.utilization += (instant - node.utilization) * alpha;
  }

  private release(): void {
    const source = this.state.nodes.get(this.order[0])!;
    const target = source.def.next ? this.state.nodes.get(source.def.next)! : null;
    if (!target) return;
    const batch = Math.max(1, Math.round(this.params.batchSize));
    if (this.state.time >= this.nextReleaseAt) {
      this.pendingRelease += batch;
      this.nextReleaseAt = this.state.time + this.scenario.releaseIntervalMinutes * batch;
    }
    while (this.pendingRelease > 0 && this.hasRoom(target)) {
      const unit: Unit = {
        id: this.nextUnitId++,
        createdAt: this.state.time,
        nodeId: target.def.id,
        fromNodeId: source.def.id,
        phase: 'moving',
        elapsed: 0,
        duration: Math.max(source.def.transportMinutes, TICK_MINUTES),
        slotIndex: 0,
        productId: this.releasePlan.next(),
      };
      this.state.units.set(unit.id, unit);
      target.reserved += 1;
      this.pendingRelease -= 1;
      this.state.released += 1;
      this.narrator.announce(source.def, this.state.time, this.state);
    }
    source.state = this.pendingRelease > 0 ? 'blocked' : 'working';
  }

  private hasRoom(node: NodeRuntime): boolean {
    if (node.def.kind === 'sink') return true;
    return node.queue.length + node.reserved < node.queueCapacity;
  }

  private tryDepart(node: NodeRuntime, unitId: number): boolean {
    const nextId = routeFor(node.def, this.state.units.get(unitId)!.productId);
    const next = nextId ? this.state.nodes.get(nextId)! : null;
    if (!next || !this.hasRoom(next)) return false;
    this.startMove(node, next, unitId);
    this.narrator.announce(node.def, this.state.time, this.state);
    return true;
  }

  private startMove(from: NodeRuntime, to: NodeRuntime, unitId: number): void {
    const unit = this.state.units.get(unitId)!;
    unit.phase = 'moving';
    unit.fromNodeId = from.def.id;
    unit.nodeId = to.def.id;
    unit.elapsed = 0;
    unit.duration = Math.max(from.def.transportMinutes, TICK_MINUTES);
    to.reserved += 1;
  }

}
