import { useEffect, useRef } from 'react';
import { HORIZON_MINUTES, PRESENTATION_SPEED } from '@/core/constants';
import { presentationFor } from '@/core/presentation';
import type { ParamKey, PresentationChapter } from '@/core/types';
import { useSimulationControls, useSimulationFrame } from '@/state/SimulationContext';

export interface PresentationState {
  chapter: PresentationChapter | null;
  index: number;
  total: number;
  chapters: PresentationChapter[];
}

/** Drives the unattended demonstration: no user interaction required. */
export function usePresentationDirector(): PresentationState {
  const { scenario, demoMode, reset, play, setSpeed, setTocMode, setApsMode, setParam, restoreBaseline } =
    useSimulationControls();
  const { snapshot } = useSimulationFrame();
  const appliedRef = useRef(-1);
  const armedRef = useRef(false);

  // The script now travels with the variant; chapters share the shift evenly so
  // a longer studded script still fits the demonstration window.
  const script = presentationFor(scenario);
  const chapterMinutes = HORIZON_MINUTES / script.length;
  const active = demoMode === 'presentation';
  const index = active ? Math.min(Math.floor(snapshot.time / chapterMinutes), script.length - 1) : -1;

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
    const chapter = script[index];
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
    chapter: index >= 0 ? script[index] : null,
    index,
    total: script.length,
    chapters: script,
  };
}
