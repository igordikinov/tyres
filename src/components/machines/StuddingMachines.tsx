import { motion } from 'framer-motion';
import {
  METAL,
  METAL_DARK,
  OUTLINE,
  Plinth,
  SHELL_DEEP,
  SHELL_SHADE,
  Shell,
  WHITE,
  type MachineProps,
} from './parts';

/** Rubber of the cured tire being studded. */
const RUBBER = '#2A2F37';
/** Radius of the tire drawn on the positioner. */
const TIRE_R = 30;
/** Studs pressed around the tread, drawn as dots on the rotating ring. */
const STUD_COUNT = 12;

/** 10 — Studding: a cured tire spins on a positioner while a pneumatic head presses studs. */
export function StuddingMachine({ active, accent }: MachineProps) {
  const studs = Array.from({ length: STUD_COUNT }, (_, index) => {
    const angle = (index / STUD_COUNT) * Math.PI * 2;
    return { cx: Math.cos(angle) * (TIRE_R - 4), cy: Math.sin(angle) * (TIRE_R - 4) };
  });

  return (
    <g>
      <Plinth width={182} />

      {/* Stud hopper feeding the head from the upper left. */}
      <g transform="translate(-64 -74)">
        <path
          d="M -24 0 L 24 0 L 13 28 L -13 28 Z"
          fill={SHELL_SHADE}
          stroke={OUTLINE}
          strokeWidth={1.3}
          strokeLinejoin="round"
        />
        {[-12, -4, 4, 12, -8, 0, 8].map((cx, index) => (
          <circle key={index} cx={cx} cy={6 + (index % 2) * 7} r={2.4} fill={METAL} />
        ))}
        <rect x={-3} y={26} width={6} height={30} fill={SHELL_DEEP} stroke={OUTLINE} strokeWidth={1} />
      </g>

      {/* Rotating tire on the positioner. */}
      <g transform="translate(0 -6)">
        <motion.g
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          initial={false}
          animate={{ rotate: active ? 360 : 0 }}
          transition={active ? { duration: 3.4, ease: 'linear', repeat: Infinity } : { duration: 0.4 }}
        >
          <circle cx={0} cy={0} r={TIRE_R} fill={RUBBER} stroke={OUTLINE} strokeWidth={1.4} />
          <circle cx={0} cy={0} r={TIRE_R - 11} fill={WHITE} stroke={OUTLINE} strokeWidth={1.2} />
          {studs.map((stud, index) => (
            <circle key={index} cx={stud.cx} cy={stud.cy} r={2.2} fill={accent} />
          ))}
        </motion.g>
        {/* Mandrel the tire sits on. */}
        <rect x={-6} y={TIRE_R - 4} width={12} height={20} rx={2} fill={METAL} stroke={OUTLINE} strokeWidth={1} />
      </g>

      {/* Pneumatic press head pulsing down onto the tread. */}
      <motion.g
        initial={false}
        animate={active ? { y: [0, 9, 0] } : { y: 0 }}
        transition={active ? { duration: 1.1, ease: 'easeInOut', repeat: Infinity } : { duration: 0.3 }}
      >
        <rect x={-14} y={-70} width={28} height={26} rx={5} fill={SHELL_DEEP} stroke={OUTLINE} strokeWidth={1.3} />
        <rect x={-5} y={-44} width={10} height={12} rx={2} fill={METAL_DARK} />
        <circle cx={0} cy={-31} r={3} fill={accent} />
      </motion.g>
    </g>
  );
}

/** 11 — Stud check: a probe gauges each stud's protrusion above the tread. */
export function StudCheckMachine({ active, accent }: MachineProps) {
  return (
    <g>
      <Plinth width={158} />
      <Shell x={-70} y={-64} width={16} height={78} radius={5} />
      <Shell x={54} y={-64} width={16} height={78} radius={5} />
      <rect x={-70} y={-70} width={140} height={12} rx={5} fill={SHELL_DEEP} stroke={OUTLINE} strokeWidth={1.2} />

      {/* Dial reading out the protrusion. */}
      <g transform="translate(44 -40)">
        <circle cx={0} cy={0} r={13} fill={WHITE} stroke={OUTLINE} strokeWidth={1.3} />
        <motion.line
          x1={0}
          y1={0}
          x2={0}
          y2={-9}
          stroke={accent}
          strokeWidth={1.8}
          strokeLinecap="round"
          style={{ transformBox: 'fill-box', transformOrigin: 'bottom' }}
          initial={false}
          animate={active ? { rotate: [-30, 34, -30] } : { rotate: 0 }}
          transition={active ? { duration: 2.2, ease: 'easeInOut', repeat: Infinity } : { duration: 0.4 }}
        />
      </g>

      {/* Probe dipping onto a stud to measure how far it stands proud. */}
      <motion.g
        initial={false}
        animate={active ? { y: [0, 12, 0] } : { y: 0 }}
        transition={active ? { duration: 1.8, ease: 'easeInOut', repeat: Infinity } : { duration: 0.3 }}
      >
        <rect x={-4} y={-58} width={8} height={34} rx={2} fill={METAL} stroke={OUTLINE} strokeWidth={1} />
        <path d="M -5 -24 L 5 -24 L 0 -14 Z" fill={accent} />
      </motion.g>

      {/* Tread strip with a proud stud under the probe. */}
      <rect x={-40} y={2} width={80} height={12} rx={4} fill={RUBBER} stroke={OUTLINE} strokeWidth={1.1} />
      <rect x={-2} y={-4} width={4} height={7} rx={1} fill={METAL} />
    </g>
  );
}
