import { motion } from 'framer-motion';
import { CANVAS_LINE, CANVAS_SURFACE, MOTION_BASE, TOC_DIMMED_OPACITY } from '@/core/constants';
import type { LinkGeometry } from '@/core/layout';

export interface FlowLinkProps {
  link: LinkGeometry;
  active: boolean;
  accent: string;
  dimmed: boolean;
}

/** Route between two stations with a travelling flow indicator. */
export function FlowLink({ link, active, accent, dimmed }: FlowLinkProps) {
  return (
    <motion.g
      initial={false}
      animate={{ opacity: dimmed ? TOC_DIMMED_OPACITY : 1 }}
      transition={{ duration: MOTION_BASE }}
    >
      <path d={link.d} fill="none" stroke={CANVAS_LINE} strokeWidth={6} strokeLinecap="round" />
      <path d={link.d} fill="none" stroke={CANVAS_SURFACE} strokeWidth={3.4} strokeLinecap="round" />
      <motion.path
        d={link.d}
        fill="none"
        stroke={accent}
        strokeWidth={3.4}
        strokeLinecap="round"
        strokeDasharray="2 14"
        initial={false}
        animate={
          active
            ? { strokeDashoffset: [0, -32], opacity: 1 }
            : { strokeDashoffset: 0, opacity: 0.25 }
        }
        transition={active ? { duration: 1.4, ease: 'linear', repeat: Infinity } : { duration: 0.3 }}
      />
    </motion.g>
  );
}
