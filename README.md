# Interactive Tire Factory Digital Twin

An interactive visualisation of tire manufacturing, built for APS / MRP demonstrations,
Theory of Constraints workshops, Supply Planning explanations, employee training and conferences.

This is not a website. It is a deterministic production simulation with a semi-isometric
SVG shop floor rendered at 60 fps.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type check + production bundle in dist/
npm run preview  # serve the production build
npm run check    # typecheck + model verification + headless render smoke test
```

## What you can demonstrate

| Control | What it shows |
| --- | --- |
| **Play / Pause / Step / Reset** | Full control over the simulated shift (8 h, 06:00 → 14:00). |
| **Speed 0.5x – 4x** | Slow down for explanation, speed up for the full shift. |
| **Timeline scrubber** | Deterministic rewind — the run is replayed from t = 0, never faked. |
| **Parameter panel** | Mixer / Extruder / Assembly / Press / Inspection times, press count, batch size, buffer size. |
| **Show TOC** | Greys out every resource except the constraint *and the stock waiting in front of it*. |
| **Show APS** | Overlays the planning chain: Orders → Finite Scheduler → Production Orders → Resources → Execution. |
| **Compare** | Split screen: baseline plant vs. elevated-constraint plant, running in lockstep. |
| **Presentation** | Unattended eight-chapter demo with narration — no user interaction required. |
| **Anatomy** | Interactive tire cross-section with six numbered callouts, plus the layer-by-layer build on the assembly drum ending in the green tire. |
| **Materials** | Bill of materials with share of compound and consuming stage, plus material flow vs. information flow. |

### The Theory of Constraints story, verified

`npm run verify` runs the model headlessly and asserts the core narrative:

```
baseline (4 presses)    thr  16.0/h  cycle  115m  wip 52  queue 39  press 100%  bottleneck Vulcanization
optimised (8 presses)   thr  24.0/h  cycle   41m  wip 17  queue  0  press  78%  bottleneck —
```

Assembly runs a 2-minute cycle while a press needs 15 minutes. With four presses the plant
delivers 16 tires/h and a queue of green tires builds up in the buffer. Doubling the presses
drains the queue, lifts throughput to the planned rate and cuts cycle time by roughly two thirds.

The same script also asserts that a live run fed *jittery browser frame deltas* lands on
exactly the same state as `seek()` replaying the shift in one step, that the narration cycles
instead of freezing on its last caption, and that all four resource states are reachable.

## Architecture

```
src/
├── core/                    domain-agnostic simulation (no React, no tires)
│   ├── types.ts             Factory / Resources / Buffers / Routes / Orders model
│   ├── constants.ts         every tunable constant — no magic numbers elsewhere
│   ├── engine.ts            deterministic fixed-step simulation
│   ├── runtime.ts           mutable runtime state
│   ├── snapshot.ts          immutable per-frame view
│   ├── narrator.ts          captions that follow the material flow
│   ├── metrics.ts           throughput, lead time, utilisation, bottleneck detection
│   ├── layout.ts            canvas geometry: routes, queue slots, service slots, racks
│   ├── tireProfile.ts       cross-section and build-tile geometry
│   ├── scenario.ts          scenario loading and formatting
│   └── presentation.ts      the unattended demonstration script
├── scenarios/
│   └── tire-factory.json    the entire plant as data
├── state/
│   ├── contexts.ts          controls / frame / KPI context split
│   └── SimulationContext.tsx  engine ownership and the animation loop
├── components/
│   ├── ui/                  Pressable, ActionButton, Segmented, RangeControl, ToggleSwitch…
│   ├── machines/            ten hand-drawn animated SVG machines
│   ├── anatomy/             tire cross-section and layer-by-layer build
│   ├── materials/           bill of materials and flow legend
│   ├── canvas/              ProductionCanvas, StationNode, FlowLink, TireToken, InformationFlow
│   ├── kpi/                 KPI cards, state legend, D3 throughput chart
│   ├── layout/              Header, ParameterPanel, TimelineBar
│   └── modes/               TOC / APS / Compare / Presentation / Narration
└── scripts/                 headless model and render checks
```

### A generic production visualisation engine

The engine deliberately knows nothing about tires. A factory is described as
**Resources, Buffers, Routes, Orders and Events**, and tire manufacturing is simply
`src/scenarios/tire-factory.json`. Beverages, steel, pharma or FMCG can be added by
dropping in another scenario file and registering it in `src/core/scenario.ts` —
no component or engine code changes.

Each scenario node declares its geometry, machine renderer, process time, parallel
capacity, queue capacity, transport time and which parameter slider drives it.

The product itself is data too: `construction` (six structural elements), `assemblyLayers`
(the build sequence) and `materials` (bill of materials with shares) drive the Anatomy and
Materials tabs without a single hard-coded string in a component.

### Simulation model

* Fixed step of `TICK_MINUTES = 0.1` simulated minutes. The clock is derived from an
  integer tick counter and partial browser frames are accumulated, so a live run and a
  `seek()` replay produce identical state — the timeline scrubber never rewrites history.
* At 1x speed one real second equals two simulated minutes.
* Units are reserved into the downstream queue before they depart, so a full downstream
  buffer produces a genuine **blocked** state rather than a disappearing unit.
* Resource states: `idle` (waiting, material inbound), `working`, `blocked` (downstream
  full), `starved` (upstream dry), plus the derived `bottleneck`.
* Utilisation is an exponential moving average (τ = 15 min) so it reacts to live
  parameter changes instead of dragging historical averages along.
* The constraint is the resource with the highest combination of utilisation and queue
  pressure; the queue held by an immediately upstream buffer is attributed to it, and
  TOC mode keeps that buffer highlighted alongside the constraint itself.
* KPIs are recalculated every 100 ms, the canvas is redrawn every animation frame.

### Rendering at 60 fps

State is published through three separate contexts so the frame rate of the canvas does not
dictate the render cost of the rest of the UI:

| Context | Cadence | Consumers |
| --- | --- | --- |
| `SimulationControls` | on user action only | Header, parameter sliders, mode switches |
| `SimulationFrame` | every animation frame | ProductionCanvas, timeline scrubber |
| `SimulationKpi` | every 100 ms | KPI cards, throughput chart, APS overlay |

Machine artwork is memoised, so machine animations are never restarted by a canvas update,
and timeline scrubbing is coalesced to one replay per animation frame.

## Design constraints honoured

* No Bootstrap, no component framework — every control is bespoke.
* No native `<button>`, `<input type="range">` or `<select>`; all interaction goes
  through the `Pressable`, `RangeControl` and `Segmented` primitives with keyboard support
  (arrows, Home/End, PageUp/PageDown) and correct ARIA roles.
* No raster assets — all ten machines are inline animated SVG.
* Every file stays below 300 lines; all parameters flow through React Context.
* All constants live in `src/core/constants.ts`.

## Quality gates

```bash
npm run typecheck   # strict TypeScript, no unused locals or parameters
npm run verify      # headless simulation: determinism, TOC story, narration, states
npm run smoke       # boots the real app in jsdom, presses Play, TOC and APS
npm run check       # all three
npm run build       # type check + production bundle
```

The smoke test also asserts that no native `<button>` or `<input>` element ever reaches the DOM.

## Stretch goals already scaffolded

* Scenario-driven configuration (`tire-factory.json`) — ready for DRP and other industries.
* Production orders and release policy are modelled (`releaseIntervalMinutes`, `batchSize`).
* Deterministic replay makes state export and scenario diffing straightforward.
