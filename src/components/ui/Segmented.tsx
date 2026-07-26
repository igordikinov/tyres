import { motion } from 'framer-motion';
import { MOTION_BASE, MOTION_EASE } from '@/core/constants';
import { Pressable } from './Pressable';

export interface SegmentedOption<T extends string | number> {
  value: T;
  label: string;
}

export interface SegmentedProps<T extends string | number> {
  options: ReadonlyArray<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  compact?: boolean;
}

/** Custom segmented control with a shared sliding indicator. */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  ariaLabel,
  compact = false,
}: SegmentedProps<T>) {
  const groupId = `seg-${ariaLabel.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`inline-flex items-center rounded-xl border border-line bg-surface-sunken p-1 ${
        compact ? 'gap-0.5' : 'gap-1'
      }`}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            role="radio"
            pressed={selected}
            tabIndex={selected ? 0 : -1}
            label={option.label}
            onPress={() => onChange(option.value)}
            className={`relative ${compact ? 'h-7 px-2.5 text-[11px]' : 'h-8 px-3 text-[12px]'} font-semibold`}
          >
            {selected ? (
              <motion.span
                layoutId={groupId}
                className="absolute inset-0 rounded-lg bg-surface shadow-card"
                transition={{ duration: MOTION_BASE, ease: MOTION_EASE }}
              />
            ) : null}
            <span className={`relative z-10 ${selected ? 'text-ink-900' : 'text-ink-500'}`}>
              {option.label}
            </span>
          </Pressable>
        );
      })}
    </div>
  );
}
