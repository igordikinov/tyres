import type { PresentationChapter, ScenarioDef } from './types';

export type { PresentationChapter } from './types';

/**
 * Built-in fallback script of the unattended demonstration. The scenario data
 * now owns the script (scenario.presentation); this stays as the default so a
 * scenario without a presentation field still runs the base eight chapters.
 */
export const PRESENTATION_SCRIPT: PresentationChapter[] = [
  {
    title: 'Смешивание',
    narration: 'Резина смешивается, изготавливаются полуфабрикаты компонентов.',
    toc: false,
    aps: false,
    params: { pressCount: 4, pressTime: 15, bufferCapacity: 40, batchSize: 1 },
  },
  {
    title: 'Сборка',
    narration: 'Зелёная шина собирается и буферизуется перед вулканизацией.',
    toc: false,
    aps: false,
  },
  {
    title: 'Ограничение',
    narration: 'Вулканизация занимает 15 минут — самая медленная операция на заводе.',
    toc: true,
    aps: false,
  },
  {
    title: 'Незавершённое производство',
    narration: 'НЗП скапливается перед ограничением, пока остальная линия ждёт.',
    toc: true,
    aps: false,
  },
  {
    title: 'Расширить ограничение',
    narration: 'Теория ограничений: добавляем мощность там, где это важно. Прессов становится с 4 до 8.',
    toc: true,
    aps: false,
    params: { pressCount: 8, pressTime: 13, bufferCapacity: 24 },
  },
  {
    title: 'Поток восстановлен',
    narration: 'Очередь рассасывается, время цикла падает, выработка выходит на план.',
    toc: false,
    aps: false,
  },
  {
    title: 'Планирование по мощности',
    narration: 'Движок APS планирует каждый заказ с учётом ограниченной мощности по всему маршруту.',
    toc: false,
    aps: true,
  },
  {
    title: 'Планирование поставок',
    narration: 'Стабильный выпуск делает планирование поставок и распределение предсказуемым.',
    toc: false,
    aps: false,
  },
];

/** Resolved presentation script for a scenario, or the built-in fallback. */
export function presentationFor(scenario: ScenarioDef): PresentationChapter[] {
  return scenario.presentation && scenario.presentation.length > 0
    ? scenario.presentation
    : PRESENTATION_SCRIPT;
}
