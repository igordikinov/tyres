import { useCallback, useRef } from 'react';
import { RangeControl } from '@/components/ui/RangeControl';
import { HORIZON_MINUTES, TICK_MINUTES, TIMELINE_MARKER_COUNT } from '@/core/constants';
import { formatDuration, formatNumber, formatShiftClock } from '@/core/scenario';
import {
  useSimulationControls,
  useSimulationFrame,
  useSimulationKpi,
} from '@/state/SimulationContext';

const MARKERS = Array.from(
  { length: TIMELINE_MARKER_COUNT + 1 },
  (_, index) => index / TIMELINE_MARKER_COUNT,
);

export function TimelineBar() {
  const { seek, playing, pause, play } = useSimulationControls();
  const { snapshot } = useSimulationFrame();
  const { kpi } = useSimulationKpi();
  const resumeRef = useRef(false);

  const handleScrubStart = useCallback(() => {
    resumeRef.current = playing;
    pause();
  }, [pause, playing]);

  const handleScrubEnd = useCallback(() => {
    if (resumeRef.current) play();
    resumeRef.current = false;
  }, [play]);

  const progress = Math.min(snapshot.time / HORIZON_MINUTES, 1);

  return (
    <div className="flex shrink-0 items-center gap-5 border-t border-line bg-surface px-6 py-3">
      <div className="flex shrink-0 flex-col">
        <span className="label-caps">Часы смены</span>
        <span className="numeric text-[15px] font-bold text-ink-900">
          {formatShiftClock(snapshot.time)}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[10px] font-semibold text-ink-400">
            прошло {formatDuration(snapshot.time)}
          </span>
          <span className="text-[10px] font-semibold text-ink-400">
            {formatNumber(progress * 100, 0)}% смены
          </span>
        </div>
        <RangeControl
          ariaLabel="Таймлайн симуляции"
          ariaValueText={`${formatShiftClock(snapshot.time)}, ${formatDuration(snapshot.time)} от начала смены`}
          value={snapshot.time}
          min={0}
          max={HORIZON_MINUTES}
          step={TICK_MINUTES}
          size="lg"
          tone="ink"
          markers={MARKERS}
          onChange={seek}
          onScrubStart={handleScrubStart}
          onScrubEnd={handleScrubEnd}
        />
      </div>

      <div className="flex shrink-0 items-center gap-6">
        {[
          { label: 'Готово', value: formatNumber(kpi.completed) },
          { label: 'НЗП', value: formatNumber(kpi.wip) },
          { label: 'Очередь', value: formatNumber(kpi.queue) },
        ].map((item) => (
          <div key={item.label} className="flex flex-col items-end">
            <span className="label-caps">{item.label}</span>
            <span className="numeric text-[15px] font-bold text-ink-900">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
