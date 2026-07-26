import { motion } from 'framer-motion';
import { MOTION_BASE, MOTION_EASE } from '@/core/constants';

export interface KpiCardProps {
  label: string;
  value: string;
  unit?: string;
  /** 0..1 progress rendered as a bar under the value. */
  ratio?: number;
  tone?: 'brand' | 'accent' | 'ink' | 'violet';
  caption?: string;
  /** Spans both columns of the KPI grid. */
  wide?: boolean;
}

const TONE_BAR: Record<string, string> = {
  brand: 'bg-brand-500',
  accent: 'bg-accent',
  ink: 'bg-ink-900',
  violet: 'bg-state-starved',
};

const TONE_TEXT: Record<string, string> = {
  brand: 'text-ink-900',
  accent: 'text-accent',
  ink: 'text-ink-900',
  violet: 'text-state-starved',
};

export function KpiCard({
  label,
  value,
  unit,
  ratio,
  tone = 'brand',
  caption,
  wide = false,
}: KpiCardProps) {
  return (
    <div
      className={`rounded-xl border border-line bg-surface px-3 py-2.5 ${wide ? 'col-span-2' : ''}`}
    >
      <p className="label-caps">{label}</p>
      <div className="mt-1 flex items-baseline justify-between gap-1">
        <span
          className={`numeric truncate text-[22px] font-bold leading-none ${TONE_TEXT[tone]} ${
            wide ? 'font-sans' : ''
          }`}
        >
          {value}
        </span>
        {unit ? <span className="shrink-0 text-[11px] font-medium text-ink-400">{unit}</span> : null}
      </div>
      {ratio !== undefined ? (
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-surface-sunken">
          <motion.div
            className={`h-full rounded-full ${TONE_BAR[tone]}`}
            initial={false}
            animate={{ width: `${Math.min(Math.max(ratio, 0), 1) * 100}%` }}
            transition={{ duration: MOTION_BASE, ease: MOTION_EASE }}
          />
        </div>
      ) : null}
      {caption ? <p className="mt-1.5 truncate text-[10px] text-ink-400">{caption}</p> : null}
    </div>
  );
}
