# Ф3·M2 — Adaptive layout + SheetPanel — Design

- **Issue:** `tyre-2xo.2` (epic `tyre-2xo`, Фаза 3)
- **Date:** 2026-07-29
- **Depends on:** `tyre-2xo.1` (M1 viewport/scaffold — done)
- **Blocks:** `tyre-2xo.4` (touch targets), `.5` (compact Header), `.6` (mobile TimelineBar), `.7` (phone modes)
- **Spec source:** `docs/SPEC-tyre-variants.md` §6.2, §6.3 (M2), §6.4

## 1. Goal

Turn `App.tsx` from a fixed three-column desktop grid into a responsive shell with three
layouts, and add a bottom-sheet primitive so the KPI / Parameters / Throughput panels —
currently `hidden` below `md`/`lg` and therefore **unreachable on phones** — become
accessible on small screens. This is the layout milestone; it deliberately does not
mobile-optimize the Header, TimelineBar, or the reference/mode views (those are M5/M6/M7).

## 2. Scope

### In scope
- Breakpoint constants + a shared viewport hook.
- New `ui/SheetPanel.tsx` bottom-sheet primitive.
- `App.tsx` `Workspace` restructured into three responsive layouts.
- A bottom toolbar («KPI / Параметры / График») that summons the sheets on `<1024px`.

### Out of scope (owned by later milestones)
- Compact Header (M5), mobile TimelineBar (M6), mobile mode views — Compare / Anatomy /
  Materials / APS / Presentation (M7).
- Canvas pinch-zoom / pan (M3).
- ≥44px touch-target tuning (M4).
- Viewport-driven smoke assertions at 390×844 / 820×1180 (M9). M2 keeps `npm run check`
  green and is verified manually in the browser preview.

## 3. Decisions

Three ambiguities in §6.2 were resolved toward the leanest option that still meets the
§6.4 acceptance criteria.

1. **KPI on phone → a sheet, not a persistent strip.** The bottom toolbar
   «KPI / Параметры / График» opens each of `KpiSidebar`, `ParameterPanel`,
   `ThroughputPanel` as a bottom sheet, reusing all three panels **unchanged**. This
   satisfies §6.4.1 ("all functionality accessible via bottom sheets") without building a
   new horizontal KPI component and without spending scarce vertical space on a phone.
   *Deviation:* §6.2 lists a persistent horizontal-scroll KPI strip above the canvas. It
   is dropped for M2 and recorded here as an optional later polish; it is not required by
   any §6.4 acceptance criterion.

2. **M2 = shell only.** Header, TimelineBar, and the mode/reference views render with
   their current markup on phone (possibly cramped) and receive mobile treatment in
   M5/M6/M7. This keeps M2 focused and unblocks its four dependents cleanly.

3. **One panel mechanism for the whole `<1024px` range.** The toolbar + `SheetPanel`
   bottom sheet serves both phone (`<640`) and tablet-portrait (`640–1023`). No separate
   side-drawer overlay is built. "Panel on demand" (§6.2 middle row) is satisfied by the
   same bottom sheet.

## 4. Architecture

### 4.1 Breakpoints — `core/constants.ts`

```ts
/** Layout breakpoints for Фаза 3 responsive shell (§6.2). Thresholds live here, not in markup. */
export const BREAKPOINTS = { sm: 640, lg: 1024 } as const;
```

- `< sm` → phone portrait (single column + sheets)
- `sm … < lg` → tablet portrait / phone landscape (single column + sheets)
- `>= lg` → current three-column desktop layout, unchanged

### 4.2 Viewport hook — `hooks/useBreakpoint.ts`

Generalizes the existing `useCompactHeader()` resize-listener pattern in `Header.tsx`
into a reusable hook. Returns whether the viewport is below a given threshold (or a small
tier enum). Uses a lazy initial value that is safe under jsdom/SSR (no `window` access at
module load) so the smoke render stays green. Debounced/`requestAnimationFrame`-guarded
resize listener, cleaned up on unmount.

