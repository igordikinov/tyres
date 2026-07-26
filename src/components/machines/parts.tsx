import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * Shared semi-isometric drawing primitives.
 * Machine local space: x in [-105, 105], floor line at y = 14.
 */
export const MACHINE_FLOOR = 14;

export const SHELL = '#FFFFFF';
export const WHITE = SHELL;
export const SHELL_SHADE = '#F1F5FA';
export const SHELL_DEEP = '#E2E8F2';
export const OUTLINE = '#C7D2E1';
export const OUTLINE_SOFT = '#DCE3ED';
export const METAL = '#94A3B8';
export const METAL_DARK = '#475569';

export interface MachineProps {
  active: boolean;
  accent: string;
  /** Physical server slots to draw, including ones draining after a cut. */
  slots: number;
  queueCapacity: number;
  /** Units currently held, used to size buffer racks. */
  stock: number;
  /** Columns of a buffer rack, taken from the scenario. */
  columns: number;
  /** 0..1 stock level, used by the warehouse shelves. */
  fill: number;
}

/** Isometric plinth that grounds every machine on the same floor plane. */
export function Plinth({ width = 168, depth = 16 }: { width?: number; depth?: number }) {
  const half = width / 2;
  const skew = 13;
  return (
    <g>
      <path
        d={`M ${-half + skew} ${MACHINE_FLOOR - depth} L ${half + skew} ${MACHINE_FLOOR - depth} L ${half} ${MACHINE_FLOOR} L ${-half} ${MACHINE_FLOOR} Z`}
        fill={SHELL_DEEP}
        stroke={OUTLINE}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      <path
        d={`M ${-half} ${MACHINE_FLOOR} L ${half} ${MACHINE_FLOOR} L ${half} ${MACHINE_FLOOR + 5} L ${-half} ${MACHINE_FLOOR + 5} Z`}
        fill={OUTLINE_SOFT}
      />
    </g>
  );
}

/** Machine body: front elevation plus a shallow isometric top face. */
export function Shell({
  x,
  y,
  width,
  height,
  radius = 8,
  fill = SHELL,
  children,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: number;
  fill?: string;
  children?: ReactNode;
}) {
  const skew = 11;
  return (
    <g>
      <path
        d={`M ${x} ${y} L ${x + skew} ${y - skew} L ${x + width + skew} ${y - skew} L ${x + width} ${y} Z`}
        fill={SHELL_SHADE}
        stroke={OUTLINE}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      <path
        d={`M ${x + width} ${y} L ${x + width + skew} ${y - skew} L ${x + width + skew} ${y + height - skew} L ${x + width} ${y + height} Z`}
        fill={SHELL_DEEP}
        stroke={OUTLINE}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={radius}
        fill={fill}
        stroke={OUTLINE}
        strokeWidth={1.4}
      />
      {children}
    </g>
  );
}

/** Rotating element used for rotors, rolls and drums. */
export function Rotor({
  cx,
  cy,
  radius,
  blades = 3,
  active,
  duration = 2.6,
  reverse = false,
  accent,
}: {
  cx: number;
  cy: number;
  radius: number;
  blades?: number;
  active: boolean;
  duration?: number;
  reverse?: boolean;
  accent: string;
}) {
  const target = reverse ? -360 : 360;
  return (
    <g>
      <circle cx={cx} cy={cy} r={radius} fill={SHELL_SHADE} stroke={OUTLINE} strokeWidth={1.4} />
      <motion.g
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        initial={false}
        animate={{ rotate: active ? target : 0 }}
        transition={active ? { duration, ease: 'linear', repeat: Infinity } : { duration: 0.4 }}
      >
        <g>
          {Array.from({ length: blades }).map((_, index) => (
            <rect
              key={index}
              x={cx - radius * 0.82}
              y={cy - 1.6}
              width={radius * 1.64}
              height={3.2}
              rx={1.6}
              fill={accent}
              transform={`rotate(${(index * 180) / blades} ${cx} ${cy})`}
            />
          ))}
          <circle cx={cx} cy={cy} r={radius * 0.22} fill={METAL_DARK} />
        </g>
      </motion.g>
    </g>
  );
}

/** Conveyor with travelling dashes. */
export function Belt({
  x1,
  x2,
  y,
  active,
  accent,
  speed = 1.1,
}: {
  x1: number;
  x2: number;
  y: number;
  active: boolean;
  accent: string;
  speed?: number;
}) {
  return (
    <g>
      <rect x={x1} y={y - 4} width={x2 - x1} height={8} rx={4} fill={SHELL_DEEP} stroke={OUTLINE} strokeWidth={1} />
      <motion.line
        x1={x1 + 4}
        x2={x2 - 4}
        y1={y}
        y2={y}
        stroke={accent}
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray="7 9"
        initial={false}
        animate={{ strokeDashoffset: active ? [0, -32] : 0 }}
        transition={active ? { duration: speed, ease: 'linear', repeat: Infinity } : { duration: 0.3 }}
      />
    </g>
  );
}

/** Rising steam used by the vulcanisation presses. */
export function Steam({
  x,
  y,
  active,
  delay = 0,
  accent = METAL,
}: {
  x: number;
  y: number;
  active: boolean;
  delay?: number;
  accent?: string;
}) {
  return (
    <motion.circle
      cx={x}
      cy={y}
      r={5}
      fill={accent}
      initial={{ opacity: 0 }}
      animate={active ? { opacity: [0, 0.34, 0], y: [0, -22], scale: [0.6, 1.7] } : { opacity: 0 }}
      transition={active ? { duration: 1.8, repeat: Infinity, delay, ease: 'easeOut' } : { duration: 0.2 }}
    />
  );
}

export function Louvers({ x, y, width, rows = 3 }: { x: number; y: number; width: number; rows?: number }) {
  return (
    <g opacity={0.75}>
      {Array.from({ length: rows }).map((_, index) => (
        <line
          key={index}
          x1={x}
          x2={x + width}
          y1={y + index * 5}
          y2={y + index * 5}
          stroke={OUTLINE}
          strokeWidth={1.4}
          strokeLinecap="round"
        />
      ))}
    </g>
  );
}
