import { ArrowUturnLeftIcon, BoltIcon } from '@/components/ui/icons';
import { ActionButton } from '@/components/ui/ActionButton';
import { Panel, SectionLabel } from '@/components/ui/Panel';
import { RangeControl } from '@/components/ui/RangeControl';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { formatNumber } from '@/core/scenario';
import type { ParamDef } from '@/core/types';
import { useSimulationControls, useSimulationKpi } from '@/state/SimulationContext';

function ParameterRow({
  def,
  value,
  onChange,
  isConstraint,
}: {
  def: ParamDef;
  value: number;
  onChange: (value: number) => void;
  isConstraint: boolean;
}) {
  return (
    <div className="py-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[12px] font-semibold text-ink-700">
          {def.label}
          {isConstraint ? (
            <span className="rounded bg-accent-soft px-1 py-px text-[9px] font-bold uppercase tracking-wide text-accent">
              огранич.
            </span>
          ) : null}
        </span>
        <span className="numeric text-[12px] font-bold text-ink-900">
          {formatNumber(value, def.step < 1 ? 1 : 0)}
          <span className="ml-1 text-[10px] font-medium text-ink-400">{def.unit}</span>
        </span>
      </div>
      <div className="mt-1.5">
        <RangeControl
          ariaLabel={def.label}
          value={value}
          min={def.min}
          max={def.max}
          step={def.step}
          onChange={onChange}
          tone={isConstraint ? 'accent' : 'brand'}
        />
      </div>
      <p className="mt-1 text-[10px] leading-snug text-ink-400">{def.hint}</p>
    </div>
  );
}

export function ParameterPanel() {
  const { scenario, params, setParam, restoreBaseline, applyOptimised, tocMode, setTocMode, apsMode, setApsMode } =
    useSimulationControls();
  const { kpi } = useSimulationKpi();

  const constraintNode = kpi.bottleneckId ? scenario.nodes.find((node) => node.id === kpi.bottleneckId) : undefined;
  const constraintParams = new Set(
    [constraintNode?.timeParam, constraintNode?.capacityParam].filter(Boolean) as string[],
  );

  const groups: Array<{ key: ParamDef['group']; label: string }> = [
    { key: 'time', label: 'Время операций' },
    { key: 'capacity', label: 'Мощность и партии' },
  ];

  return (
    <Panel
      eyebrow="Что если"
      title="Параметры"
      className="h-full"
      bodyClassName="flex min-h-0 flex-col"
      action={
        <div className="flex items-center gap-1">
          <ActionButton label="Сброс" icon={ArrowUturnLeftIcon} size="sm" variant="quiet" onPress={restoreBaseline} hideLabel />
          <ActionButton label="Оптимизировать" icon={BoltIcon} size="sm" variant="primary" onPress={applyOptimised} />
        </div>
      }
    >
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        {groups.map((group) => (
          <div key={group.key}>
            <SectionLabel>{group.label}</SectionLabel>
            <div className="divide-y divide-line">
              {scenario.paramDefs
                .filter((def) => def.group === group.key)
                .map((def) => (
                  <ParameterRow
                    key={def.key}
                    def={def}
                    value={params[def.key]}
                    onChange={(value) => setParam(def.key, value)}
                    isConstraint={constraintParams.has(def.key)}
                  />
                ))}
            </div>
          </div>
        ))}

        <SectionLabel>Слои демонстрации</SectionLabel>
        <div className="flex flex-col gap-2">
          <ToggleSwitch
            label="Показать ТОС"
            description="Затемнить все ресурсы, кроме ограничения"
            value={tocMode}
            onChange={setTocMode}
            accent="accent"
          />
          <ToggleSwitch
            label="Показать APS"
            description="Цепочка планирования от заказов до исполнения"
            value={apsMode}
            onChange={setApsMode}
          />
        </div>
      </div>
    </Panel>
  );
}