`Header.tsx` may later adopt this hook; M2 does not modify `Header.tsx` beyond what is
strictly required (goal: keep the diff focused — ideally zero Header changes).

### 4.3 `ui/SheetPanel.tsx` (new primitive, < 300 lines, no new deps)

- framer-motion `motion.div` sheet animating from the bottom edge; dimmed backdrop; both
  mounted/unmounted via `AnimatePresence`.
- Accessibility: `role="dialog"`, `aria-modal="true"`, `aria-label` from a `title` prop;
  **focus trap** while open; **focus return** to the invoking control on close; `Esc`
  closes. (Directly addresses the §7 risk "bottom sheet on custom primitives: focus trap,
  ARIA, focus return".)
- **Swipe-down to dismiss:** framer-motion `drag="y"` constrained to downward motion with
  an `onDragEnd` distance/velocity threshold — pointer-based, consistent with the existing
  `RangeControl` gesture approach.
- Composes the existing `Pressable` primitive for the backdrop / close affordance. No
  native `<button>` / `<dialog>` (house rule: custom primitives only).
- Props (approximate): `open: boolean`, `title: string`, `onClose: () => void`,
  `children: ReactNode`.

### 4.4 `App.tsx` — `Workspace` restructure

- **`>= lg` (desktop):** the current three-column markup, **untouched** — must stay
  pixel-identical (§6.4.2).
- **`< lg` (phone + tablet portrait):** single column — `Header` / full-width
  `CanvasStage` / `TimelineBar` — plus a **bottom toolbar** of three `Pressable` buttons
  and a single `SheetPanel` rendering the selected panel.
- Sheet selection state: one `useState<PanelKey | null>` where
  `PanelKey = 'kpi' | 'params' | 'chart'`, held in `Workspace`.
- **Reference/other modes:** where the desktop layout already hides the side panels (the
  `REFERENCE_MODES` set — anatomy, materials), the mobile toolbar is likewise hidden, so
  behavior stays consistent across breakpoints.
- `CanvasStage` is unchanged.

## 5. Data flow

No engine/model interaction. M2 touches layout and the sheet-open "camera" state only;
`seek()` determinism and the verify assertions are untouched (§6.4.4). Panels continue to
read from `SimulationContext` exactly as they do on desktop; rendering them inside a sheet
vs. a sidebar does not change their data sources.

## 6. Error / edge handling

- Sheet open across a resize into `>= lg`: desktop layout shows all panels inline, so the
  sheet state is simply ignored/reset when the toolbar is not rendered.
- Only one sheet open at a time (single state value); opening another swaps content.
- Focus return target may unmount (e.g., mode switch) — guard the focus-restore call.
- `useBreakpoint` must not read `window` at module eval (jsdom smoke).

## 7. Testing / verification

- `npm run typecheck && npm run verify && npm run smoke` (= `npm run check`) green.
- Browser preview manual pass:
  - **390×844** (phone): all panels reachable via the three toolbar sheets; sliders operable
    in the Parameters sheet; **no horizontal page scroll**; swipe-down and Esc dismiss.
  - **820×1180** (tablet portrait): canvas + panels on demand via the same sheets.
  - **≥1024** (desktop): three-column layout unchanged.
- Confirm no native inputs introduced and no new dependency added.

## 8. Files

| File | Change |
| --- | --- |
| `src/core/constants.ts` | add `BREAKPOINTS` |
| `src/hooks/useBreakpoint.ts` | new viewport hook |
| `src/components/ui/SheetPanel.tsx` | new bottom-sheet primitive |
| `src/App.tsx` | restructure `Workspace` into three layouts + toolbar + sheet |

Existing panels (`KpiSidebar`, `ParameterPanel`, `ThroughputPanel`), `Header`, and
`TimelineBar` are reused unchanged.

## 9. Constraints honored

No new dependencies · custom primitives only, no native inputs · files < 300 lines ·
no raster assets · engine determinism / `seek()` untouched.
