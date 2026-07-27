import {
  ArrowPathIcon,
  ForwardIcon,
  PauseIcon,
  PlayIcon,
  PresentationChartLineIcon,
  Squares2X2Icon,
} from '@/components/ui/icons';
import { useEffect, useState } from 'react';
import inplanLogo from '@/assets/brand/inplan-logo.png';
import { ActionButton } from '@/components/ui/ActionButton';
import { Segmented } from '@/components/ui/Segmented';
import { SPEED_OPTIONS, type SpeedOption } from '@/core/constants';
import { formatShiftClock } from '@/core/scenario';
import type { VariantId } from '@/core/types';
import { useSimulationControls, useSimulationKpi, type DemoMode } from '@/state/SimulationContext';
import { LivePulse } from './LivePulse';

const SPEED_OPTIONS_UI = SPEED_OPTIONS.map((speed) => ({ value: speed, label: `${speed}x` }));

/** Short labels for the product-variant switcher (§4.5). */
const VARIANT_LABELS: Record<VariantId, string> = {
  summer: 'Лето',
  winter: 'Зима',
  'winter-studded': 'Шипы',
};

/** Tracks the viewport width so no control is ever hidden outright. */
function useCompactHeader(): boolean {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const update = () => setCompact(window.innerWidth < COMPACT_BREAKPOINT);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return compact;
}

const MODE_OPTIONS: Array<{ value: DemoMode; label: string }> = [
  { value: 'live', label: 'Онлайн' },
  { value: 'compare', label: 'Сравнение' },
  { value: 'presentation', label: 'Презентация' },
  { value: 'anatomy', label: 'Анатомия' },
  { value: 'materials', label: 'Материалы' },
];

/** Below this width the header falls back to icon-only controls. */
const COMPACT_BREAKPOINT = 1280;

/** Isolated so the clock ticking does not re-render the whole header. */
function ShiftClock() {
  const { time } = useSimulationKpi();
  return (
    <span className="numeric px-1 text-[13px] font-bold text-ink-900">{formatShiftClock(time)}</span>
  );
}

export function Header() {
  const compact = useCompactHeader();
  const {
    scenario,
    variantId,
    variants,
    setVariant,
    playing,
    speed,
    setSpeed,
    play,
    pause,
    step,
    reset,
    demoMode,
    setDemoMode,
    tocMode,
    setTocMode,
    apsMode,
    setApsMode,
  } = useSimulationControls();

  const activeVariant = variants.find((variant) => variant.id === variantId);
  const variantOptions = variants.map((variant) => ({
    value: variant.id,
    label: VARIANT_LABELS[variant.id],
  }));
  // The product switcher is hidden during a presentation so it can't derail the script.
  const showVariantSwitch = demoMode !== 'presentation';

  return (
    <header className="flex shrink-0 items-center justify-between gap-6 border-b border-line bg-surface px-6 py-3">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-10 items-center rounded bg-ink-900 px-3">
          <img src={inplanLogo} alt="in.plan" className="h-3.5 w-auto" />
        </div>
        <div className="min-w-0">
          <p className="label-caps">Демо производства</p>
          <h1 className="truncate text-[17px] font-bold leading-tight text-ink-900">
            {scenario.name}
          </h1>
        </div>
        <span className="hidden h-8 w-px bg-line lg:block" />
        <div className="hidden min-w-0 items-center gap-2 lg:flex">
          <LivePulse running={playing} />
          <span className="truncate text-[12px] font-semibold text-ink-500">{scenario.product}</span>
          {activeVariant?.badge ? (
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
              style={{ color: activeVariant.tokenColor, backgroundColor: `${activeVariant.tokenColor}1F` }}
            >
              {activeVariant.badge}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {showVariantSwitch ? (
          <Segmented
            ariaLabel="Вариант продукта"
            options={variantOptions}
            value={variantId}
            onChange={setVariant}
            compact={compact}
          />
        ) : null}

        <div className="flex items-center gap-2">
          <ActionButton
            label="Показать ТОС"
            icon={Squares2X2Icon}
            variant={tocMode ? 'danger' : 'ghost'}
            active={tocMode}
            hideLabel={compact}
            onPress={() => setTocMode(!tocMode)}
          />
          <ActionButton
            label="Показать APS"
            icon={PresentationChartLineIcon}
            variant={apsMode ? 'primary' : 'ghost'}
            active={apsMode}
            hideLabel={compact}
            onPress={() => setApsMode(!apsMode)}
          />
        </div>

        <Segmented
          ariaLabel="Режим демонстрации"
          options={MODE_OPTIONS}
          value={demoMode}
          onChange={setDemoMode}
        />

        <div className="flex items-center gap-2 rounded-xl border border-line bg-surface-sunken px-2 py-1.5">
          <ShiftClock />
          <Segmented
            ariaLabel="Скорость воспроизведения"
            options={SPEED_OPTIONS_UI}
            value={speed}
            onChange={(value) => setSpeed(value as SpeedOption)}
            compact
          />
        </div>

        <div className="flex items-center gap-1.5">
          {playing ? (
            <ActionButton label="Пауза" icon={PauseIcon} variant="solid" onPress={pause} />
          ) : (
            <ActionButton label="Пуск" icon={PlayIcon} variant="primary" onPress={play} />
          )}
          <ActionButton label="Шаг" icon={ForwardIcon} onPress={step} />
          <ActionButton label="Сброс" icon={ArrowPathIcon} onPress={reset} />
        </div>
      </div>
    </header>
  );
}
