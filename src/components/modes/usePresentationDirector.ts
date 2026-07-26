import { useEffect, useRef } from 'react';
import { PRESENTATION_CHAPTER_MINUTES, PRESENTATION_SPEED } from '@/core/constants';
import { PRESENTATION_SCRIPT, type PresentationChapter } from '@/core/presentation';
import type { ParamKey } from '@/core/types';
import { useSimulationControls, useSimulationFrame } from '@/state/SimulationContext';

export interface PresentationState {
  chapter: PresentationChapter | null;
  index: number;
  total: number;
}

/** Drives the unattended demonstration: no user interaction required. */
export function usePresentationDirector(): PresentationState {
  const { demoMode, reset, play, setSpeed, setTocMode, setApsMode, setParam, restoreBaseline } =
    useSimulationControls();
  const { snapshot } = useSimulationFrame();
  const appliedRef = useRef(-1);
  const armedRef = useRef(false);

  const active = demoMode === 'presentation';
  const index = active
    ? Math.min(
        Math.floor(snapshot.time / PRESENTATION_CHAPTER_MINUTES),
        PRESENTATION_SCRIPT.length - 1,
      )
    : -1;

  useEffect(() => {
    if (!active) {
      armedRef.current = false;
      appliedRef.current = -1;
      setTocMode(false);
      setApsMode(false);
      restoreBaseline();
      return;
    }
    armedRef.current = false;
    appliedRef.current = -1;
    restoreBaseline();
    reset();
    setSpeed(PRESENTATION_SPEED);
    play();
    // The clock only reads 0 on the next published frame; arm afterwards so a
    // stale time cannot apply a later chapter first.
    armedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => {
    if (index < 0 || !armedRef.current || appliedRef.current === index) return;
    appliedRef.current = index;
    const chapter = PRESENTATION_SCRIPT[index];
    setTocMode(chapter.toc);
    setApsMode(chapter.aps);
    if (chapter.params) {
      (Object.entries(chapter.params) as Array<[ParamKey, number]>).forEach(([key, value]) =>
        setParam(key, value),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  return {
    chapter: index >= 0 ? PRESENTATION_SCRIPT[index] : null,
    index,
    total: PRESENTATION_SCRIPT.length,
  };
}
