import { Panel } from '@/components/ui/Panel';
import { formatNumber } from '@/core/scenario';
import { useSimulationControls, useSimulationKpi } from '@/state/SimulationContext';
import { ThroughputChart } from './ThroughputChart';

/** Right-hand trend panel required by the PRD. */
export function ThroughputPanel() {
  const { scenario } = useSimulationControls();
  const { history, kpi, time } = useSimulationKpi();
  const plannedRate = 60 / scenario.releaseIntervalMinutes;

  return (
    <Panel
      eyebrow="Тренд"
      title="Выработка в час"
      className="shrink-0"
      bodyClassName="px-2 pb-3 pt-2"
      action={
        <span className="numeric text-[15px] font-bold text-brand-600">
          {formatNumber(kpi.throughput, 1)}
        </span>
      }
    >
      <div className="h-[132px] w-full">
        <ThroughputChart history={history} target={plannedRate} currentTime={time} />
      </div>
    </Panel>
  );
}
