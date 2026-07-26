import * as lottieModule from 'lottie-react';
import { useEffect, useRef, type ComponentType, type MutableRefObject } from 'react';
import pulseAnimation from '@/assets/animations/live-pulse.json';
import { SafeBoundary } from '@/components/ui/SafeBoundary';

interface LottieHandle {
  play: () => void;
  pause: () => void;
}

type LottieComponent = ComponentType<{
  animationData: unknown;
  loop?: boolean;
  autoplay?: boolean;
  style?: Record<string, string | number>;
  lottieRef?: MutableRefObject<LottieHandle | null>;
}>;

/** lottie-react ships as CommonJS; unwrap it the same way in every bundler. */
function resolveComponent(candidate: unknown): LottieComponent | null {
  let current = candidate as { default?: unknown } | undefined;
  for (let depth = 0; depth < 3 && current; depth += 1) {
    if (typeof current === 'function') return current as LottieComponent;
    current = current.default as { default?: unknown } | undefined;
  }
  return null;
}

const Lottie = resolveComponent(lottieModule);

export interface LivePulseProps {
  running: boolean;
}

/** Lottie status beacon: animated while the simulation clock advances. */
export function LivePulse({ running }: LivePulseProps) {
  const handleRef = useRef<LottieHandle | null>(null);
  const fallback = <span className="h-2 w-2 rounded-full bg-brand-500" />;

  // lottie-react only reads `autoplay` when the animation loads.
  useEffect(() => {
    const handle = handleRef.current;
    if (!handle) return;
    if (running) handle.play();
    else handle.pause();
  }, [running]);

  return (
    <span className="relative inline-flex h-4 w-4 items-center justify-center">
      <SafeBoundary fallback={fallback}>
        {Lottie ? (
          <Lottie
            animationData={pulseAnimation}
            loop
            autoplay={running}
            lottieRef={handleRef}
            style={{ width: 16, height: 16 }}
          />
        ) : (
          fallback
        )}
      </SafeBoundary>
    </span>
  );
}
