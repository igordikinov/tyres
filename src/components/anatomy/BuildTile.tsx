import { motion } from 'framer-motion';
import {
  BRAND_50,
  CANVAS_MUTED,
  CANVAS_SURFACE,
  GREEN_TIRE,
  INK_300,
  MOTION_BASE,
  MOTION_EASE,
  RIM_FILL,
} from '@/core/constants';
import { BUILD_RADII } from '@/core/tireProfile';
import type { ConstructionPart } from '@/core/types';

const RIM_RADIUS = 20;
const HUB_RADIUS = 12;
const VIEWBOX = '-56 -56 112 112';

export interface BuildTileProps {
  /** Layer ids present at this step, in build order. */
  applied: string[];
  parts: ConstructionPart[];
  /** Renders the finished green tire instead of the drum build. */
  green?: boolean;
  active?: boolean;
}

/** Front view of the drum with the layers applied so far. */
export function BuildTile({ applied, parts, green = false, active = false }: BuildTileProps) {
  const colorOf = (id: string) => parts.find((part) => part.id === id)?.color ?? CANVAS_MUTED;

  return (
    <svg viewBox={VIEWBOX} className="h-full w-full" aria-hidden>
      <circle r={48} fill={active ? BRAND_50 : 'transparent'} />
      <circle r={RIM_RADIUS} fill={RIM_FILL} stroke={INK_300} strokeWidth={1.2} />
      <circle r={HUB_RADIUS} fill={CANVAS_SURFACE} stroke={INK_300} strokeWidth={1.2} />

      {applied.map((id, index) => {
        const radii = BUILD_RADII[id];
        if (!radii) return null;
        const width = radii.outer - radii.inner;
        return (
          <motion.circle
            key={id}
            r={(radii.inner + radii.outer) / 2}
            fill="none"
            stroke={green ? GREEN_TIRE : colorOf(id)}
            strokeWidth={width}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: MOTION_BASE, ease: MOTION_EASE, delay: index * 0.05 }}
            transform="rotate(-90)"
          />
        );
      })}

      {green ? (
        <circle r={45} fill="none" stroke={GREEN_TIRE} strokeWidth={2} opacity={0.5} />
      ) : null}
    </svg>
  );
}
