/**
 * Single source of truth for every tunable constant.
 * No magic numbers are allowed anywhere else in the code base.
 */
import type { VariantId } from './types';

/** Fixed integration step of the simulation, in simulated minutes. */
export const TICK_MINUTES = 0.1;

/** Tolerance used when converting requested minutes into whole ticks. */
export const TICK_EPSILON = 1e-9;

/** One real second equals this many simulated minutes at 1x speed. */
export const SIM_MINUTES_PER_REAL_SECOND = 2;

/** Length of one demonstration shift, in simulated minutes. */
export const HORIZON_MINUTES = 480;

/** Wall-clock hour at which the simulated shift starts. */
export const SHIFT_START_HOUR = 6;

/** Guard against huge catch-up steps after a tab has been backgrounded. */
export const MAX_FRAME_MINUTES = 6;

/** Rolling window used to compute throughput per hour. */
export const THROUGHPUT_WINDOW_MINUTES = 60;

/** Number of recent completions averaged into the cycle time KPI. */
export const LEAD_TIME_SAMPLE_SIZE = 24;

/** Sampling interval of the throughput history feeding the D3 chart. */
export const HISTORY_INTERVAL_MINUTES = 4;

/** Maximum number of points retained in the history series. */
export const HISTORY_MAX_POINTS = Math.ceil(HORIZON_MINUTES / HISTORY_INTERVAL_MINUTES) + 1;

/** KPI recalculation cadence in real milliseconds, per the PRD. */
export const KPI_REFRESH_MS = 100;

/** Time constant of the exponential moving average used for utilisation. */
export const UTILIZATION_TAU_MINUTES = 15;

/** Utilisation above which a resource is treated as a constraint. */
export const BOTTLENECK_UTILIZATION_THRESHOLD = 0.9;

/** Minimum simulated minutes before bottleneck detection is trusted. */
export const BOTTLENECK_WARMUP_MINUTES = 20;

/** Weight of queue pressure relative to utilisation when ranking constraints. */
export const BOTTLENECK_PRESSURE_WEIGHT = 0.5;

/** Minimum time a narration caption stays on screen, in simulated minutes. */
export const NARRATION_DWELL_MINUTES = 14;

/** Simulated minutes advanced by a single Step command. */
export const STEP_MINUTES = 1;

export const SPEED_OPTIONS = [0.5, 1, 2, 4] as const;
export type SpeedOption = (typeof SPEED_OPTIONS)[number];
export const DEFAULT_SPEED: SpeedOption = 1;

/** Canvas geometry, in scenario viewBox units. */
export const STATION_WIDTH = 230;
export const STATION_HEIGHT = 220;
export const TOKEN_RADIUS = 11;
export const QUEUE_GAP = 26;
export const RACK_ROW_GAP = 26;
export const SERVICE_SLOT_GAP = 30;
export const SERVICE_CENTER_DY = -30;
export const QUEUE_CENTER_DY = 42;
export const RACK_BASE_DY = 44;
export const SERVICE_COLUMNS = 4;
export const RACK_COLUMNS_DEFAULT = 8;
/** Rows a buffer rack may show before the remainder collapses into a badge. */
export const RACK_MAX_ROWS = 5;
export const ZONE_PADDING = 34;
/** Finished tires needed to fill the warehouse shelves on screen. */
export const WAREHOUSE_VISUAL_CAPACITY = 60;
/** Ticks drawn on the timeline scrubber. */
export const TIMELINE_MARKER_COUNT = 8;
/** Playback speed used by the unattended presentation. */
export const PRESENTATION_SPEED = 4;

/**
 * Layout breakpoints for the Фаза 3 responsive shell (§6.2).
 * Thresholds live here so no width literal appears in markup.
 * < sm → phone (single column + sheets); sm..<lg → tablet (single column + sheets);
 * >= lg → the unchanged three-column desktop layout.
 */
export const BREAKPOINTS = { sm: 640, lg: 1024 } as const;

/** Dwell time of one step of the layer-by-layer build, in real milliseconds. */
export const ASSEMBLY_STEP_MS = 1400;

