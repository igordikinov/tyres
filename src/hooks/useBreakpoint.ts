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
 * tier is derived from window.innerWidth when available, falling back to 'desktop'
 * (keeps the jsdom smoke render safe). Resize listener corrects it after mount.
 */
export function useBreakpoint(): LayoutTier {
  const [tier, setTier] = useState<LayoutTier>(() =>
    typeof window === 'undefined' ? 'desktop' : tierForWidth(window.innerWidth),
  );
  useEffect(() => {
    const update = () => setTier(tierForWidth(window.innerWidth));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return tier;
}
