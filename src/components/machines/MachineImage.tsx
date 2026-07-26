import { motion } from 'framer-motion';
import { MOTION_BASE, MOTION_EASE } from '@/core/constants';
import type { MachineKind } from '@/core/types';
import { MACHINE_IMAGES } from './machineImages';

/**
 * Local drawing box for the equipment render. Fills the space between the title
 * row (name ends ~y-71) and the subtitle labels (start ~y53): every asset is
 * height-limited by this box, so all machines render at the SAME height and on
 * the SAME floor line, with a comfortable gap above and below and side margins.
 */
const IMG_X = -92;
const IMG_Y = -66;
const IMG_W = 184;
const IMG_H = 112;
/** Floor line the render is grounded on — kept above the subtitle at y=66. */
const IMG_FLOOR = IMG_Y + IMG_H;

export interface MachineImageProps {
  kind: MachineKind;
  active: boolean;
  accent: string;
  /** Desaturated while TOC mode dims everything but the constraint. */
  greyed: boolean;
}

/** Realistic equipment photo with an accent activity glow and TOC greyscale. */
export function MachineImage({ kind, active, accent, greyed }: MachineImageProps) {
  const href = MACHINE_IMAGES[kind];
  if (!href) return null;
  return (
    <g>
      <motion.ellipse
        cx={0}
        cy={IMG_FLOOR - 3}
        rx={IMG_W * 0.32}
        ry={10}
        fill={accent}
        initial={false}
        animate={{ opacity: active && !greyed ? 0.22 : 0 }}
        transition={{ duration: MOTION_BASE, ease: MOTION_EASE }}
      />
      <image
        href={href}
        x={IMG_X}
        y={IMG_Y}
        width={IMG_W}
        height={IMG_H}
        preserveAspectRatio="xMidYMax meet"
        style={{ filter: greyed ? 'grayscale(1)' : 'none', transition: 'filter 0.3s' }}
      />
    </g>
  );
}
