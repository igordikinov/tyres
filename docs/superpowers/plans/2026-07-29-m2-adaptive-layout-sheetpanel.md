# Ф3·M2 — Adaptive layout + SheetPanel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the KPI / Parameters / Throughput panels reachable on phones and tablets by turning `App.tsx` into a responsive shell with a new bottom-sheet primitive, while leaving the ≥1024px desktop layout pixel-identical.

**Architecture:** Add layout breakpoints as constants + a `useBreakpoint` hook. Build `ui/SheetPanel.tsx` (framer-motion bottom sheet, ARIA `dialog`, focus trap/return, swipe-down dismiss). Restructure `Workspace` in `App.tsx` to branch on breakpoint: ≥1024 keeps today's three-column layout unchanged; <1024 renders a single column plus a bottom toolbar «KPI / Параметры / График» that opens each existing panel inside a `SheetPanel`.

**Tech Stack:** React 18 + TypeScript (strict), framer-motion 11.11.17 (already a dependency), Tailwind. No test runner — the automated gate is `npm run check` = `tsc --noEmit` + `node scripts/run-verify.mjs` (model invariants) + `node scripts/run-smoke.mjs` (jsdom full-app render in `scripts/smoke-render.tsx`).

## Global Constraints

Copied verbatim from spec §6.3 and the design doc §9 — every task must honor all of these:

- **No new dependencies.** framer-motion is already present; use it. Gestures use pointer events.
- **Custom primitives only — no native inputs.** No `<button>`, `<input>`, `<dialog>`. Build on the existing `Pressable`. The smoke test asserts `querySelectorAll('button').length === 0` and `input` length `=== 0`.
- **Every source file < 300 lines.**
- **No raster assets introduced.**
- **Engine determinism untouched.** M2 changes layout and sheet-open "camera" state only; `seek()` and the `verify` invariants must stay green (§6.4.4).
- **Breakpoints live in `core/constants.ts`** — no magic width numbers in markup (§6.2).
- **≥1024px desktop layout stays pixel-identical** (§6.4.2) — the existing smoke assertions (KPI cards, sliders, controls inline) are the regression guard and must remain green.

## File Structure

| File | Responsibility |
| --- | --- |
| `src/core/constants.ts` (modify) | Add `BREAKPOINTS` layout thresholds. |
| `src/hooks/useBreakpoint.ts` (create) | Resize-listener hook reporting the current layout tier. |
| `src/components/ui/SheetPanel.tsx` (create) | Bottom-sheet dialog primitive (motion + Pressable, ARIA, swipe-dismiss). |
| `src/App.tsx` (modify) | `Workspace` branches on tier: desktop unchanged; mobile column + toolbar + sheet. |
| `scripts/smoke-render.tsx` (modify) | Add a mobile-width phase asserting panels are reachable via sheets. |

Existing panels (`KpiSidebar`, `ParameterPanel`, `ThroughputPanel`), `Header`, and `TimelineBar` are reused **unchanged**.

---

## Task 1: Breakpoint constants + `useBreakpoint` hook

**Files:**
- Modify: `src/core/constants.ts` (append near the other layout constants)
- Create: `src/hooks/useBreakpoint.ts`

**Interfaces:**
- Produces: `BREAKPOINTS = { sm: 640, lg: 1024 } as const` in `core/constants.ts`.
- Produces: `type LayoutTier = 'phone' | 'tablet' | 'desktop'` and `function useBreakpoint(): LayoutTier` from `hooks/useBreakpoint.ts`. Rule: `width < 640 → 'phone'`, `640 ≤ width < 1024 → 'tablet'`, `width ≥ 1024 → 'desktop'`.
- Consumes: nothing.

**Test vehicle note:** There is no unit-test runner. This module is pure and is exercised end-to-end by the Task 4 smoke phase; its per-task gate is `npm run typecheck`. The hook mirrors the existing `useCompactHeader` pattern in `src/components/layout/Header.tsx` (initial `update()` in `useEffect`, `resize` listener, cleanup) so its behavior matches a proven pattern. The lazy initializer must not read `window` at module-eval time (jsdom safety) — it reads `window.innerWidth` inside the initializer function body, which only runs at hook call time when `window` exists.

- [ ] **Step 1: Add `BREAKPOINTS` to `core/constants.ts`**

