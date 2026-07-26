import { STATE_COLORS } from '@/core/constants';

const ENTRIES: Array<{ key: keyof typeof STATE_COLORS; label: string; hint: string }> = [
  { key: 'idle', label: 'Простой', hint: 'Ожидание работы' },
  { key: 'working', label: 'Работа', hint: 'Обработка изделий' },
  { key: 'blocked', label: 'Заблокирован', hint: 'Следующий этап заполнен' },
  { key: 'starved', label: 'Голодание', hint: 'Нет входных изделий' },
  { key: 'bottleneck', label: 'Узкое место', hint: 'Ограничение системы' },
];

export function StateLegend() {
  return (
    <ul className="grid grid-cols-1 gap-1.5 px-3 py-3">
      {ENTRIES.map((entry) => (
        <li key={entry.key} className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: STATE_COLORS[entry.key] }}
          />
          <span className="text-[11px] font-semibold text-ink-700">{entry.label}</span>
          <span className="truncate text-[10px] text-ink-400">{entry.hint}</span>
        </li>
      ))}
    </ul>
  );
}
