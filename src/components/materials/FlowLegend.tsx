import {
  BRAND_500,
  BUFFER_TINT,
  CANVAS_INK,
  CANVAS_LINE,
  CANVAS_SURFACE,
  INFO_FLOW,
  STATE_COLORS,
} from '@/core/constants';

const CHAIN = ['Смешивание', 'Компоненты', 'Сборка', 'Буфер', 'Вулканизация', 'Контроль', 'Склад'];
const BUFFER_INDEX = 3;
const STEP = 190;
const BOX_WIDTH = 140;
const BOX_HEIGHT = 44;
const BASE_Y = 120;
const BUS_Y = 44;

/** Material flow versus information flow, in the language of the shop floor. */
export function FlowLegend() {
  const width = STEP * (CHAIN.length - 1) + BOX_WIDTH + 40;

  return (
    <svg viewBox={`0 0 ${width} 190`} className="h-full w-full" aria-labelledby="flow-legend-title">
      <title id="flow-legend-title">Поток материалов и поток информации</title>

      <text x={20} y={BUS_Y - 12} fontSize={12} fontWeight={700} letterSpacing={1.4} fill={INFO_FLOW}>
        ПОТОК ИНФОРМАЦИИ · ПЛАН APS
      </text>
      <line
        x1={20}
        x2={width - 20}
        y1={BUS_Y}
        y2={BUS_Y}
        stroke={INFO_FLOW}
        strokeWidth={2}
        strokeDasharray="8 6"
      />

      {CHAIN.map((label, index) => {
        const x = 20 + index * STEP;
        const isBuffer = index === BUFFER_INDEX;
        return (
          <g key={label}>
            <line
              x1={x + BOX_WIDTH / 2}
              x2={x + BOX_WIDTH / 2}
              y1={BUS_Y}
              y2={BASE_Y}
              stroke={INFO_FLOW}
              strokeWidth={1.6}
              strokeDasharray="5 5"
            />
            <rect
              x={x}
              y={BASE_Y}
              width={BOX_WIDTH}
              height={BOX_HEIGHT}
              rx={10}
              fill={isBuffer ? BUFFER_TINT : CANVAS_SURFACE}
              stroke={isBuffer ? STATE_COLORS.working : CANVAS_LINE}
              strokeWidth={isBuffer ? 2 : 1.4}
            />
            <text
              x={x + BOX_WIDTH / 2}
              y={BASE_Y + 27}
              textAnchor="middle"
              fontSize={14}
              fontWeight={600}
              fill={CANVAS_INK}
            >
              {label}
            </text>
            {index < CHAIN.length - 1 ? (
              <g>
                <line
                  x1={x + BOX_WIDTH}
                  x2={x + STEP - 12}
                  y1={BASE_Y + BOX_HEIGHT / 2}
                  y2={BASE_Y + BOX_HEIGHT / 2}
                  stroke={BRAND_500}
                  strokeWidth={3}
                />
                <path
                  d={`M ${x + STEP - 12} ${BASE_Y + BOX_HEIGHT / 2 - 6} L ${x + STEP} ${BASE_Y + BOX_HEIGHT / 2} L ${x + STEP - 12} ${BASE_Y + BOX_HEIGHT / 2 + 6} Z`}
                  fill={BRAND_500}
                />
              </g>
            ) : null}
          </g>
        );
      })}

      <text x={20} y={BASE_Y + BOX_HEIGHT + 26} fontSize={12} fontWeight={700} letterSpacing={1.4} fill={BRAND_500}>
        ПОТОК МАТЕРИАЛОВ
      </text>
      <text
        x={20 + BUFFER_INDEX * STEP}
        y={BASE_Y + BOX_HEIGHT + 26}
        fontSize={12}
        fontWeight={700}
        letterSpacing={1.4}
        fill={STATE_COLORS.working}
      >
        БУФЕР ЗАЩИЩАЕТ ОГРАНИЧЕНИЕ
      </text>
    </svg>
  );
}
