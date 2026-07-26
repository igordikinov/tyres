import { area, curveMonotoneX, line, max, scaleLinear } from 'd3';
import { useMemo } from 'react';
import {
  ACCENT,
  BRAND_500,
  CANVAS_LINE,
  CANVAS_MUTED,
  CANVAS_ZONE_LINE,
  HORIZON_MINUTES,
  INK_300,
} from '@/core/constants';
import type { HistoryPoint } from '@/core/types';

const WIDTH = 320;
const HEIGHT = 132;
const MARGIN = { top: 12, right: 10, bottom: 20, left: 30 };
const MIN_DOMAIN = 10;

export interface ThroughputChartProps {
  history: HistoryPoint[];
  target: number;
  currentTime: number;
}

/** Compact D3 line chart of throughput against the planned rate. */
export function ThroughputChart({ history, target, currentTime }: ThroughputChartProps) {
  const { linePath, areaPath, ticks, x, y } = useMemo(() => {
    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
    const peak = max(history, (point) => point.throughput) ?? 0;
    const upper = Math.max(peak, target, MIN_DOMAIN) * 1.15;

    const xScale = scaleLinear().domain([0, HORIZON_MINUTES]).range([0, innerWidth]);
    const yScale = scaleLinear().domain([0, upper]).range([innerHeight, 0]).nice();

    const lineGenerator = line<HistoryPoint>()
      .x((point) => xScale(point.t))
      .y((point) => yScale(point.throughput))
      .curve(curveMonotoneX);

    const areaGenerator = area<HistoryPoint>()
      .x((point) => xScale(point.t))
      .y0(innerHeight)
      .y1((point) => yScale(point.throughput))
      .curve(curveMonotoneX);

    return {
      linePath: history.length > 1 ? (lineGenerator(history) ?? '') : '',
      areaPath: history.length > 1 ? (areaGenerator(history) ?? '') : '',
      ticks: yScale.ticks(3),
      x: xScale,
      y: yScale,
    };
  }, [history, target]);

  const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const innerWidth = WIDTH - MARGIN.left - MARGIN.right;

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-full w-full" role="img" aria-label="История выработки">
      <g transform={`translate(${MARGIN.left} ${MARGIN.top})`}>
        {ticks.map((tick) => (
          <g key={tick} transform={`translate(0 ${y(tick)})`}>
            <line x1={0} x2={innerWidth} stroke={CANVAS_ZONE_LINE} strokeWidth={1} />
            <text x={-8} y={3.5} fontSize={9} textAnchor="end" fill={CANVAS_MUTED} fontFamily="'Open Sans', sans-serif">
              {tick}
            </text>
          </g>
        ))}

        <line
          x1={0}
          x2={innerWidth}
          y1={y(target)}
          y2={y(target)}
          stroke={ACCENT}
          strokeWidth={1.4}
          strokeDasharray="4 4"
          opacity={0.65}
        />
        <text x={innerWidth} y={y(target) - 5} fontSize={9} textAnchor="end" fill={ACCENT} fontWeight={600}>
          план {target.toFixed(0)}
        </text>

        {areaPath ? <path d={areaPath} fill={BRAND_500} opacity={0.09} /> : null}
        {linePath ? (
          <path d={linePath} fill="none" stroke={BRAND_500} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        ) : null}

        <line
          x1={x(Math.min(currentTime, HORIZON_MINUTES))}
          x2={x(Math.min(currentTime, HORIZON_MINUTES))}
          y1={0}
          y2={innerHeight}
          stroke={INK_300}
          strokeWidth={1}
        />
        <line x1={0} x2={innerWidth} y1={innerHeight} y2={innerHeight} stroke={CANVAS_LINE} strokeWidth={1.2} />
        {[0, HORIZON_MINUTES / 2, HORIZON_MINUTES].map((tick) => (
          <text
            key={tick}
            x={x(tick)}
            y={innerHeight + 13}
            fontSize={9}
            textAnchor={tick === 0 ? 'start' : tick === HORIZON_MINUTES ? 'end' : 'middle'}
            fill={CANVAS_MUTED}
            fontFamily="'Open Sans', sans-serif"
          >
            {`${(tick / 60).toFixed(0)}ч`}
          </text>
        ))}
      </g>
    </svg>
  );
}
