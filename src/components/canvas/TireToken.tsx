import { motion } from 'framer-motion';
import { memo } from 'react';
import {
  MOTION_BASE,
  MOTION_EASE,
  TOKEN_CURED_BODY,
  TOKEN_CURED_RIM,
  TOKEN_UNCURED_BODY,
  TOKEN_UNCURED_RIM,
  TOKEN_RADIUS,
  CANVAS_SURFACE,
} from '@/core/constants';

export interface TireTokenProps {
  x: number;
  y: number;
  cured: boolean;
  moving: boolean;
  highlighted: boolean;
  dimmed: boolean;
}

const TREAD_ANGLES = [0, 60, 120];

/**
 * One physical tire. Position is driven by the engine while moving and by
 * eased transitions while queueing, so tokens roll in instead of teleporting.
 */
export const TireToken = memo(function TireToken({
  x,
  y,
  cured,
  moving,
  highlighted,
  dimmed,
}: TireTokenProps) {
  const body = cured ? TOKEN_CURED_BODY : TOKEN_UNCURED_BODY;
  const rim = cured ? TOKEN_CURED_RIM : TOKEN_UNCURED_RIM;

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
      <circle r={TOKEN_RADIUS} fill={body} stroke={rim} strokeWidth={1.6} />
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
      <circle r={TOKEN_RADIUS * 0.42} fill={CANVAS_SURFACE} opacity={0.94} />
      <circle r={TOKEN_RADIUS * 0.42} fill="none" stroke={rim} strokeWidth={1.1} opacity={0.5} />
    </motion.g>
  );
});
