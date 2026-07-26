import { useState } from 'react';
import exploded from '@/assets/img/tire/exploded.png';
import { Panel } from '@/components/ui/Panel';
import { Pressable } from '@/components/ui/Pressable';
import { formatNumber } from '@/core/scenario';
import { useSimulationControls } from '@/state/SimulationContext';
import { AssemblySequence } from './AssemblySequence';
import { TireCrossSection } from './TireCrossSection';

/** Anatomy tab: what a tire is made of, and how it is built. */
export function AnatomyView() {
  const { scenario } = useSimulationControls();
  const [selected, setSelected] = useState<string | null>(null);
  const { construction, assemblyLayers, curing, product } = scenario;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex min-h-0 flex-[3] gap-3">
        <Panel
          eyebrow="Конструкция"
          title={product}
          className="min-w-0 flex-[2]"
          bodyClassName="min-h-0 p-2"
        >
          <TireCrossSection parts={construction} selectedId={selected} onSelect={setSelected} />
        </Panel>

        <Panel
          eyebrow="Взрыв-схема"
          title="6 слоёв"
          className="min-w-0 flex-1"
          bodyClassName="min-h-0 p-2"
        >
          <img src={exploded} alt="Взрыв-схема слоёв шины" className="h-full w-full object-contain" />
        </Panel>

        <Panel
          eyebrow="Шесть структурных элементов"
          title="Что делает каждый слой"
          className="min-w-0 flex-[3]"
          bodyClassName="scroll-thin min-h-0 overflow-y-auto p-3"
        >
          <ul className="flex flex-col gap-1.5">
            {construction.map((part) => {
              const active = selected === part.id;
              return (
                <li key={part.id}>
                  <Pressable
                    label={part.name}
                    pressed={active}
                    onPress={() => setSelected(active ? null : part.id)}
                    className={`w-full items-start gap-3 rounded-xl border px-3 py-2 text-left transition-colors ${
                      active ? 'border-brand-400 bg-brand-50' : 'border-line bg-surface hover:border-line-strong'
                    }`}
                  >
                    <span
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white"
                      style={{ backgroundColor: part.color }}
                    >
                      {part.index}
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="text-[13px] font-bold text-ink-900">{part.name}</span>
                      <span className="text-[11px] font-medium text-ink-700">{part.role}</span>
                      <span className="mt-0.5 text-[10px] leading-snug text-ink-400">{part.detail}</span>
                    </span>
                  </Pressable>
                </li>
              );
            })}
          </ul>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              {
                label: 'Темп. вулканизации',
                value: `${curing.temperatureC[0]}–${curing.temperatureC[1]}`,
                unit: '°C',
              },
              {
                label: 'Давление',
                value: `${curing.pressureBar[0]}–${curing.pressureBar[1]}`,
                unit: 'бар',
              },
              {
                label: 'Время цикла',
                value: formatNumber(scenario.params.pressTime, 0),
                unit: 'min',
              },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-line bg-surface-muted px-3 py-2">
                <p className="label-caps">{item.label}</p>
                <p className="numeric mt-0.5 text-[16px] font-bold text-ink-900">
                  {item.value}
                  <span className="ml-1 text-[10px] font-medium text-ink-400">{item.unit}</span>
                </p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel
        eyebrow="Сборочный барабан"
        title="Послойная сборка"
        className="min-h-0 flex-[2]"
        bodyClassName="min-h-0"
      >
        <AssemblySequence layers={assemblyLayers} />
      </Panel>
    </div>
  );
}
