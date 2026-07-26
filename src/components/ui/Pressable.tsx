import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { MOTION_FAST } from '@/core/constants';

export interface PressableProps {
  onPress: () => void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  label: string;
  pressed?: boolean;
  role?: 'button' | 'switch' | 'tab' | 'radio';
  title?: string;
  /** Roving tab index for radio groups. */
  tabIndex?: number;
}

/**
 * The single interaction primitive of the application.
 * Standard HTML buttons are deliberately not used anywhere.
 */
export function Pressable({
  onPress,
  children,
  className = '',
  disabled = false,
  label,
  pressed,
  role = 'button',
  title,
  tabIndex,
}: PressableProps) {
  const activate = () => {
    if (!disabled) onPress();
  };

  return (
    <motion.div
      role={role}
      aria-label={label}
      aria-disabled={disabled || undefined}
      aria-pressed={role === 'button' && pressed !== undefined ? pressed : undefined}
      aria-checked={role === 'switch' || role === 'radio' ? Boolean(pressed) : undefined}
      aria-selected={role === 'tab' ? Boolean(pressed) : undefined}
      title={title ?? label}
      tabIndex={disabled || tabIndex !== undefined ? (tabIndex ?? -1) : 0}
      onClick={activate}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        activate();
      }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ duration: MOTION_FAST }}
      className={`inline-flex select-none items-center justify-center ${
        disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
      } ${className}`}
    >
      {children}
    </motion.div>
  );
}
