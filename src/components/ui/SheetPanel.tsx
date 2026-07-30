import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { useEffect, useRef, type ReactNode } from 'react';
import { Pressable } from '@/components/ui/Pressable';
import { XMarkIcon } from '@/components/ui/icons';
import { MOTION_BASE, MOTION_EASE } from '@/core/constants';

export interface SheetPanelProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Bottom sheet used on <1024px to surface the side panels on demand (§6.2).
 * Custom primitive — no native <dialog>/<button>. ARIA dialog with focus trap,
 * focus return, Esc-to-close and swipe-down-to-dismiss.
 */
export function SheetPanel({ open, title, onClose, children }: SheetPanelProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<Element | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const sheet = sheetRef.current;
    returnFocusRef.current = document.activeElement;

    const focusables = (): HTMLElement[] =>
      sheet
        ? Array.from(
            sheet.querySelectorAll<HTMLElement>(
              '[tabindex]:not([tabindex="-1"]), [role="slider"]:not([tabindex="-1"])',
            ),
          )
        : [];

    // Start on the first real control; fall back to the (programmatically
    // focusable) container when the sheet has no focusable descendants.
    (focusables()[0] ?? sheet)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !sheet) return;
      const items = focusables();
      if (items.length === 0) {
        event.preventDefault();
        sheet.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      // Container itself (tabIndex -1) or focus that has left the sheet:
      // pull it back to an edge so Tab/Shift+Tab can never escape the modal.
      if (active === sheet || !sheet.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      const target = returnFocusRef.current;
      if (target instanceof HTMLElement && document.contains(target)) target.focus();
    };
  }, [open]);

  const onDragEnd = (_event: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 500) onClose();
  };

  return (
    <AnimatePresence>
      {open ? (
        <div key="sheet" className="fixed inset-0 z-40 flex flex-col justify-end lg:hidden">
          <Pressable
            label="Закрыть панель"
            onPress={onClose}
            tabIndex={-1}
            className="absolute inset-0 h-full w-full bg-ink-900/40"
          >
            <span className="sr-only">Закрыть панель</span>
          </Pressable>
          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            className="surface-card relative z-10 flex max-h-[85dvh] flex-col rounded-t-2xl outline-none"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: MOTION_BASE, ease: MOTION_EASE }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={onDragEnd}
          >
            <header className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 className="text-[13px] font-semibold text-ink-900">{title}</h2>
              <Pressable label="Закрыть" onPress={onClose} className="h-11 w-11 text-ink-500">
                <XMarkIcon className="h-5 w-5" />
              </Pressable>
            </header>
            <div className="scroll-thin min-h-0 flex-1 overflow-y-auto p-3">{children}</div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
