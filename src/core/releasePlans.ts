import type { ReleaseOrder } from './types';

/**
 * Seasonal release-mix presets for the mixed flow (Phase 2). Each plan is a
 * deterministic, RNG-free sequence of production orders that repeats cyclically;
 * the quantities encode the summer/winter/studded share of the demand.
 */
export interface ReleasePlanPreset {
  id: string;
  name: string;
  /** Summer / winter / studded percentage, for labels. */
  mix: string;
  plan: ReleaseOrder[];
}

export const RELEASE_PLANS: Record<string, ReleasePlanPreset> = {
  offseason: {
    id: 'offseason',
    name: 'Межсезонье',
    mix: '50 / 30 / 20',
    plan: [
      { variantId: 'summer', qty: 5 },
      { variantId: 'winter', qty: 3 },
      { variantId: 'winter-studded', qty: 2 },
    ],
  },
  peakwinter: {
    id: 'peakwinter',
    name: 'Пик зимы',
    mix: '10 / 40 / 50',
    plan: [
      { variantId: 'summer', qty: 1 },
      { variantId: 'winter', qty: 4 },
      { variantId: 'winter-studded', qty: 5 },
    ],
  },
};

export const DEFAULT_RELEASE_PLAN_ID = 'offseason';
