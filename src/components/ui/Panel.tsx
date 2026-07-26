import type { ReactNode } from 'react';

export interface PanelProps {
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function Panel({
  title,
  eyebrow,
  action,
  children,
  className = '',
  bodyClassName = '',
}: PanelProps) {
  return (
    <section className={`surface-card flex flex-col overflow-hidden ${className}`}>
      {title || eyebrow || action ? (
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0">
            {eyebrow ? <p className="label-caps">{eyebrow}</p> : null}
            {title ? (
              <h2 className="truncate text-[13px] font-semibold text-ink-900">{title}</h2>
            ) : null}
          </div>
          {action}
        </header>
      ) : null}
      <div className={`min-h-0 flex-1 ${bodyClassName}`}>{children}</div>
    </section>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 pb-2 pt-1">
      <span className="label-caps">{children}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
