import { motion } from 'framer-motion';
import { MOTION_BASE, MOTION_EASE } from '@/core/constants';
import type { PresentationChapter } from '@/core/types';

export interface ChapterRailProps {
  index: number;
  chapters: PresentationChapter[];
}

/** Progress rail of the unattended presentation. */
export function ChapterRail({ index, chapters }: ChapterRailProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center px-6">
      <div className="flex max-w-4xl items-center gap-1.5 rounded-full border border-line bg-white/90 px-3 py-2 shadow-card backdrop-blur">
        {chapters.map((chapter, position) => {
          const state = position < index ? 'done' : position === index ? 'active' : 'todo';
          return (
            <motion.span
              key={chapter.title}
              initial={false}
              animate={{
                width: state === 'active' ? 'auto' : 10,
                opacity: state === 'todo' ? 0.35 : 1,
              }}
              transition={{ duration: MOTION_BASE, ease: MOTION_EASE }}
              className={`flex h-2.5 items-center overflow-hidden whitespace-nowrap rounded-full px-0 ${
                state === 'todo' ? 'bg-ink-300' : 'bg-brand-500'
              }`}
            >
              {state === 'active' ? (
                <span className="px-2 text-[9px] font-bold uppercase tracking-label text-white">
                  {chapter.title}
                </span>
              ) : null}
            </motion.span>
          );
        })}
      </div>
    </div>
  );
}
