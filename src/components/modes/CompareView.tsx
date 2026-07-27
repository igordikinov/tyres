import { useEffect, useMemo, useRef, useState } from 'react';
import { ProductionCanvas } from '@/components/canvas/ProductionCanvas';
import { Segmented } from '@/components/ui/Segmented';
import { VARIANT_COLORS } from '@/core/constants';
import { FactoryEngine } from '@/core/engine';
import { baselineParams, formatDuration, formatNumber, getScenario, optimisedParams, resolveVariant } from '@/core/scenario';
import type { Params, ScenarioDef, Snapshot } from '@/core/types';
import { useSimulationControls, useSimulationFrame } from '@/state/SimulationContext';

const ZONES = ['Подготовка', 'Вулканизация и отделка'];

type PairMode = 'tuning' | 'variants';

const PAIR_OPTIONS: Array<{ value: PairMode; label: string }> = [
  { value: 'tuning', label: 'База vs Оптимизация' },
  { value: 'variants', label: 'Лето vs Зима шип.' },
];

interface Side {
  scenario: ScenarioDef;
  params: Params;
  caption: string;
  title: string;
  accent: 'ink' | 'brand';
  variantColor?: string;
}

/**
 * A private engine mirroring the shared clock. Rebuilt whenever the compared
 * plant changes (pair switch or variant switch) so both panes stay in lockstep.
 */
function useMirroredEngine(scenario: ScenarioDef, params: Params, time: number): Snapshot {
  const engineRef = useRef<FactoryEngine | null>(null);
  const lastTimeRef = useRef(0);
  const [snapshot, setSnapshot] = useState<Snapshot>(() => {
    engineRef.current = new FactoryEngine(scenario, params);
    return engineRef.current.getSnapshot();
  });

  useEffect(() => {
    const engine = new FactoryEngine(scenario, params);
    engine.seek(time);
    engineRef.current = engine;
    lastTimeRef.current = time;
    setSnapshot(engine.getSnapshot());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario, params]);

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
  variantColor,
}: {
  title: string;
  caption: string;
  scenario: ScenarioDef;
  snapshot: Snapshot;
  accent: 'ink' | 'brand';
  variantColor?: string;
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
        <ProductionCanvas scenario={scenario} snapshot={snapshot} tocMode={false} zones={ZONES} variantColor={variantColor} />
      </div>
    </div>
  );
}

/** Split screen: two plants advancing in lockstep — tuning or variant pair. */
export function CompareView() {
  const { scenario } = useSimulationControls();
  const { snapshot } = useSimulationFrame();
  const [pairMode, setPairMode] = useState<PairMode>('tuning');

  const { left, right, resultLabel } = useMemo<{ left: Side; right: Side; resultLabel: string }>(() => {
    if (pairMode === 'variants') {
      const base = getScenario();
      const summer = resolveVariant(base, 'summer');
      const studded = resolveVariant(base, 'winter-studded');
      return {
        left: { scenario: summer, params: baselineParams(summer), caption: 'Лето', title: summer.product, accent: 'ink', variantColor: VARIANT_COLORS.summer },
        right: { scenario: studded, params: baselineParams(studded), caption: 'Зима · шипы', title: studded.product, accent: 'brand', variantColor: VARIANT_COLORS['winter-studded'] },
        resultLabel: 'Одинаковый темп запуска — у шипованной длиннее цикл и больше переделов',
      };
    }
    const before = baselineParams(scenario);
    const after = optimisedParams(scenario);
    return {
      left: { scenario, params: before, caption: 'До', title: `${before.pressCount} прессов · цикл ${before.pressTime} мин`, accent: 'ink' },
      right: { scenario, params: after, caption: 'После', title: `${after.pressCount} прессов · цикл ${after.pressTime} мин`, accent: 'brand' },
      resultLabel: 'Результат расширения ограничения',
    };
  }, [pairMode, scenario]);

  const leftSnapshot = useMirroredEngine(left.scenario, left.params, snapshot.time);
  const rightSnapshot = useMirroredEngine(right.scenario, right.params, snapshot.time);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 justify-center">
        <Segmented ariaLabel="Пара сравнения" options={PAIR_OPTIONS} value={pairMode} onChange={setPairMode} />
      </div>

      <div className="flex min-h-0 flex-1 gap-3">
        <Pane
          caption={left.caption}
          title={left.title}
          scenario={left.scenario}
          snapshot={leftSnapshot}
          accent={left.accent}
          variantColor={left.variantColor}
        />
        <Pane
          caption={right.caption}
          title={right.title}
          scenario={right.scenario}
          snapshot={rightSnapshot}
          accent={right.accent}
          variantColor={right.variantColor}
        />
      </div>

      <div className="surface-card shrink-0 px-4 py-2">
        <p className="label-caps mb-1">{resultLabel}</p>
        <div className="grid grid-cols-2 gap-x-8 md:grid-cols-4">
          <ScoreRow
            label="Выработка"
            before={`${formatNumber(leftSnapshot.kpi.throughput, 1)}/ч`}
            after={`${formatNumber(rightSnapshot.kpi.throughput, 1)}/ч`}
            better="up"
          />
          <ScoreRow
            label="Время цикла"
            before={formatDuration(leftSnapshot.kpi.cycleTimeMinutes)}
            after={formatDuration(rightSnapshot.kpi.cycleTimeMinutes)}
            better="down"
          />
          <ScoreRow
            label="НЗП"
            before={formatNumber(leftSnapshot.kpi.wip)}
            after={formatNumber(rightSnapshot.kpi.wip)}
            better="down"
          />
          <ScoreRow
            label="Готово"
            before={formatNumber(leftSnapshot.kpi.completed)}
            after={formatNumber(rightSnapshot.kpi.completed)}
            better="up"
          />
        </div>
      </div>
    </div>
  );
}
