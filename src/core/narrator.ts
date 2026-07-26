import { NARRATION_DWELL_MINUTES } from './constants';
import type { NodeDef, ScenarioDef } from './types';

export interface NarrationState {
  narration: string;
  narrationAt: number;
}

/**
 * Turns material movements into readable captions.
 *
 * Captions follow the flow in order, each one stays on screen long enough to
 * be read, and the story loops once the last station has spoken so a long
 * demonstration never freezes on a single sentence.
 */
export class Narrator {
  private readonly lastIndex: number;
  private index = 0;

  constructor(scenario: ScenarioDef) {
    this.lastIndex = scenario.nodes
      .filter((node) => Boolean(node.narration))
      .reduce((highest, node) => Math.max(highest, node.index), 0);
  }

  reset(): void {
    this.index = 0;
  }

  /** Returns true when the caption changed. */
  announce(def: NodeDef, now: number, state: NarrationState): boolean {
    if (!def.narration || def.index <= this.index) return false;
    const held = now - state.narrationAt;
    if (state.narration !== '' && held < NARRATION_DWELL_MINUTES) return false;
    state.narration = def.narration;
    state.narrationAt = now;
    this.index = def.index >= this.lastIndex ? 0 : def.index;
    return true;
  }
}
