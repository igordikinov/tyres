import { useEffect, useRef } from 'react';

/** Frame deltas above this are treated as a clock glitch and discarded. */
const MAX_FRAME_SECONDS = 1;

/**
 * Runs `callback` on every animation frame with the elapsed real seconds.
 * The callback is kept in a ref so the loop is never torn down on re-render.
 */
export function useAnimationFrame(callback: (deltaSeconds: number, now: number) => void): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    let handle = 0;
    let previous = performance.now();

    // The timestamp passed to rAF does not always share an origin with
    // performance.now(), so the first delta is clamped rather than trusted.
    const frame = (now: number) => {
      const raw = (now - previous) / 1000;
      previous = now;
      const deltaSeconds = raw > 0 && raw < MAX_FRAME_SECONDS ? raw : 0;
      callbackRef.current(deltaSeconds, now);
      handle = requestAnimationFrame(frame);
    };

    handle = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(handle);
  }, []);
}
