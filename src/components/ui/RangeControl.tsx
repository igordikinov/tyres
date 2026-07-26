import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';

export interface RangeControlProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  ariaLabel: string;
  ariaValueText?: string;
  onScrubStart?: () => void;
  onScrubEnd?: () => void;
  tone?: 'brand' | 'accent' | 'ink';
  size?: 'sm' | 'lg';
  /** Optional normalised marker positions drawn on the track. */
  markers?: number[];
}

const TONE_FILL: Record<string, string> = {
  brand: 'bg-brand-500',
  accent: 'bg-accent',
  ink: 'bg-ink-900',
};

const TONE_RING: Record<string, string> = {
  brand: 'border-brand-500',
  accent: 'border-accent',
  ink: 'border-ink-900',
};

const COARSE_STEP_MULTIPLIER = 10;
const PAGE_FRACTION = 0.1;

function quantise(raw: number, min: number, max: number, step: number): number {
  const clamped = Math.min(Math.max(raw, min), max);
  const steps = Math.round((clamped - min) / step);
  return Number((min + steps * step).toFixed(4));
}

/** Custom range control — no native <input type="range"> is used. */
export function RangeControl({
  value,
  min,
  max,
  step,
  onChange,
  ariaLabel,
  ariaValueText,
  onScrubStart,
  onScrubEnd,
  tone = 'brand',
  size = 'sm',
  markers,
}: RangeControlProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef(0);
  const pendingRef = useRef<number | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const ratio = max > min ? (value - min) / (max - min) : 0;

  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  /** Scrubbing can trigger an expensive replay, so coalesce to one per frame. */
  const scheduleChange = useCallback((next: number) => {
    pendingRef.current = next;
    if (frameRef.current !== 0) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0;
      const queued = pendingRef.current;
      pendingRef.current = null;
      if (queued !== null) onChangeRef.current(queued);
    });
  }, []);

  const emitFromClientX = useCallback(
    (clientX: number, immediate: boolean) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      if (rect.width === 0) return;
      const next = quantise(min + ((clientX - rect.left) / rect.width) * (max - min), min, max, step);
      if (immediate) onChangeRef.current(next);
      else scheduleChange(next);
    },
    [max, min, scheduleChange, step],
  );

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    onScrubStart?.();
    emitFromClientX(event.clientX, true);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    emitFromClientX(event.clientX, false);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    onScrubEnd?.();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const page = Math.max((max - min) * PAGE_FRACTION, step);
    const deltas: Record<string, number> = {
      ArrowLeft: -step,
      ArrowDown: -step,
      ArrowRight: step,
      ArrowUp: step,
      PageDown: -page,
      PageUp: page,
    };
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      onChangeRef.current(event.key === 'Home' ? min : max);
      return;
    }
    const delta = deltas[event.key];
    if (delta === undefined) return;
    event.preventDefault();
    const scale = event.shiftKey && Math.abs(delta) === step ? COARSE_STEP_MULTIPLIER : 1;
    onChangeRef.current(quantise(value + delta * scale, min, max, step));
  };

  const trackHeight = size === 'lg' ? 'h-2.5' : 'h-1.5';
  const knobSize = size === 'lg' ? 'h-5 w-5' : 'h-3.5 w-3.5';

  return (
    <div
      ref={trackRef}
      role="slider"
      aria-label={ariaLabel}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={ariaValueText}
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
      className={`group relative flex ${size === 'lg' ? 'h-7' : 'h-5'} w-full cursor-pointer items-center`}
    >
      <div className={`relative w-full ${trackHeight} rounded-full bg-surface-sunken shadow-inset`}>
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${TONE_FILL[tone]}`}
          style={{ width: `${ratio * 100}%` }}
        />
        {markers?.map((marker) => (
          <span
            key={marker}
            className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-ink-300"
            style={{ left: `${marker * 100}%` }}
          />
        ))}
      </div>
      <div
        className={`pointer-events-none absolute ${knobSize} -translate-x-1/2 rounded-full border-2 bg-white shadow-card transition-transform group-hover:scale-110 ${TONE_RING[tone]}`}
        style={{ left: `${ratio * 100}%` }}
      />
    </div>
  );
}
