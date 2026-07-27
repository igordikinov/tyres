import {
  RIM_FILL,
  STATE_COLORS,
  TOKEN_CURED_BODY,
  TOKEN_CURED_RIM,
  TOKEN_UNCURED_BODY,
} from '@/core/constants';
import { useSimulationControls } from '@/state/SimulationContext';

const ENTRIES: Array<{ key: keyof typeof STATE_COLORS; label: string; hint: string }> = [
  { key: 'idle', label: 'Простой', hint: 'Ожидание работы' },
  { key: 'working', label: 'Работа', hint: 'Обработка изделий' },
  { key: 'blocked', label: 'Заблокирован', hint: 'Следующий этап заполнен' },
  { key: 'starved', label: 'Голодание', hint: 'Нет входных изделий' },
  { key: 'bottleneck', label: 'Узкое место', hint: 'Ограничение системы' },
];

const STAGES: Array<{ stage: number; label: string; hint: string }> = [
  { stage: 0, label: 'Зелёная', hint: 'До вулканизации' },
  { stage: 1, label: 'Вулканизированная', hint: 'После пресса' },
  { stage: 2, label: 'Ошипованная', hint: 'После ошиповки' },
];

/** Small static tire glyph mirroring the canvas token, tinted by the variant. */
function TokenGlyph({ stage, rim }: { stage: number; rim: string }) {
  const cured = stage >= 1;
  const studded = stage >= 2;
  return (
    <svg width={15} height={15} viewBox="-9 -9 18 18" className="shrink-0" aria-hidden="true">
      <circle r={8} fill={cured ? TOKEN_CURED_BODY : TOKEN_UNCURED_BODY} stroke={rim} strokeWidth={1.6} />
      {cured
        ? [0, 120, 240].map((angle) => (
            <line key={angle} x1={0} y1={-7.5} x2={0} y2={-5} stroke="#FFFFFF" strokeWidth={1.1} transform={`rotate(${angle})`} />
          ))
        : null}
      {studded
        ? [0, 90, 180, 270].map((angle) => (
            <circle key={angle} cx={0} cy={-5.6} r={1} fill={RIM_FILL} transform={`rotate(${angle})`} />
          ))
        : null}
      <circle r={3.2} fill="#FFFFFF" opacity={0.92} />
    </svg>
  );
}

export function StateLegend() {
  const { variantId, variants } = useSimulationControls();
  const rim = variants.find((variant) => variant.id === variantId)?.tokenColor ?? TOKEN_CURED_RIM;
  // Only the studded variant reaches the third appearance stage.
  const stages = variantId === 'winter-studded' ? STAGES : STAGES.slice(0, 2);

  return (
    <div className="px-3 py-3">
      <ul className="grid grid-cols-1 gap-1.5">
        {ENTRIES.map((entry) => (
          <li key={entry.key} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: STATE_COLORS[entry.key] }} />
            <span className="text-[11px] font-semibold text-ink-700">{entry.label}</span>
            <span className="truncate text-[10px] text-ink-400">{entry.hint}</span>
          </li>
        ))}
      </ul>

      <p className="label-caps mt-3 border-t border-line pt-2.5">Стадии шины</p>
      <ul className="mt-1.5 grid grid-cols-1 gap-1.5">
        {stages.map((stage) => (
          <li key={stage.stage} className="flex items-center gap-2">
            <TokenGlyph stage={stage.stage} rim={rim} />
            <span className="text-[11px] font-semibold text-ink-700">{stage.label}</span>
            <span className="truncate text-[10px] text-ink-400">{stage.hint}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