Append after the existing layout constants block (near `STATION_WIDTH`, around line 63+):

```ts
/**
 * Layout breakpoints for the Фаза 3 responsive shell (§6.2).
 * Thresholds live here so no width literal appears in markup.
 * < sm → phone (single column + sheets); sm..<lg → tablet (single column + sheets);
 * >= lg → the unchanged three-column desktop layout.
 */
export const BREAKPOINTS = { sm: 640, lg: 1024 } as const;
```

- [ ] **Step 2: Create `src/hooks/useBreakpoint.ts`**

```ts
import { useEffect, useState } from 'react';
import { BREAKPOINTS } from '@/core/constants';

export type LayoutTier = 'phone' | 'tablet' | 'desktop';

/** Maps a viewport width to a layout tier (§6.2). */
function tierForWidth(width: number): LayoutTier {
  if (width < BREAKPOINTS.sm) return 'phone';
  if (width < BREAKPOINTS.lg) return 'tablet';
  return 'desktop';
}

/**
 * Reports the current layout tier and updates on resize.
 * Mirrors the resize-listener pattern already used by the header; the initial
 * value is read inside the effect so module evaluation never touches `window`
 * (keeps the jsdom smoke render safe). Defaults to 'desktop' before mount so the
 * server/first paint matches the ≥1024 layout.
 */
export function useBreakpoint(): LayoutTier {
  const [tier, setTier] = useState<LayoutTier>('desktop');
  useEffect(() => {
    const update = () => setTier(tierForWidth(window.innerWidth));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return tier;
}
```

- [ ] **Step 3: Run typecheck to verify it compiles**

Run: `npm run typecheck`
Expected: PASS (exit 0), no errors. (`noUnusedLocals` is satisfied because both symbols are exported.)

- [ ] **Step 4: Run the existing smoke to confirm no regression**

Run: `npm run smoke`
Expected: `SMOKE RENDER PASSED` (the hook is not consumed yet, so the DOM is unchanged).

- [ ] **Step 5: Commit**

```bash
git add src/core/constants.ts src/hooks/useBreakpoint.ts
git commit -m "feat(m2): layout breakpoints + useBreakpoint hook (tyre-2xo.2)"
```

---

## Task 2: `SheetPanel` bottom-sheet primitive

**Files:**
- Create: `src/components/ui/SheetPanel.tsx`

**Interfaces:**
- Consumes: `Pressable` from `@/components/ui/Pressable`; `XMarkIcon` from `@/components/ui/icons`; `MOTION_BASE`, `MOTION_EASE` from `@/core/constants`; `motion`, `AnimatePresence` from `framer-motion`.
- Produces: `interface SheetPanelProps { open: boolean; title: string; onClose: () => void; children: ReactNode }` and `function SheetPanel(props: SheetPanelProps)`.

**Behavior:**
- Renders nothing when `open` is false (wrapped in `AnimatePresence` so exit animates).
- Dimmed backdrop (a `Pressable` with `label="Закрыть панель"` calling `onClose`) + a bottom sheet `motion.div` sliding up from `y: '100%'` to `y: 0`.
- Sheet has `role="dialog"`, `aria-modal="true"`, `aria-label={title}`.
- **Focus trap + return:** on open, record `document.activeElement`, move focus into the sheet; `Tab`/`Shift+Tab` cycle within the sheet; on close, restore focus to the recorded element (guard against it being gone).
- **Esc** closes.
- **Swipe-down dismiss:** `drag="y"`, `dragConstraints={{ top: 0, bottom: 0 }}`, `dragElastic={{ top: 0, bottom: 0.6 }}`; in `onDragEnd`, if `info.offset.y > 120 || info.velocity.y > 500` call `onClose()`.
- A header row shows `title` and a close affordance (`Pressable` wrapping `XMarkIcon`, `label="Закрыть"`).

**Test vehicle note:** Rendered into the real app tree in Task 4; that task's smoke phase asserts the `role="dialog"` opens with panel content and that no native elements appear. Per-task gate here is `npm run typecheck`.

- [ ] **Step 1: Create `src/components/ui/SheetPanel.tsx`**

