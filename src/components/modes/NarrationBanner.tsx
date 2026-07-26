import { AnimatePresence, motion } from 'framer-motion';
import { MOTION_EASE, MOTION_SLOW } from '@/core/constants';

export interface NarrationBannerProps {
  eyebrow: string;
  text: string;
  emphasis?: boolean;
}

/** Caption strip above the canvas that follows the material flow. */
export function NarrationBanner({ eyebrow, text, emphasis = false }: NarrationBannerProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center px-6 pt-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={text}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: MOTION_SLOW, ease: MOTION_EASE }}
          className={`flex max-w-3xl items-center gap-3 rounded-full border px-4 py-2 shadow-card backdrop-blur ${
            emphasis ? 'border-accent/25 bg-accent-soft/80' : 'border-line bg-white/85'
          }`}
        >
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-label ${
              emphasis ? 'bg-accent text-white' : 'bg-brand-50 text-brand-600'
            }`}
          >
            {eyebrow}
          </span>
          <span
            className={`truncate text-[13px] font-semibold ${emphasis ? 'text-accent' : 'text-ink-700'}`}
          >
            {text}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
