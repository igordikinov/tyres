import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { Panel } from '@/components/ui/Panel';
import { Pressable } from '@/components/ui/Pressable';
import { MOTION_BASE, MOTION_EASE } from '@/core/constants';
import { formatNumber } from '@/core/scenario';
import { useSimulationControls } from '@/state/SimulationContext';
import { FlowLegend } from './FlowLegend';

const ALL_STAGES = 'all';

/** Materials tab: what goes into the compound and where it enters the line. */
export function MaterialsView() {
  const { scenario } = useSimulationControls();
  const [stage, setStage] = useState<string>(ALL_STAGES);

  const stages = useMemo(() => {
    const ids = Array.from(new Set(scenario.materials.map((material) => material.stage)));
    return ids.map((id) => ({
      id,
      name: scenario.nodes.find((node) => node.id === id)?.name ?? id,
    }));
  }, [scenario]);

  const visible = scenario.materials.filter(
    (material) => stage === ALL_STAGES || material.stage === stage,
  );
  const maxShare = Math.max(...scenario.materials.map((material) => material.share));

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <Panel
        eyebrow="Спецификация материалов"
        title="Из чего состоит шина"
        className="min-h-0 flex-[3]"
        bodyClassName="scroll-thin min-h-0 overflow-y-auto p-3"
        action={
          <div className="flex flex-wrap items-center gap-1">
            {[{ id: ALL_STAGES, name: 'Все этапы' }, ...stages].map((option) => (
              <Pressable
                key={option.id}
                label={option.name}
                pressed={stage === option.id}
                onPress={() => setStage(option.id)}
                className={`h-7 rounded-lg border px-2.5 text-[11px] font-semibold transition-colors ${
                  stage === option.id
                    ? 'border-brand-500 bg-brand-500 text-white'
                    : 'border-line bg-surface text-ink-500 hover:border-line-strong'
                }`}
              >
                {option.name}
              </Pressable>
            ))}
          </div>
        }
      >
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="label-caps pb-2 pl-1">Материал</th>
              <th className="label-caps pb-2">Назначение</th>
              <th className="label-caps pb-2 text-right">Доля в смеси</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((material) => (
              <tr key={material.id} className="border-b border-line last:border-b-0">
                <td className="py-2 pl-1 pr-3 align-middle">
                  <span className="flex items-center gap-2">
                    <span
                      className="h-3.5 w-3.5 shrink-0 rounded-full ring-2 ring-white"
                      style={{ backgroundColor: material.color }}
                    />
                    <span className="text-[12px] font-bold text-ink-900">{material.name}</span>
                  </span>
                </td>
                <td className="py-2 pr-3 align-middle text-[11px] text-ink-500">{material.purpose}</td>
                <td className="w-[190px] py-2 align-middle">
                  <span className="flex items-center justify-end gap-2">
                    <span className="h-1.5 w-[110px] overflow-hidden rounded-full bg-surface-sunken">
                      <motion.span
                        className="block h-full rounded-full"
                        style={{ backgroundColor: material.color }}
                        initial={false}
                        animate={{ width: `${(material.share / maxShare) * 100}%` }}
                        transition={{ duration: MOTION_BASE, ease: MOTION_EASE }}
                      />
                    </span>
                    <span className="numeric w-9 text-right text-[12px] font-bold text-ink-900">
                      {formatNumber(material.share)}%
                    </span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="mt-3 text-[10px] leading-snug text-ink-400">
          Доли ориентировочны для смеси легковой радиальной шины. Сера — едва один процент массы,
          но без неё нет вулканизации, а значит, и самой шины.
        </p>
      </Panel>

      <Panel
        eyebrow="Цех"
        title="Поток материалов и поток информации"
        className="min-h-0 flex-[2]"
        bodyClassName="min-h-0 p-3"
      >
        <FlowLegend />
      </Panel>
    </div>
  );
}