```tsx
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

  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement;
    sheetRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !sheetRef.current) return;
      const focusable = sheetRef.current.querySelectorAll<HTMLElement>(
        '[tabindex]:not([tabindex="-1"]), [role="slider"]',
      );
      if (focusable.length === 0) {
        event.preventDefault();
        sheetRef.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
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
  }, [open, onClose]);

  const onDragEnd = (_event: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 500) onClose();
  };

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-40 flex flex-col justify-end lg:hidden">
          <Pressable
            label="Закрыть панель"
            onPress={onClose}
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
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS. If `XMarkIcon`'s prop type rejects `className`, confirm the icon signature in `src/components/ui/icons.tsx` (`IconProps` accepts `className`) — it does; pass `className` as shown.

- [ ] **Step 3: Run smoke to confirm no regression**

Run: `npm run smoke`
Expected: `SMOKE RENDER PASSED` (SheetPanel is not yet mounted anywhere).

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/SheetPanel.tsx
git commit -m "feat(m2): SheetPanel bottom-sheet primitive (tyre-2xo.2)"
```

---

## Task 3: Branch `Workspace` on tier — desktop layout unchanged

This task introduces the breakpoint switch and extracts today's three-column layout behind the `desktop` tier **without changing its output**. The existing smoke (KPI cards, sliders, controls all inline) is the regression guard.

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `useBreakpoint` from `@/hooks/useBreakpoint` (Task 1).
- Produces: within `App.tsx`, a `DesktopWorkspace()` local component holding the current three-column `<main>` markup verbatim; `Workspace()` calls `useBreakpoint()` and renders `DesktopWorkspace` for the `desktop` tier.

- [ ] **Step 1: Extract the current three-column body into `DesktopWorkspace`**

In `src/App.tsx`, move the existing `<main>…</main>` block (lines ~85–104, the KPI aside + canvas section + throughput/params aside) into a new local component. Keep the markup **identical**:

```tsx
function DesktopWorkspace({ reference }: { reference: boolean }) {
  return (
    <main className="flex min-h-0 flex-1 gap-3 p-3">
      {reference ? null : (
        <aside className="scroll-thin hidden w-[268px] shrink-0 overflow-y-auto md:block xl:w-[292px]">
          <KpiSidebar />
        </aside>
      )}

      <section className="relative flex min-w-0 flex-1 flex-col">
        <CanvasStage />
      </section>

      {reference ? null : (
        <aside className="hidden w-[268px] shrink-0 flex-col gap-3 lg:flex xl:w-[292px]">
          <ThroughputPanel />
          <div className="min-h-0 flex-1">
            <ParameterPanel />
          </div>
        </aside>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Have `Workspace` select the desktop body via the tier**

Update `Workspace` to call the hook and branch on the tier. The mobile branch renders `null` as a temporary placeholder (Task 4 replaces it with `<MobileWorkspace/>`). Branching now — rather than rendering `DesktopWorkspace` unconditionally — keeps `tier` used so `noUnusedLocals` does not fail the typecheck gate. Since the jsdom smoke runs at width 1024 (`desktop` tier), the desktop layout still renders and the existing assertions stay green. The outer `div` (safe-area padding), `<Header />`, and `<TimelineBar />` stay exactly as they are:

```tsx
function Workspace() {
  const { demoMode } = useSimulationControls();
  const reference = REFERENCE_MODES.has(demoMode);
  const tier = useBreakpoint();

  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden bg-surface-muted"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      <Header />
      {tier === 'desktop' ? <DesktopWorkspace reference={reference} /> : null}
      <TimelineBar />
    </div>
  );
}
```

Add the import at the top of `App.tsx`:

```tsx
import { useBreakpoint } from '@/hooks/useBreakpoint';
```

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: PASS. `tier` is consumed by the `tier === 'desktop'` branch, so `noUnusedLocals` is satisfied.

- [ ] **Step 4: Run the full check — desktop must be pixel-identical**

Run: `npm run check`
Expected: `SMOKE RENDER PASSED` at width 1024 (jsdom default) — KPI cards, sliders, and controls still render inline because 1024 ≥ `BREAKPOINTS.lg`, so the `desktop` tier is active. `verify` and `typecheck` green.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "refactor(m2): branch Workspace on layout tier, desktop unchanged (tyre-2xo.2)"
```

---

## Task 4: Mobile layout — single column + toolbar + sheets

