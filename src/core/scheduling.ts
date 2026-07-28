import type { ReleaseOrder, VariantId } from './types';

/**
 * Walks a cyclic release plan one product at a time. Pure, resettable state, so
 * a live run and a seek() replay emit the same deterministic product sequence.
 * With no plan it falls back to the scenario's single product (Phase 1).
 */
export class ReleasePlanCursor {
  private index = 0;
  private count = 0;

  constructor(
    private readonly plan: ReleaseOrder[] | undefined,
    private readonly fallback: VariantId | null,
  ) {}

  reset(): void {
    this.index = 0;
    this.count = 0;
  }

  /** Product type of the next released unit; advances the cursor. */
  next(): VariantId | null {
    if (!this.plan || this.plan.length === 0) return this.fallback;
    const order = this.plan[this.index];
    this.count += 1;
    if (this.count >= Math.max(1, order.qty)) {
      this.count = 0;
      this.index = (this.index + 1) % this.plan.length;
    }
    return order.variantId;
  }
}
