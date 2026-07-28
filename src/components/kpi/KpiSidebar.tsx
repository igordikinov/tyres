import { Panel } from '@/components/ui/Panel';
import { VARIANT_COLORS } from '@/core/constants';
import { formatDuration, formatNumber, formatPercent } from '@/core/scenario';
import type { VariantId } from '@/core/types';
import { useSimulationControls, useSimulationKpi } from '@/state/SimulationContext';
import { KpiCard } from './KpiCard';
import { StateLegend } from './StateLegend';

const UTILIZATION_TARGET = 1;
const TYPE_LABELS: Record<VariantId, string> = { summer: 'Лето', winter: 'Зима', 'winter-studded': 'Шипы' };

export function KpiSidebar() {
  const { scenario } = useSimulationControls();
  const { kpi } = useSimulationKpi();
  const plannedRate = 60 / scenario.releaseIntervalMinutes;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <Panel eyebrow="Онлайн-показатели" title="KPI цеха" bodyClassName="p-3">
        <div className="grid grid-cols-2 gap-2">
          <KpiCard
            label="Выработка"
            value={formatNumber(kpi.throughput, 1)}
            unit="/ч"
            ratio={kpi.throughput / plannedRate}
            caption={`план ${formatNumber(plannedRate, 0)}/ч`}
          />
          <KpiCard
            label="Время цикла"
            value={formatDuration(kpi.cycleTimeMinutes)}
            caption="от заказа до склада"
          />
          <KpiCard label="НЗП" value={formatNumber(kpi.wip)} unit="шт" tone="ink" />
          <KpiCard
            label="Очередь"
            value={formatNumber(kpi.queue)}
            unit="шт"
            tone={kpi.queue > 0 ? 'accent' : 'ink'}
          />
          <KpiCard
            label="Загрузка"
            value={formatPercent(kpi.utilization)}
            ratio={kpi.utilization / UTILIZATION_TARGET}
          />
          <KpiCard
            label="Готовые шины"
            value={formatNumber(kpi.completed)}
            tone="brand"
            caption={`запущено ${formatNumber(kpi.released)}`}
          />
          <KpiCard
            wide
            label="Узкое место"
            value={kpi.bottleneckName}
            unit={kpi.bottleneckId ? formatPercent(kpi.bottleneckUtilization) : undefined}
            tone={kpi.bottleneckId ? 'accent' : 'ink'}
            ratio={kpi.bottleneckUtilization}
            caption={
              kpi.bottleneckId
                ? 'Каждая потерянная здесь минута теряется всем заводом.'
                : 'Ограничение не обнаружено — линия сбалансирована.'
            }
          />
        </div>
      </Panel>

      {kpi.byType ? (
        <Panel eyebrow="Смешанный поток" title="Выработка по типам" className="shrink-0" bodyClassName="p-3">
          <ul className="flex flex-col gap-1.5">
            {kpi.byType.map((type) => (
              <li key={type.productId} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: VARIANT_COLORS[type.productId] }} />
                <span className="text-[12px] font-semibold text-ink-700">{TYPE_LABELS[type.productId]}</span>
                <span className="numeric ml-auto text-[13px] font-bold text-ink-900">{formatNumber(type.completed)}</span>
                <span className="text-[10px] text-ink-400">гот · НЗП {formatNumber(type.wip)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <Panel eyebrow="Легенда" title="Состояния ресурсов" className="shrink-0">
        <StateLegend />
      </Panel>
    </div>
  );
}
