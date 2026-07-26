import { AnimatePresence, motion } from 'framer-motion';
import { XMarkIcon } from '@/components/ui/icons';
import { ActionButton } from '@/components/ui/ActionButton';
import { MOTION_BASE, MOTION_EASE } from '@/core/constants';
import { formatNumber } from '@/core/scenario';
import { useSimulationControls, useSimulationKpi } from '@/state/SimulationContext';

interface Stage {
  id: string;
  title: string;
  detail: string;
  value: string;
}

/** Planning chain overlay: Orders → Finite Scheduler → Execution. */
export function ApsOverlay() {
  const { apsMode, setApsMode, params, scenario } = useSimulationControls();
  const { kpi } = useSimulationKpi();
  const plannedRate = 60 / scenario.releaseIntervalMinutes;

  const stages: Stage[] = [
    {
      id: 'orders',
      title: 'Заказы',
      detail: 'Спрос преобразован в твёрдую последовательность',
      value: `${formatNumber(plannedRate, 0)}/ч`,
    },
    {
      id: 'scheduler',
      title: 'Планировщик по мощности',
      detail: 'Планирование каждой операции с учётом мощности',
      value: `${formatNumber(params.pressCount, 0)} прессов`,
    },
    {
      id: 'orders-out',
      title: 'Производственные заказы',
      detail: 'Запуск с учётом реальной доступности ресурсов',
      value: `${formatNumber(kpi.released)} запущено`,
    },
    {
      id: 'resources',
      title: 'Ресурсы',
      detail: 'Станки, буферы и операторы в цехе',
      value: `${formatNumber(kpi.utilization * 100, 0)}% загрузки`,
    },
    {
      id: 'execution',
      title: 'Исполнение',
      detail: 'Подтверждённый выпуск для планирования поставок',
      value: `${formatNumber(kpi.completed)} готово`,
    },
  ];

  return (
    <AnimatePresence>
      {apsMode ? (
        <motion.aside
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: MOTION_BASE, ease: MOTION_EASE }}
          className="absolute left-5 top-20 z-20 w-[288px] rounded-xl2 border border-line bg-white/95 p-4 shadow-lift backdrop-blur"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="label-caps">Расширенное планирование (APS)</p>
              <h3 className="text-[14px] font-bold text-ink-900">Цепочка планирования</h3>
            </div>
            <ActionButton
              label="Закрыть APS"
              icon={XMarkIcon}
              size="sm"
              variant="quiet"
              hideLabel
              onPress={() => setApsMode(false)}
            />
          </div>

          <ol className="mt-3 flex flex-col">
            {stages.map((stage, index) => (
              <motion.li
                key={stage.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: MOTION_BASE, delay: index * 0.07, ease: MOTION_EASE }}
              >
                <div className="rounded-xl border border-line bg-surface px-3 py-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[12px] font-bold text-ink-900">{stage.title}</span>
                    <span className="numeric text-[11px] font-semibold text-brand-600">{stage.value}</span>
                  </div>
                  <p className="mt-0.5 text-[10px] leading-snug text-ink-400">{stage.detail}</p>
                </div>
                {index < stages.length - 1 ? (
                  <div className="flex h-5 items-center justify-center">
                    <motion.span
                      className="h-full w-px bg-brand-200"
                      initial={false}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.6, repeat: Infinity, delay: index * 0.2 }}
                    />
                  </div>
                ) : null}
              </motion.li>
            ))}
          </ol>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
