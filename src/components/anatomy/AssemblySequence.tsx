import { ChevronRightIcon } from '@/components/ui/icons';
import { AnimatePresence, motion } from 'framer-motion';
import { Fragment, useEffect, useState } from 'react';
import stage1 from '@/assets/img/assembly/stage-1.png';
import stage2 from '@/assets/img/assembly/stage-2.png';
import stage3 from '@/assets/img/assembly/stage-3.png';
import stage4 from '@/assets/img/assembly/stage-4.png';
import stage5 from '@/assets/img/assembly/stage-5.png';
import stage6 from '@/assets/img/assembly/stage-6.png';
import uncuredTire from '@/assets/img/tire/uncured.png';
import { Pressable } from '@/components/ui/Pressable';
import { ASSEMBLY_STEP_MS, MOTION_BASE, MOTION_EASE } from '@/core/constants';
import type { AssemblyLayer } from '@/core/types';

/** Cumulative drum renders — index i shows the build after applying layer i. */
const STAGE_IMAGES = [stage1, stage2, stage3, stage4, stage5, stage6];

export interface AssemblySequenceProps {
  layers: AssemblyLayer[];
}

/** Layer-by-layer build on the assembly drum, ending in the green tire. */
export function AssemblySequence({ layers }: AssemblySequenceProps) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return undefined;
    const handle = window.setInterval(
      () => setStep((current) => (current + 1) % layers.length),
      ASSEMBLY_STEP_MS,
    );
    return () => window.clearInterval(handle);
  }, [layers.length, playing]);

  const current = layers[step];
  const applied = layers.slice(0, step + 1).map((layer) => layer.id);
  const complete = step === layers.length - 1;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        {layers.map((layer, index) => {
          const done = index <= step;
          return (
            <Pressable
              key={layer.id}
              label={`Шаг ${layer.step}: ${layer.name}`}
              pressed={index === step}
              onPress={() => {
                setPlaying(false);
                setStep(index);
              }}
              className={`h-7 gap-1.5 rounded-lg border px-2.5 text-[11px] font-semibold transition-colors ${
                index === step
                  ? 'border-brand-500 bg-brand-500 text-white'
                  : done
                    ? 'border-brand-200 bg-brand-50 text-brand-600'
                    : 'border-line bg-surface text-ink-400'
              }`}
            >
              <span className="numeric">{layer.step}</span>
              <span>{layer.name}</span>
            </Pressable>
          );
        })}
        <Pressable
          label={playing ? 'Пауза сборки' : 'Запуск сборки'}
          onPress={() => setPlaying(!playing)}
          className="h-7 rounded-lg border border-line bg-surface px-2.5 text-[11px] font-semibold text-ink-500"
        >
          {playing ? 'Пауза' : 'Пуск'}
        </Pressable>
      </div>

      <div className="flex min-h-0 flex-1 flex-wrap items-center justify-center gap-x-1.5 gap-y-3">
        {layers.map((layer, index) => (
          <Fragment key={layer.id}>
            <div className="flex w-[92px] flex-col items-center gap-1.5">
              <motion.div
                className={`flex h-[88px] w-[88px] items-center justify-center rounded-xl2 border transition-colors ${
                  index === step ? 'border-brand-300 bg-brand-50/60' : 'border-transparent'
                }`}
                initial={false}
                animate={{ scale: index === step ? 1 : 0.94, opacity: index <= step ? 1 : 0.4 }}
                transition={{ duration: MOTION_BASE, ease: MOTION_EASE }}
              >
                <img
                  src={STAGE_IMAGES[index] ?? STAGE_IMAGES[STAGE_IMAGES.length - 1]}
                  alt={layer.name}
                  className="h-[92%] w-[92%] object-contain"
                />
              </motion.div>
              <span
                className={`text-center text-[10px] font-semibold leading-tight ${
                  index === step ? 'text-ink-900' : 'text-ink-400'
                }`}
              >
                {layer.name}
              </span>
            </div>
            <ChevronRightIcon className="mb-[18px] h-4 w-4 shrink-0 text-ink-300" />
          </Fragment>
        ))}
        <div className="flex w-[100px] flex-col items-center gap-1.5">
          <motion.div
            className="flex h-[88px] w-[88px] items-center justify-center rounded-xl2 border border-brand-200 bg-brand-50/60"
            initial={false}
            animate={{ scale: complete ? 1 : 0.92, opacity: complete ? 1 : 0.5 }}
            transition={{ duration: MOTION_BASE, ease: MOTION_EASE }}
          >
            <img src={uncuredTire} alt="Зелёная шина" className="h-[86%] w-[86%] object-contain" />
          </motion.div>
          <span className="text-center text-[10px] font-bold leading-tight text-brand-600">
            Зелёная шина
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={current.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: MOTION_BASE, ease: MOTION_EASE }}
          className="shrink-0 rounded-xl border border-line bg-surface-muted px-3 py-2 text-[12px] font-medium text-ink-700"
        >
          <span className="mr-2 rounded bg-brand-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {current.step}/{layers.length}
          </span>
          {current.caption}
        </motion.p>
      </AnimatePresence>

      <p className="shrink-0 text-[10px] text-ink-400">
        Нанесено: {applied.length} из {layers.length} слоёв.
      </p>
    </div>
  );
}
