import {
  QUEUE_CENTER_DY,
  QUEUE_GAP,
  RACK_BASE_DY,
  RACK_COLUMNS_DEFAULT,
  RACK_MAX_ROWS,
  RACK_ROW_GAP,
  SERVICE_CENTER_DY,
  SERVICE_COLUMNS,
  SERVICE_SLOT_GAP,
  STATION_HEIGHT,
  STATION_WIDTH,
} from './constants';
import type { NodeDef, NodeView, UnitView } from './types';

export interface Point {
  x: number;
  y: number;
}

export interface LinkGeometry {
  id: string;
  d: string;
  mid: Point;
  point: (t: number) => Point;
}

export const HALF_W = STATION_WIDTH / 2;
export const HALF_H = STATION_HEIGHT / 2;

const CORNER_RADIUS = 26;

function lerp(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/** Smooth acceleration and deceleration between two stations. */
export function easeInOutCubic(t: number): number {
  const clamped = Math.min(Math.max(t, 0), 1);
  return clamped < 0.5
    ? 4 * clamped * clamped * clamped
    : 1 - Math.pow(-2 * clamped + 2, 3) / 2;
}

export function rackColumns(def: NodeDef): number {
  return def.rackColumns ?? RACK_COLUMNS_DEFAULT;
}

/** Units a rack can display before the remainder collapses into a badge. */
export function rackVisibleCapacity(def: NodeDef): number {
  return rackColumns(def) * RACK_MAX_ROWS;
}

/** Route geometry between two stations, used for both the path and the tokens. */
export function buildLink(from: NodeDef, to: NodeDef): LinkGeometry {
  const id = `${from.id}->${to.id}`;
  if (from.y === to.y) {
    const start = { x: from.x + from.dir * HALF_W, y: from.y };
    const end = { x: to.x - to.dir * HALF_W, y: to.y };
    return {
      id,
      d: `M ${start.x} ${start.y} L ${end.x} ${end.y}`,
      mid: lerp(start, end, 0.5),
      point: (t) => lerp(start, end, t),
    };
  }

  const start = { x: from.x, y: from.y + HALF_H };
  const end = { x: to.x, y: to.y - HALF_H };
  if (Math.abs(from.x - to.x) < 1) {
    return {
      id,
      d: `M ${start.x} ${start.y} L ${end.x} ${end.y}`,
      mid: lerp(start, end, 0.5),
      point: (t) => lerp(start, end, t),
    };
  }

  const midY = (start.y + end.y) / 2;
  const sweep = end.x > start.x ? 1 : -1;
  const d =
    `M ${start.x} ${start.y} L ${start.x} ${midY - CORNER_RADIUS} ` +
    `Q ${start.x} ${midY} ${start.x + sweep * CORNER_RADIUS} ${midY} ` +
    `L ${end.x - sweep * CORNER_RADIUS} ${midY} ` +
    `Q ${end.x} ${midY} ${end.x} ${midY + CORNER_RADIUS} L ${end.x} ${end.y}`;

  const legA = Math.abs(midY - start.y);
  const legB = Math.abs(end.x - start.x);
  const legC = Math.abs(end.y - midY);
  const total = legA + legB + legC;
  const point = (t: number): Point => {
    const travelled = t * total;
    if (travelled <= legA) return { x: start.x, y: start.y + travelled };
    if (travelled <= legA + legB) return { x: start.x + sweep * (travelled - legA), y: midY };
    return { x: end.x, y: midY + (travelled - legA - legB) };
  };
  return { id, d, mid: { x: (start.x + end.x) / 2, y: midY }, point };
}

/** Offset of a service slot relative to the station centre. */
export function serviceOffset(index: number, slots: number): Point {
  const total = Math.max(slots, 1);
  const columns = Math.min(total, SERVICE_COLUMNS);
  const rows = Math.ceil(total / columns);
  const column = index % columns;
  const row = Math.floor(index / columns);
  return {
    x: (column - (columns - 1) / 2) * SERVICE_SLOT_GAP,
    y: SERVICE_CENTER_DY + (row - (rows - 1) / 2) * SERVICE_SLOT_GAP,
  };
}

/** Position of a unit currently being processed by a station. */
export function serviceSlot(def: NodeDef, index: number, slots: number): Point {
  const offset = serviceOffset(index, slots);
  return { x: def.x + offset.x, y: def.y + offset.y };
}

/** Position of a unit waiting in the in-station queue lane. */
export function queueSlot(def: NodeDef, index: number, queueCapacity: number): Point {
  const slots = Math.max(queueCapacity, 1);
  const offset = index - (slots - 1) / 2;
  return { x: def.x - def.dir * offset * QUEUE_GAP, y: def.y + QUEUE_CENTER_DY };
}

/** Position of a unit inside a buffer rack, filling bottom-up. */
export function rackSlot(def: NodeDef, index: number): Point {
  const columns = rackColumns(def);
  const column = index % columns;
  const row = Math.min(Math.floor(index / columns), RACK_MAX_ROWS - 1);
  return {
    x: def.x + (column - (columns - 1) / 2) * RACK_ROW_GAP,
    y: def.y + RACK_BASE_DY - row * RACK_ROW_GAP,
  };
}

export interface LayoutContext {
  defs: Record<string, NodeDef>;
  views: Record<string, NodeView>;
  links: Record<string, LinkGeometry>;
}

/** Resolves the canvas position of a unit for any phase of its life. */
export function resolveUnitPoint(unit: UnitView, context: LayoutContext): Point {
  const def = context.defs[unit.nodeId];
  if (!def) return { x: 0, y: 0 };

  if (unit.phase === 'moving' && unit.fromNodeId) {
    const link = context.links[`${unit.fromNodeId}->${unit.nodeId}`];
    if (link) return link.point(easeInOutCubic(unit.progress));
  }
  if (unit.phase === 'service') {
    const view = context.views[unit.nodeId];
    return serviceSlot(def, unit.slotIndex, view ? view.slotCount : 1);
  }
  if (def.kind === 'buffer') return rackSlot(def, unit.queueIndex);
  const view = context.views[unit.nodeId];
  return queueSlot(def, unit.queueIndex, view ? view.queueCapacity : 1);
}
