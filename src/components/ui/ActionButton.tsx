import type { ComponentType, SVGProps } from 'react';
import { Pressable } from './Pressable';

export type ActionVariant = 'primary' | 'solid' | 'ghost' | 'quiet' | 'danger';
export type ActionSize = 'sm' | 'md';

const VARIANTS: Record<ActionVariant, string> = {
  primary:
    'bg-brand-500 text-white border border-brand-600 shadow-card hover:bg-brand-600 transition-colors',
  solid:
    'bg-ink-900 text-white border border-ink-900 shadow-card hover:bg-ink-700 transition-colors',
  ghost:
    'bg-surface text-ink-700 border border-line hover:border-line-strong hover:text-ink-900 transition-colors',
  quiet: 'bg-transparent text-ink-500 border border-transparent hover:text-ink-900 transition-colors',
  danger: 'bg-accent-soft text-accent border border-accent/20 hover:bg-accent/15 transition-colors',
};

const SIZES: Record<ActionSize, string> = {
  sm: 'h-8 gap-1.5 rounded px-2.5 text-[11px]',
  md: 'h-10 gap-2 rounded px-3.5 text-[12px]',
};

const ICON_SIZES: Record<ActionSize, string> = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
};

export interface ActionButtonProps {
  label: string;
  onPress: () => void;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  variant?: ActionVariant;
  size?: ActionSize;
  disabled?: boolean;
  active?: boolean;
  hideLabel?: boolean;
  className?: string;
}

export function ActionButton({
  label,
  onPress,
  icon: Icon,
  variant = 'ghost',
  size = 'md',
  disabled,
  active,
  hideLabel = false,
  className = '',
}: ActionButtonProps) {
  return (
    <Pressable
      label={label}
      onPress={onPress}
      disabled={disabled}
      pressed={active}
      className={`${VARIANTS[variant]} ${SIZES[size]} font-semibold tracking-tight ${
        hideLabel ? 'aspect-square px-0' : ''
      } ${className}`}
    >
      {Icon ? <Icon className={ICON_SIZES[size]} aria-hidden /> : null}
      {hideLabel ? null : <span>{label}</span>}
    </Pressable>
  );
}
