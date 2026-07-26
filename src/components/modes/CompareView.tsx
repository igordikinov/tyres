import { useEffect, useMemo, useRef, useState } from 'react';
import { ProductionCanvas } from '@/components/canvas/ProductionCanvas';
import { FactoryEngine } from '@/core/engine';
import { baselineParams, formatDuration, formatNumber, optimisedParams } from '@/core/scenario';
import type { Params, ScenarioDef, Snapshot } from '@/core/types';
import { useSimulationControls, useSimulationFrame } from '@/state/SimulationContext';

const ZONES = ['Подготовка', 'Вулканизация и отделка'];

function useMirroredEngine(scenario: ScenarioDef, params: Params, time: number): Snapshot {
  const engineRef = useRef<FactoryEngine | null>(null);
  if (engineRef.current === null) engineRef.current = new FactoryEngine(scenario, params);
  const lastTimeRef = useRef(0);
  const [snapshot, setSnapshot] = useState<Snapshot>(() => engineRef.current!.getSnapshot());

  useEffect(() => {
    const engine = engineRef.current!;
    const delta = time - lastTimeRef.current;
    if (delta > 0) engine.advance(delta);
    else if (delta < 0) engine.seek(time);
    lastTimeRef.current = time;
    setSnapshot(engine.getSnapshot());
  }, [time]);

  return snapshot;
}

function ScoreRow({ label, before, after, better }: { label: string; before: string; after: string; better: 'up' | 'down' }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line py-1.5 last:border-b-0">
      <span className="text-[11px] font-semibold text-ink-500">{label}</span>
      <span className="flex items-baseline gap-3">
        <span className="numeric text-[12px] font-semibold text-ink-400">{before}</span>
        <span className="text-[10px] text-ink-300">{better === 'up' ? '→' : '→'}</span>
        <span className="numeric text-[13px] font-bold text-brand-600">{after}</span>
      </span>
    </div>
  );
}

function Pane({
  title,
  caption,
  scenario,
  snapshot,
  accent,
}: {
  title: string;
  caption: string;
  scenario: ScenarioDef;
  snapshot: Snapshot;
  accent: 'ink' | 'brand';
}) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl2 border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <div>
          <p className="label-caps">{caption}</p>
          <h3 className={`text-[13px] font-bold ${accent === 'brand' ? 'text-brand-600' : 'text-ink-900'}`}>
            {title}
          </h3>
        </div>
        <div className="flex items-center gap-4">
          {[
            { label: 'Выр', value: `${formatNumber(snapshot.kpi.throughput, 1)}/ч` },
            { label: 'Цикл', value: formatDuration(snapshot.kpi.cycleTimeMinutes) },
            { label: 'Очер', value: formatNumber(snapshot.kpi.queue) },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-end">
              <span className="label-caps">{item.label}</span>
              <span className="numeric text-[13px] font-bold text-ink-900">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 p-2">
        <ProductionCanvas scenario={scenario} snapshot={snapshot} tocMode={false} zones={ZONES} />
      </div>
    </div>
  );
}

/** Split screen: the baseline plant against the elevated-constraint plant. */
export function CompareView() {
  const { scenario } = useSimulationControls();
  const { snapshot } = useSimulationFrame();
  const before = useMemo(() => baselineParams(scenario), [scenario]);
  const after = useMemo(() => optimisedParams(scenario), [scenario]);
  const beforeSnapshot = useMirroredEngine(scenario, before, snapshot.time);
  const afterSnapshot = useMirroredEngine(scenario, after, snapshot.time);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex min-h-0 flex-1 gap-3">
        <Pane
          caption="До"
          title={`${before.pressCount} прессов · цикл ${before.pressTime} мин`}
          scenario={scenario}
          snapshot={beforeSnapshot}
          accent="ink"
        />
        <Pane
          caption="После"
          title={`${after.pressCount} прессов · цикл ${after.pressTime} мин`}
          scenario={scenario}
          snapshot={afterSnapshot}
          accent="brand"
        />
      </div>

      <div className="surface-card shrink-0 px-4 py-2">
        <p className="label-caps mb-1">Результат расширения ограничения</p>
        <div className="grid grid-cols-2 gap-x-8 md:grid-cols-4">
          <ScoreRow
            label="Выработка"
            before={`${formatNumber(beforeSnapshot.kpi.throughput, 1)}/ч`}
            after={`${formatNumber(afterSnapshot.kpi.throughput, 1)}/ч`}
            better="up"
          />
          <ScoreRow
            label="Время цикла"
            before={formatDuration(beforeSnapshot.kpi.cycleTimeMinutes)}
            after={formatDuration(afterSnapshot.kpi.cycleTimeMinutes)}
            better="down"
          />
          <ScoreRow
            label="НЗП"
            before={formatNumber(beforeSnapshot.kpi.wip)}
            after={formatNumber(afterSnapshot.kpi.wip)}
            better="down"
          />
          <ScoreRow
            label="Готово"
            before={formatNumber(beforeSnapshot.kpi.completed)}
            after={formatNumber(afterSnapshot.kpi.completed)}
            better="up"
          />
        </div>
      </div>
    </div>
  );
}
