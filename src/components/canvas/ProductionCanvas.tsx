import { useId, useMemo } from 'react';
import {
  CANVAS_GRID,
  CANVAS_MUTED,
  CANVAS_SURFACE,
  CANVAS_ZONE,
  CANVAS_ZONE_LINE,
  STATE_COLORS,
  STATION_HEIGHT,
  WAREHOUSE_VISUAL_CAPACITY,
  ZONE_PADDING,
} from '@/core/constants';
import {
  buildLink,
  resolveUnitPoint,
  type LayoutContext,
  type LinkGeometry,
} from '@/core/layout';
import type { NodeDef, ScenarioDef, Snapshot } from '@/core/types';
import { FlowLink } from './FlowLink';
import { InformationFlow } from './InformationFlow';
import { StationNode, stationAccent } from './StationNode';
import { TireToken } from './TireToken';

export interface ProductionCanvasProps {
  scenario: ScenarioDef;
  snapshot: Snapshot;
  tocMode: boolean;
  /** Draws the dashed APS schedule bus under every row. */
  informationFlow?: boolean;
  /** Optional caption per canvas row, in flow order. */
  zones?: string[];
}

function buildLinks(nodes: NodeDef[]): Record<string, LinkGeometry> {
  const byId = Object.fromEntries(nodes.map((node) => [node.id, node]));
  const links: Record<string, LinkGeometry> = {};
  for (const node of nodes) {
    if (!node.next) continue;
    const target = byId[node.next];
    if (!target) continue;
    const link = buildLink(node, target);
    links[link.id] = link;
  }
  return links;
}

export function ProductionCanvas({
  scenario,
  snapshot,
  tocMode,
  informationFlow = false,
  zones,
}: ProductionCanvasProps) {
  const gridId = `grid-${useId()}`;
  const defs = useMemo(
    () => Object.fromEntries(scenario.nodes.map((node) => [node.id, node])) as Record<string, NodeDef>,
    [scenario],
  );
  const links = useMemo(() => buildLinks(scenario.nodes), [scenario]);
  const transformIndex = useMemo(() => {
    const marker = scenario.nodes.find((node) => node.transformsAppearance);
    return marker ? marker.index : Number.POSITIVE_INFINITY;
  }, [scenario]);
  const rows = useMemo(() => Array.from(new Set(scenario.nodes.map((node) => node.y))), [scenario]);

  /**
   * TOC mode must keep the constraint AND the stock waiting in front of it
   * fully visible — that queue is the entire point of the demonstration.
   */
  const focusIds = useMemo(() => {
    const focus = new Set<string>();
    const bottleneckId = snapshot.kpi.bottleneckId;
    if (!bottleneckId) return focus;
    focus.add(bottleneckId);
    for (const node of scenario.nodes) {
      if (node.next === bottleneckId && node.kind === 'buffer') focus.add(node.id);
    }
    return focus;
  }, [scenario, snapshot.kpi.bottleneckId]);

  const isDimmed = (nodeId: string) => tocMode && focusIds.size > 0 && !focusIds.has(nodeId);
  const context: LayoutContext = { defs, views: snapshot.nodes, links };

  return (
    <svg
      viewBox={`0 0 ${scenario.canvas.width} ${scenario.canvas.height}`}
      preserveAspectRatio="xMidYMid meet"
      className="h-full w-full"
      aria-labelledby={`${gridId}-title`}
    >
      <title id={`${gridId}-title`}>{`${scenario.name} production flow`}</title>
      <defs>
        <pattern id={gridId} width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke={CANVAS_GRID} strokeWidth="1" />
        </pattern>
      </defs>

      <rect width={scenario.canvas.width} height={scenario.canvas.height} fill={CANVAS_SURFACE} />
      <rect width={scenario.canvas.width} height={scenario.canvas.height} fill={`url(#${gridId})`} />

      {rows.map((y, index) => (
        <g key={y}>
          <rect
            x={ZONE_PADDING / 2}
            y={y - STATION_HEIGHT / 2 - ZONE_PADDING}
            width={scenario.canvas.width - ZONE_PADDING}
            height={STATION_HEIGHT + ZONE_PADDING * 2}
            rx={26}
            fill={CANVAS_ZONE}
            stroke={CANVAS_ZONE_LINE}
            strokeWidth={1.4}
          />
          {zones?.[index] ? (
            <text
              x={ZONE_PADDING / 2 + 20}
              y={y - STATION_HEIGHT / 2 - ZONE_PADDING + 22}
              fontSize={12}
              fontWeight={700}
              letterSpacing={1.6}
              fill={CANVAS_MUTED}
            >
              {zones[index].toUpperCase()}
            </text>
          ) : null}
        </g>
      ))}

      {informationFlow ? (
        <InformationFlow nodes={scenario.nodes} canvasWidth={scenario.canvas.width} />
      ) : null}

      {Object.values(links).map((link) => {
        const [fromId, targetId] = link.id.split('->');
        const view = snapshot.nodes[fromId];
        return (
          <FlowLink
            key={link.id}
            link={link}
            active={view?.state === 'working'}
            accent={tocMode ? STATE_COLORS.idle : stationAccent(view, false)}
            dimmed={isDimmed(fromId) && isDimmed(targetId)}
          />
        );
      })}

      {scenario.nodes.map((def) => {
        const view = snapshot.nodes[def.id];
        const metricValue =
          def.kind === 'sink'
            ? snapshot.kpi.completed
            : def.kind === 'source'
              ? snapshot.kpi.released
              : (view?.queueLength ?? 0);
        return (
          <StationNode
            key={def.id}
            def={def}
            view={view}
            dimmed={isDimmed(def.id)}
            greyed={tocMode && !view?.isBottleneck}
            metricValue={metricValue}
            fill={
              def.kind === 'sink' ? Math.min(snapshot.kpi.completed / WAREHOUSE_VISUAL_CAPACITY, 1) : 0
            }
          />
        );
      })}

      {snapshot.units.map((unit) => {
        const def = defs[unit.nodeId];
        if (!def) return null;
        // The buffer renders its own green-tire rack; a "+N" badge covers overflow.
        if (def.kind === 'buffer' && unit.phase === 'queued') {
          return null;
        }
        const point = resolveUnitPoint(unit, context);
        return (
          <TireToken
            key={unit.id}
            x={point.x}
            y={point.y}
            cured={def.index > transformIndex}
            moving={unit.phase === 'moving'}
            highlighted={unit.phase === 'service'}
            dimmed={isDimmed(unit.nodeId)}
          />
        );
      })}
    </svg>
  );
}
