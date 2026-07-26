import {
  BOTTLENECK_PRESSURE_WEIGHT,
  BOTTLENECK_UTILIZATION_THRESHOLD,
  BOTTLENECK_WARMUP_MINUTES,
  LEAD_TIME_SAMPLE_SIZE,
  THROUGHPUT_WINDOW_MINUTES,
} from './constants';
import type { Kpi } from './types';

/** Flat view of one resource, decoupled from the engine to avoid cycles. */
export interface ResourceStat {
  id: string;
  name: string;
  isProcess: boolean;
  queue: number;
  queueCapacity: number;
  inService: number;
  capacity: number;
  utilization: number;
  /** Queue held by an immediately upstream buffer, attributed to this node. */
  upstreamQueue: number;
  upstreamCapacity: number;
}

export interface MetricsInput {
  time: number;
  completionTimes: number[];
  leadTimes: number[];
  completed: number;
  released: number;
  wip: number;
  resources: ResourceStat[];
}

export function throughputPerHour(completionTimes: number[], time: number): number {
  if (time <= 0) return 0;
  const window = Math.min(THROUGHPUT_WINDOW_MINUTES, time);
  const from = time - window;
  let count = 0;
  for (let i = completionTimes.length - 1; i >= 0; i -= 1) {
    if (completionTimes[i] < from) break;
    count += 1;
  }
  return (count * 60) / window;
}

export function averageLeadTime(leadTimes: number[]): number {
  if (leadTimes.length === 0) return 0;
  const sample = leadTimes.slice(-LEAD_TIME_SAMPLE_SIZE);
  const total = sample.reduce((sum, value) => sum + value, 0);
  return total / sample.length;
}

/**
 * The constraint is the resource that is both highly utilised and starved of
 * free queue space. Queue pressure breaks ties between saturated resources.
 */
export function findBottleneck(resources: ResourceStat[], time: number): string | null {
  const candidates = resources.filter((r) => r.isProcess && r.capacity > 0);
  if (candidates.length === 0 || time < BOTTLENECK_WARMUP_MINUTES) return null;

  let bestId: string | null = null;
  let bestScore = -Infinity;
  for (const resource of candidates) {
    const room = resource.queueCapacity + resource.upstreamCapacity;
    const waiting = resource.queue + resource.upstreamQueue;
    const pressure = room > 0 ? Math.min(waiting / room, 1) : 0;
    const score = resource.utilization + pressure * BOTTLENECK_PRESSURE_WEIGHT;
    if (score > bestScore) {
      bestScore = score;
      bestId = resource.id;
    }
  }
  const best = candidates.find((r) => r.id === bestId);
  if (!best) return null;
  const hasPressure = best.upstreamQueue + best.queue > 0;
  return best.utilization >= BOTTLENECK_UTILIZATION_THRESHOLD || hasPressure ? bestId : null;
}

export function computeKpi(input: MetricsInput): Kpi {
  const processes = input.resources.filter((r) => r.isProcess && r.capacity > 0);
  const utilization =
    processes.length > 0
      ? processes.reduce((sum, r) => sum + r.utilization, 0) / processes.length
      : 0;
  const queue = input.resources.reduce((sum, r) => sum + r.queue, 0);
  const bottleneckId = findBottleneck(input.resources, input.time);
  const bottleneck = input.resources.find((r) => r.id === bottleneckId);

  return {
    throughput: throughputPerHour(input.completionTimes, input.time),
    cycleTimeMinutes: averageLeadTime(input.leadTimes),
    wip: input.wip,
    queue,
    utilization,
    bottleneckId,
    bottleneckName: bottleneck ? bottleneck.name : '—',
    bottleneckUtilization: bottleneck ? bottleneck.utilization : 0,
    completed: input.completed,
    released: input.released,
  };
}