Adds the `<1024px` layout: a single column plus a bottom toolbar «KPI / Параметры / График» whose buttons open the existing panels inside `SheetPanel`. Ends with a new smoke phase (RED → GREEN) proving the panels are reachable at phone width with correct dialog semantics and no native elements.

**Files:**
- Modify: `src/App.tsx`
- Modify: `scripts/smoke-render.tsx`

**Interfaces:**
- Consumes: `useBreakpoint` (Task 1), `SheetPanel` (Task 2), the three panels, `Pressable`, and icons `Squares2X2Icon` (KPI), `BoltIcon` (Parameters), `PresentationChartLineIcon` (График) from `@/components/ui/icons`.
- Produces: within `App.tsx`, a `MobileWorkspace({ reference })` local component and a `PanelKey = 'kpi' | 'params' | 'chart'` union; sheet-open state lives in `MobileWorkspace` via `useState<PanelKey | null>(null)`.

- [ ] **Step 1: Add the failing smoke phase**

In `scripts/smoke-render.tsx`, immediately **before** `root.unmount();` at the end, add a mobile-width phase. It returns the app to live mode, shrinks the viewport, opens the Parameters sheet, and asserts dialog semantics + no native elements:

```tsx
// --- M2: panels reachable on a phone-width viewport (§6.4.1) ---
press('Онлайн');
await wait(150);
Object.defineProperty(dom.window, 'innerWidth', { value: 390, configurable: true, writable: true });
Object.defineProperty(dom.window, 'innerHeight', { value: 844, configurable: true, writable: true });
dom.window.dispatchEvent(new dom.window.Event('resize'));
await wait(150);

expect(
  container.querySelector('[aria-label="Параметры"]') !== null,
  'mobile: the «Параметры» toolbar button is missing at 390px',
);
press('Параметры');
await wait(200);
const paramSheet = container.querySelector('[role="dialog"]');
expect(paramSheet !== null, 'mobile: the parameters sheet did not open as a role="dialog"');
expect(
  container.querySelector('[role="slider"][aria-label="Время смешивания"]') !== null,
  'mobile: the parameters sheet does not contain a parameter slider',
);
expect(
  container.querySelectorAll('button').length === 0 && container.querySelectorAll('input').length === 0,
  'mobile: native <button>/<input> elements must not appear in the sheet layout',
);
```

Note: `'Время смешивания'` is a real slider label — it is `ParamDef.label` for the first base parameter (`src/scenarios/tire-factory.json`, rendered by `ParameterPanel` via `RangeControl ariaLabel={def.label}` → `role="slider" aria-label="Время смешивания"`). It renders for every variant, so it is a safe assertion target regardless of which variant the smoke left active.

- [ ] **Step 2: Run smoke to verify it FAILS**

Run: `npm run smoke`
Expected: FAIL — `SMOKE RENDER FAILED` with `mobile: the «Параметры» toolbar button is missing at 390px` (the mobile layout does not exist yet).

- [ ] **Step 3: Implement `MobileWorkspace` in `App.tsx`**

Add the union type and component. Place `PanelKey` near the top-level constants:

```tsx
import { useState } from 'react';
import { SheetPanel } from '@/components/ui/SheetPanel';
import { Pressable } from '@/components/ui/Pressable';
import { BoltIcon, PresentationChartLineIcon, Squares2X2Icon } from '@/components/ui/icons';

type PanelKey = 'kpi' | 'params' | 'chart';

const TOOLBAR: Array<{ key: PanelKey; label: string; icon: typeof BoltIcon }> = [
  { key: 'kpi', label: 'KPI', icon: Squares2X2Icon },
  { key: 'params', label: 'Параметры', icon: BoltIcon },
  { key: 'chart', label: 'График', icon: PresentationChartLineIcon },
];

const SHEET_TITLES: Record<PanelKey, string> = {
  kpi: 'KPI цеха',
  params: 'Параметры',
  chart: 'Выработка в час',
};

function MobileWorkspace({ reference }: { reference: boolean }) {
  const [openPanel, setOpenPanel] = useState<PanelKey | null>(null);

  return (
    <>
      <main className="relative flex min-h-0 flex-1 flex-col p-3">
        <section className="relative flex min-w-0 flex-1 flex-col">
          <CanvasStage />
        </section>
      </main>

      {reference ? null : (
        <nav
          aria-label="Панели"
          className="flex shrink-0 items-stretch gap-2 border-t border-line bg-surface px-3 py-2"
        >
          {TOOLBAR.map(({ key, label, icon: Icon }) => (
            <Pressable
              key={key}
              label={label}
              pressed={openPanel === key}
              onPress={() => setOpenPanel(key)}
              className="h-11 flex-1 gap-2 rounded-xl text-[12px] font-semibold text-ink-700"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Pressable>
          ))}
        </nav>
      )}

      <SheetPanel
        open={openPanel !== null}
        title={openPanel ? SHEET_TITLES[openPanel] : ''}
        onClose={() => setOpenPanel(null)}
      >
        {openPanel === 'kpi' ? <KpiSidebar /> : null}
        {openPanel === 'params' ? <ParameterPanel /> : null}
        {openPanel === 'chart' ? <ThroughputPanel /> : null}
      </SheetPanel>
    </>
  );
}
```

