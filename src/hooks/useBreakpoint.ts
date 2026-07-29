import { useEffect, useState } from 'react';
import { BREAKPOINTS } from '@/core/constants';

export type LayoutTier = 'phone' | 'tablet' | 'desktop';

/** Maps a viewport width to a layout tier (§6.2). */
function tierForWidth(width: number): LayoutTier {
  if (width < BREAKPOINTS.sm) return 'phone';
  if (width < BREAKPOINTS.lg) return 'tablet';
  return 'desktop';
}

/**
 * Reports the current layout tier and updates on resize.
 * Mirrors the resize-listener pattern already used by the header; the initial
 * value is read inside the effect so module evaluation never touches `window`
 * (keeps the jsdom smoke render safe). Defaults to 'desktop' before mount so the
 * server/first paint matches the ≥1024 layout.
 */
export function useBreakpoint(): LayoutTier {
  const [tier, setTier] = useState<LayoutTier>('desktop');
  useEffect(() => {
    const update = () => setTier(tierForWidth(window.innerWidth));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return tier;
}
