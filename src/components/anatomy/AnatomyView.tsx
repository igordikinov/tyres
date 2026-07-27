import { useState } from 'react';
import cutaway from '@/assets/img/tire/cutaway.png';
import cutawayStudded from '@/assets/img/tire/cutaway-studded.png';
import exploded from '@/assets/img/tire/exploded.png';
import explodedStudded from '@/assets/img/tire/exploded-studded.png';
import finishedStudded from '@/assets/img/tire/finished-studded.png';
import studMacro from '@/assets/img/tire/stud-macro.png';
import { Panel } from '@/components/ui/Panel';
import { Pressable } from '@/components/ui/Pressable';
import { formatNumber } from '@/core/scenario';
import { useSimulationControls } from '@/state/SimulationContext';
import { AssemblySequence } from './AssemblySequence';
import { StudCallout } from './StudCallout';
import { TireCrossSection } from './TireCrossSection';

/** Anatomy tab: what a tire is made of, and how it is built. */
export function AnatomyView() {
  const { scenario } = useSimulationControls();
  const [selected, setSelected] = useState<string | null>(null);
  const { construction, assemblyLayers, curing, product } = scenario;
  // The stud is a post-vulcanisation part, so it never appears as a build layer.
  const isStudded = construction.some((part) => part.id === 'stud');
  const crossSection = isStudded ? cutawayStudded : cutaway;
  const explodedView = isStudded ? explodedStudded : exploded;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex min-h-0 flex-[3] gap-3">
        <Panel
          eyebrow="Конструкция"
          title={product}
          className="min-w-0 flex-[2]"
          bodyClassName="min-h-0 p-2"
        >
          <TireCrossSection
            parts={construction}
            selectedId={selected}
            onSelect={setSelected}
            image={crossSection}
            alt={isStudded ? 'Разрез шипованной шины' : 'Разрез радиальной шины'}
          />
        </Panel>

        <Panel
          eyebrow="Взрыв-схема"
          title={`${construction.length} слоёв`}
          className="min-w-0 flex-1"
          bodyClassName="min-h-0 p-2"
        >
          <img
            src={explodedView}
            alt={isStudded ? 'Взрыв-схема шипованной шины' : 'Взрыв-схема слоёв шины'}
            className="h-full w-full object-contain"
          />
        </Panel>

        <Panel
          eyebrow={`${construction.length} структурных элементов`}
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

          {isStudded ? (
            <>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <figure className="rounded-xl border border-line bg-surface p-2">
                  <img src={studMacro} alt="Шип противоскольжения крупным планом" className="mx-auto h-24 w-auto object-contain" />
                  <figcaption className="mt-1 text-center text-[10px] text-ink-400">Шип: корпус + вставка ВК6/ВК8 + фланец</figcaption>
                </figure>
                <figure className="rounded-xl border border-line bg-surface p-2">
                  <img src={finishedStudded} alt="Готовая шипованная шина" className="mx-auto h-24 w-auto object-contain" />
                  <figcaption className="mt-1 text-center text-[10px] text-ink-400">Готовая шипованная шина</figcaption>
                </figure>
              </div>
              <StudCallout />
              <p className="mt-2 rounded-xl border border-line bg-surface-muted px-3 py-2 text-[10px] leading-snug text-ink-400">
                <span className="font-bold text-ink-700">Альтернатива Continental:</span> шипы с термоадгезионным
                покрытием устанавливают в невулканизированную заготовку и спекают с резиной при вулканизации. В модели
                процесса не реализуется — показана только классическая ошиповка после вулканизации.
              </p>
            </>
          ) : null}
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
