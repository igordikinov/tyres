import { motion } from 'framer-motion';
import { MOTION_BASE, MOTION_EASE } from '@/core/constants';
import { Pressable } from './Pressable';

export interface ToggleSwitchProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  accent?: 'brand' | 'accent';
}

export function ToggleSwitch({
  label,
  description,
  value,
  onChange,
  accent = 'brand',
}: ToggleSwitchProps) {
  const trackOn = accent === 'accent' ? 'bg-accent' : 'bg-brand-500';

  return (
    <Pressable
      role="switch"
      pressed={value}
      label={label}
      onPress={() => onChange(!value)}
      className="w-full justify-between gap-4 rounded-xl border border-line bg-surface px-3 py-2.5 hover:border-line-strong transition-colors"
    >
      <span className="flex min-w-0 flex-col items-start text-left">
        <span className="text-[12px] font-semibold text-ink-900">{label}</span>
        {description ? (
          <span className="truncate text-[11px] leading-snug text-ink-400">{description}</span>
        ) : null}
      </span>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          value ? trackOn : 'bg-ink-300'
        }`}
      >
        <motion.span
          className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-card"
          initial={false}
          animate={{ left: value ? 18 : 2 }}
          transition={{ duration: MOTION_BASE, ease: MOTION_EASE }}
        />
      </span>
    </Pressable>
  );
}
