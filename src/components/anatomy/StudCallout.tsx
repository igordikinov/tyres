import {
  CANVAS_INK,
  CANVAS_MUTED,
  RIM_FILL,
  RUBBER_BODY,
  RUBBER_OUTER,
  STUD_CALLOUT_HEIGHT,
  STUD_CALLOUT_WIDTH,
  STUD_PROTRUSION_MM,
  STUD_PROTRUSION_TOLERANCE_MM,
  VARIANT_COLORS,
} from '@/core/constants';

const STEEL = VARIANT_COLORS['winter-studded'];
/** Tread surface line in the callout, in viewBox units. */
const SURFACE_Y = 96;

/**
 * Zoomed cross-section of a stud seated in the tread. Shows the carbide tip
 * standing 1.2 mm proud of the tread, the steel/aluminium body and the flange
 * that holds it in the rubber — and that the hole is moulded, not drilled.
 */
export function StudCallout() {
  const w = STUD_CALLOUT_WIDTH;
  const cx = w * 0.42;

  return (
    <figure className="mt-3 rounded-xl border border-line bg-surface p-3">
      <figcaption className="label-caps mb-1">Анатомия шипа</figcaption>
      <svg
        viewBox={`0 0 ${w} ${STUD_CALLOUT_HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label="Разрез шипа противоскольжения в отверстии протектора"
      >
        {/* Tread rubber block with the moulded hole. */}
        <rect x={12} y={SURFACE_Y} width={w - 24} height={STUD_CALLOUT_HEIGHT - SURFACE_Y - 14} rx={6} fill={RUBBER_BODY} stroke={RUBBER_OUTER} strokeWidth={1.4} />
        <line x1={12} y1={SURFACE_Y} x2={w - 12} y2={SURFACE_Y} stroke={RIM_FILL} strokeWidth={1} opacity={0.5} />

        {/* Flange anchoring the body in the rubber. */}
        <rect x={cx - 22} y={150} width={44} height={12} rx={3} fill={STEEL} stroke={CANVAS_INK} strokeWidth={1} />
        {/* Steel / aluminium body. */}
        <rect x={cx - 12} y={112} width={24} height={40} rx={3} fill={STEEL} stroke={CANVAS_INK} strokeWidth={1} />
        {/* Carbide insert standing proud of the tread. */}
        <rect x={cx - 6} y={SURFACE_Y - 18} width={12} height={40} rx={2} fill={RIM_FILL} stroke={CANVAS_INK} strokeWidth={1} />

        {/* Protrusion dimension above the tread surface. */}
        <line x1={cx + 30} y1={SURFACE_Y} x2={cx + 30} y2={SURFACE_Y - 18} stroke={CANVAS_MUTED} strokeWidth={1} />
        <line x1={cx + 26} y1={SURFACE_Y} x2={cx + 34} y2={SURFACE_Y} stroke={CANVAS_MUTED} strokeWidth={1} />
        <line x1={cx + 26} y1={SURFACE_Y - 18} x2={cx + 34} y2={SURFACE_Y - 18} stroke={CANVAS_MUTED} strokeWidth={1} />
        <text x={cx + 40} y={SURFACE_Y - 5} fontSize={11} fontWeight={700} fill={CANVAS_INK}>
          {`${STUD_PROTRUSION_MM.toString().replace('.', ',')} мм ±${STUD_PROTRUSION_TOLERANCE_MM.toString().replace('.', ',')}`}
        </text>

        {/* Leader labels. */}
        <text x={cx + 40} y={130} fontSize={10} fill={CANVAS_MUTED}>Корпус · сталь А12/А20 или алюминий</text>
        <text x={cx + 40} y={159} fontSize={10} fill={CANVAS_MUTED}>Фланец удерживает шип</text>
        <text x={12} y={SURFACE_Y - 24} fontSize={10} fontWeight={700} fill={CANVAS_INK}>Твердосплавная вставка ВК6/ВК8</text>
      </svg>
      <p className="mt-1 text-[10px] leading-snug text-ink-400">
        Отверстия под шипы формуются штифтами пресс-формы при вулканизации, а не сверлятся.
      </p>
    </figure>
  );
}