/** Offset of the information bus below each canvas row. */
export const INFO_BUS_OFFSET = 20;

/** Framer Motion timings. */
export const MOTION_FAST = 0.18;
export const MOTION_BASE = 0.32;
export const MOTION_SLOW = 0.6;
export const MOTION_EASE = [0.22, 1, 0.36, 1] as const;

/** Presentation mode: simulated minutes spent on each narrated chapter. */
export const PRESENTATION_CHAPTER_MINUTES = 60;

/** Resource state palette — mirrors tailwind.config.js `state` colours (In.Plan). */
export const STATE_COLORS: Record<string, string> = {
  idle: '#949598',
  working: '#9000FF',
  blocked: '#FF9A3B',
  starved: '#0D56E2',
  bottleneck: '#EE4444',
  changeover: '#EAB308',
};

export const CANVAS_INK = '#1F1F20';
export const CANVAS_LINE = '#DFDFE0';
export const CANVAS_MUTED = '#949598';
export const CANVAS_SURFACE = '#FFFFFF';
export const CANVAS_SUNKEN = '#F5F6F8';
export const CANVAS_GRID = '#EFF1F5';
export const CANVAS_ZONE = '#FBFBFD';
export const CANVAS_ZONE_LINE = '#EAEAEA';
export const INK_300 = '#BFBFC1';
export const BRAND_500 = '#9000FF';
export const BRAND_100 = '#F4E3FF';
export const BRAND_50 = '#FAF3FF';
export const BRAND_600 = '#6F00CE';
export const ACCENT = '#EE4444';

/**
 * Uncured tires really are green on a shop floor, so the token is olive until
 * it leaves vulcanisation and turns into cured black rubber.
 */
export const GREEN_TIRE = '#7FA850';
/** Uncured "green" tire: matte smooth black rubber (no tread pattern yet). */
export const TOKEN_UNCURED_BODY = '#454B54';
export const TOKEN_UNCURED_RIM = '#2A2F37';
/** Cured tire: deep glossy black with a moulded tread. */
export const TOKEN_CURED_BODY = '#1D242D';
export const TOKEN_CURED_RIM = CANVAS_INK;

/** Dashed information flow drawn by the APS overlay. */
export const INFO_FLOW = '#AF35FF';

/** Cross-section and build-tile palette. */
export const RUBBER_OUTER = '#242E3B';
export const RUBBER_BODY = '#303A47';
export const BEAD_CORE = '#8A6420';
export const RIM_FILL = '#E2E8F2';
export const INK_700 = '#334155';
export const BUFFER_TINT = '#F0FDF4';

/** Opacity applied to non-constraint resources while TOC mode is active. */
export const TOC_DIMMED_OPACITY = 0.32;

/* ------------------------------------------------------------------ *
 * Product variants (Phase 1). Colours tint the token rim and legend
 * per variant; the brand purple #9000FF stays reserved for the working
 * state, so these are drawn from tire-appropriate warm/cool hues.
 * ------------------------------------------------------------------ */

/** Token rim / legend colour per product variant. */
export const VARIANT_COLORS: Record<VariantId, string> = {
  summer: '#E0A03A',
  winter: '#2E86C1',
  'winter-studded': '#5D7A94',
};

/** Default studding time per tire, in minutes (~110 studs at ~110/min + handling). */
export const DEFAULT_STUDDING_TIME = 2;
/** Default number of parallel studding machines. */
export const DEFAULT_STUDDING_COUNT = 1;
/** Default rest/curing dwell after studding, compressed to shift scale. */
export const DEFAULT_REST_MINUTES = 10;

/** Regulation stud protrusion above the tread, in millimetres (spec §2.2). */
export const STUD_PROTRUSION_MM = 1.2;
/** Allowed deviation of the stud protrusion, in millimetres. */
export const STUD_PROTRUSION_TOLERANCE_MM = 0.3;

/** StudCallout: size of the zoomed stud-in-hole cross-section, in viewBox units. */
export const STUD_CALLOUT_WIDTH = 240;
export const STUD_CALLOUT_HEIGHT = 200;
