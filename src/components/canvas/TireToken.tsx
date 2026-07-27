import { motion } from 'framer-motion';
import { memo } from 'react';
import {
  CANVAS_SURFACE,
  MOTION_BASE,
  MOTION_EASE,
  RIM_FILL,
  TOKEN_CURED_BODY,
  TOKEN_CURED_RIM,
  TOKEN_RADIUS,
  TOKEN_UNCURED_BODY,
  TOKEN_UNCURED_RIM,
} from '@/core/constants';

export interface TireTokenProps {
  x: number;
  y: number;
  /** Appearance stage: 0 green → 1 cured → 2 studded. */
  stage: number;
  /** Variant token colour used to tint the rim; falls back to the cured/green rim. */
  variantColor?: string;
  moving: boolean;
  highlighted: boolean;
  dimmed: boolean;
}

const TREAD_ANGLES = [0, 60, 120];

/** Stud positions moulded around the tread of a studded tire. */
const STUD_DOTS = Array.from({ length: 8 }, (_, index) => {
  const angle = (index / 8) * Math.PI * 2;
  const radius = TOKEN_RADIUS - 2.6;
  return { cx: Math.cos(angle) * radius, cy: Math.sin(angle) * radius };
});

/**
 * One physical tire. Position is driven by the engine while moving and by
 * eased transitions while queueing, so tokens roll in instead of teleporting.
 * Appearance tracks the process: green (uncured) → cured (tread) → studded.
 */
export const TireToken = memo(function TireToken({
  x,
  y,
  stage,
  variantColor,
  moving,
  highlighted,
  dimmed,
}: TireTokenProps) {
  const cured = stage >= 1;
  const studded = stage >= 2;
  const body = cured ? TOKEN_CURED_BODY : TOKEN_UNCURED_BODY;
  const rim = variantColor ?? (cured ? TOKEN_CURED_RIM : TOKEN_UNCURED_RIM);

  return (
    <motion.g
      initial={{ x, y, scale: 0.3, opacity: 0 }}
      animate={{
        x,
        y,
        scale: highlighted ? 1.16 : 1,
        opacity: dimmed ? 0.35 : 1,
      }}
      transition={
        moving
          ? { x: { duration: 0 }, y: { duration: 0 }, scale: { duration: MOTION_BASE }, opacity: { duration: MOTION_BASE } }
          : { duration: MOTION_BASE, ease: MOTION_EASE }
      }
    >
      <circle r={TOKEN_RADIUS} fill={body} stroke={rim} strokeWidth={1.8} />
      {/* Tread pattern is only moulded during vulcanisation — smooth before it. */}
      {cured
        ? TREAD_ANGLES.map((angle) => (
            <line
              key={angle}
              x1={0}
              y1={-TOKEN_RADIUS + 1.5}
              x2={0}
              y2={-TOKEN_RADIUS + 4.5}
              stroke={CANVAS_SURFACE}
              strokeWidth={1.4}
              strokeLinecap="round"
              opacity={0.85}
              transform={`rotate(${angle})`}
            />
          ))
        : null}
      {/* Studs are pressed in after vulcanisation on the studded variant. */}
      {studded
        ? STUD_DOTS.map((dot, index) => (
            <circle key={index} cx={dot.cx} cy={dot.cy} r={1.5} fill={RIM_FILL} stroke={rim} strokeWidth={0.5} />
          ))
        : null}
      <circle r={TOKEN_RADIUS * 0.42} fill={CANVAS_SURFACE} opacity={0.94} />
      <circle r={TOKEN_RADIUS * 0.42} fill="none" stroke={rim} strokeWidth={1.1} opacity={0.5} />
    </motion.g>
  );
});
