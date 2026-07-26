import { motion } from 'framer-motion';
import { MachineArt } from '@/components/machines';
import { MachineImage } from '@/components/machines/MachineImage';
import { MACHINE_IMAGES } from '@/components/machines/machineImages';
import {
  ACCENT,
  BRAND_50,
  BRAND_600,
  CANVAS_INK,
  CANVAS_LINE,
  CANVAS_MUTED,
  CANVAS_SURFACE,
  CANVAS_ZONE_LINE,
  MOTION_BASE,
  MOTION_EASE,
  STATE_COLORS,
  STATION_HEIGHT,
  STATION_WIDTH,
  TOC_DIMMED_OPACITY,
} from '@/core/constants';
import { HALF_H, HALF_W, rackColumns, rackVisibleCapacity } from '@/core/layout';
import type { NodeDef, NodeView } from '@/core/types';

const INNER = HALF_W - 14;

export function stationAccent(view: NodeView | undefined, muted: boolean): string {
  if (view?.isBottleneck) return STATE_COLORS.bottleneck;
  if (muted) return STATE_COLORS.idle;
  return STATE_COLORS[view?.state ?? 'idle'];
}

function Metric({ x, label, value, muted }: { x: number; label: string; value: string; muted?: boolean }) {
  return (
    <g>
      <text x={x} y={74} fontSize={10} fontWeight={600} letterSpacing={1.1} fill={CANVAS_MUTED}>
        {label}
      </text>
      <text
        x={x}
        y={92}
        fontSize={15}
        fontWeight={700}
        fill={muted ? CANVAS_MUTED : CANVAS_INK}
        fontFamily="'Open Sans', sans-serif"
      >
        {value}
      </text>
    </g>
  );
}

export interface StationNodeProps {
  def: NodeDef;
  view: NodeView | undefined;
  /** True while TOC mode dims everything outside the constraint group. */
  dimmed: boolean;
  /** True while TOC mode is on and this station is not the constraint. */
  greyed: boolean;
  fill: number;
  /** Headline number for sources, buffers and sinks. */
  metricValue: number;
}

export function StationNode({ def, view, dimmed, greyed, fill, metricValue }: StationNodeProps) {
  const accent = stationAccent(view, greyed);
  const isConstraint = Boolean(view?.isBottleneck);
  const utilization = view ? Math.round(view.utilization * 100) : 0;
  const active = view?.state === 'working';
  const showMeters = def.kind === 'process';
  const stock = view?.queueLength ?? 0;
  const overflow = def.kind === 'buffer' ? Math.max(stock - rackVisibleCapacity(def), 0) : 0;

  return (
    <motion.g
      initial={false}
      animate={{ opacity: dimmed ? TOC_DIMMED_OPACITY : 1 }}
      transition={{ duration: MOTION_BASE, ease: MOTION_EASE }}
    >
      <g transform={`translate(${def.x} ${def.y})`}>
        <motion.rect
          x={-HALF_W}
          y={-HALF_H}
          width={STATION_WIDTH}
          height={STATION_HEIGHT}
          rx={16}
          fill={CANVAS_SURFACE}
          stroke={isConstraint ? accent : CANVAS_LINE}
          strokeWidth={isConstraint ? 2.4 : 1.4}
          initial={false}
          animate={isConstraint ? { strokeOpacity: [0.55, 1, 0.55] } : { strokeOpacity: 1 }}
          transition={isConstraint ? { duration: 1.8, repeat: Infinity } : { duration: MOTION_BASE }}
        />

        <rect x={-INNER} y={-HALF_H + 12} width={26} height={17} rx={5} fill={BRAND_50} />
        <text
          x={-INNER + 13}
          y={-HALF_H + 24.5}
          fontSize={11}
          fontWeight={700}
          textAnchor="middle"
          fill={BRAND_600}
          fontFamily="'Open Sans', sans-serif"
        >
          {String(def.index).padStart(2, '0')}
        </text>
        <text x={-INNER + 34} y={-HALF_H + 25} fontSize={16} fontWeight={600} fill={CANVAS_INK}>
          {def.name}
        </text>
        <circle cx={INNER - 4} cy={-HALF_H + 20} r={5} fill={accent} />

        {MACHINE_IMAGES[def.machine] ? (
          <MachineImage kind={def.machine} active={active} accent={accent} greyed={greyed} />
        ) : (
          <MachineArt
            kind={def.machine}
            active={active}
            accent={accent}
            slots={view?.slotCount ?? def.capacity}
            queueCapacity={view?.queueCapacity ?? def.queueCapacity}
            stock={stock}
            columns={rackColumns(def)}
            fill={fill}
          />
        )}

        {overflow > 0 ? (
          <g>
            <rect x={INNER - 46} y={-14} width={46} height={19} rx={9.5} fill={ACCENT} />
            <text
              x={INNER - 23}
              y={-0.5}
              fontSize={12}
              fontWeight={700}
              textAnchor="middle"
              fill={CANVAS_SURFACE}
              fontFamily="'Open Sans', sans-serif"
            >
              {`+${overflow}`}
            </text>
          </g>
        ) : null}

        <text x={-INNER} y={66} fontSize={12} fontWeight={500} fill={CANVAS_MUTED}>
          {def.subtitle}
        </text>

        {showMeters ? (
          <>
            <Metric x={-INNER} label="НЗП" value={String(view?.wip ?? 0)} />
            <Metric x={-INNER + 66} label="ОЧЕР" value={String(view?.queueLength ?? 0)} />
            <Metric x={-INNER + 140} label="ЗАГР" value={`${utilization}%`} muted={utilization === 0} />
            <rect x={-INNER} y={HALF_H - 10} width={INNER * 2} height={4} rx={2} fill={CANVAS_ZONE_LINE} />
            <motion.rect
              y={HALF_H - 10}
              height={4}
              rx={2}
              fill={accent}
              initial={false}
              animate={{ x: -INNER, width: Math.max(INNER * 2 * (view?.utilization ?? 0), 2) }}
              transition={{ duration: MOTION_BASE, ease: MOTION_EASE }}
            />
          </>
        ) : (
          <>
            <Metric
              x={-INNER}
              label={def.kind === 'buffer' ? 'ЗАПАС' : def.kind === 'sink' ? 'ГОТОВО' : 'ЗАПУСК'}
              value={String(metricValue)}
            />
            {def.kind === 'buffer' ? (
              <Metric x={-INNER + 90} label="ЁМКОСТЬ" value={String(view?.queueCapacity ?? 0)} muted />
            ) : null}
          </>
        )}
      </g>
    </motion.g>
  );
}