- [ ] **Step 4: Render `MobileWorkspace` for non-desktop tiers**

In `Workspace`, replace the `null` mobile placeholder (added in Task 3) with `<MobileWorkspace/>`:

```tsx
      <Header />
      {tier === 'desktop' ? (
        <DesktopWorkspace reference={reference} />
      ) : (
        <MobileWorkspace reference={reference} />
      )}
      <TimelineBar />
```

- [ ] **Step 5: Run smoke to verify it PASSES**

Run: `npm run smoke`
Expected: `SMOKE RENDER PASSED` — the mobile phase now finds the «Параметры» toolbar button, opens the dialog with the slider inside, and no native elements appear.

- [ ] **Step 6: Run the full check**

Run: `npm run check`
Expected: typecheck + verify + smoke all green.

- [ ] **Step 7: Verify in the browser preview at all three viewports**

Start the dev server preview (launch config `tyres-dev`, per project setup) and check:
- **390×844** (mobile preset): toolbar visible; each of KPI / Параметры / График opens its sheet; sliders in the Parameters sheet are operable; swipe-down and the close button dismiss; **no horizontal page scroll**.
- **820×1180** (tablet): same single-column + sheets behavior.
- **1280×800** (desktop): three-column layout unchanged; no toolbar, no sheet.

Use `resize_window` presets and `read_page` / a screenshot as proof. (Per the project's browser-verify note, prefer DOM/computed-style checks; screenshots of the canvas pane may not composite.)

- [ ] **Step 8: Commit**

```bash
git add src/App.tsx scripts/smoke-render.tsx
git commit -m "feat(m2): mobile single-column layout with toolbar + panel sheets (tyre-2xo.2)"
```

---

## Self-Review (completed during planning)

**Spec coverage (§6.3 M2 + §6.4):**
- Three layouts from §6.2 → Task 3 (desktop) + Task 4 (phone & tablet share the mobile path, per design decision #3).
- New `ui/SheetPanel.tsx` (framer-motion + Pressable, ARIA dialog, swipe-down) → Task 2.
- Bottom toolbar «KPI / Параметры / График» → Task 4.
- §6.4.1 all functionality reachable via sheets → Task 4 smoke phase asserts it.
- §6.4.2 ≥1024 pixel-identical → Task 3 (verbatim markup) + existing smoke guard.
- §6.4.4 determinism untouched → no engine files modified; `verify` stays green.
- No new deps / no native inputs / <300 lines → Global Constraints, enforced by smoke's `button`/`input` asserts and file sizes.
- *Deferred by design (not gaps):* KPI horizontal strip (dropped, design §3.1); compact Header (M5); mobile TimelineBar (M6); mobile mode views (M7); pinch/pan (M3); ≥44px tuning (M4); full viewport smoke matrix + touch-target asserts (M9).

**Placeholder scan:** none — every code step contains complete code; the two "confirm the exact aria-label" notes point at a specific existing file/control and give the expected value.

**Type consistency:** `LayoutTier` ('phone'|'tablet'|'desktop') and `useBreakpoint` are defined in Task 1 and consumed in Tasks 3–4; `PanelKey` and `SheetPanelProps` are defined and consumed consistently; icon and `Pressable` prop usage matches their signatures in the repo.
