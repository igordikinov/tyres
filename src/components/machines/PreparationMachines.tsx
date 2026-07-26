import { motion } from 'framer-motion';
import {
  Belt,
  Louvers,
  METAL,
  METAL_DARK,
  OUTLINE,
  Plinth,
  Rotor,
  SHELL_DEEP,
  SHELL_SHADE,
  WHITE,
  Shell,
  type MachineProps,
} from './parts';

/** 01 — Raw material intake: palletised compound bales. */
export function RawMaterialMachine({ active, accent }: MachineProps) {
  const bales = [0, 1, 2];
  return (
    <g>
      <Plinth width={150} />
      {bales.map((row) => (
        <g key={row} transform={`translate(0 ${-row * 20})`}>
          <path
            d="M -52 -6 L -41 -17 L 52 -17 L 41 -6 Z"
            fill={SHELL_SHADE}
            stroke={OUTLINE}
            strokeWidth={1.2}
            strokeLinejoin="round"
          />
          <rect x={-52} y={-6} width={93} height={17} rx={3} fill={WHITE} stroke={OUTLINE} strokeWidth={1.3} />
          <rect x={-46} y={-2} width={26} height={4} rx={2} fill={row === 2 ? accent : SHELL_DEEP} />
        </g>
      ))}
      <motion.g
        initial={false}
        animate={active ? { opacity: [0.25, 1, 0.25] } : { opacity: 0.25 }}
        transition={active ? { duration: 2.2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
      >
        <path d="M 62 -24 L 78 -14 L 62 -4" fill="none" stroke={accent} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      </motion.g>
      <rect x={-56} y={11} width={112} height={5} rx={2.5} fill={METAL} opacity={0.5} />
    </g>
  );
}

/** 02 — Internal mixer with two counter-rotating rotors. */
export function MixerMachine({ active, accent }: MachineProps) {
  return (
    <g>
      <Plinth width={170} />
      <path
        d="M -30 -76 L 30 -76 L 20 -58 L -20 -58 Z"
        fill={SHELL_SHADE}
        stroke={OUTLINE}
        strokeWidth={1.3}
        strokeLinejoin="round"
      />
      <motion.rect
        x={-7}
        y={-70}
        width={14}
        height={10}
        rx={2}
        fill={accent}
        initial={false}
        animate={active ? { opacity: [0.2, 0.9, 0.2] } : { opacity: 0.2 }}
        transition={active ? { duration: 1.6, repeat: Infinity } : { duration: 0.3 }}
      />
      <Shell x={-72} y={-58} width={144} height={72} radius={10}>
        <rect x={-62} y={-50} width={124} height={44} rx={8} fill={SHELL_SHADE} stroke={OUTLINE} strokeWidth={1.2} />
      </Shell>
      <Rotor cx={-28} cy={-28} radius={19} blades={3} active={active} duration={2.1} accent={accent} />
      <Rotor cx={28} cy={-28} radius={19} blades={3} active={active} duration={2.1} reverse accent={accent} />
      <Louvers x={-62} y={-2} width={124} rows={2} />
      <rect x={-14} y={6} width={28} height={8} rx={3} fill={METAL_DARK} opacity={0.75} />
    </g>
  );
}

/** 03 — Extruder: screw barrel, die head and take-away conveyor. */
export function ExtruderMachine({ active, accent }: MachineProps) {
  const screws = [0, 1, 2, 3, 4, 5];
  return (
    <g>
      <Plinth width={176} />
      <Shell x={-80} y={-62} width={104} height={38} radius={19} />
      <g clipPath="url(#extruder-barrel)">
        <motion.g
          initial={false}
          animate={active ? { x: [0, 17] } : { x: 0 }}
          transition={active ? { duration: 0.9, ease: 'linear', repeat: Infinity } : { duration: 0.3 }}
        >
          {screws.map((index) => (
            <path
              key={index}
              d={`M ${-84 + index * 17} -58 L ${-74 + index * 17} -28`}
              stroke={accent}
              strokeWidth={2.6}
              strokeLinecap="round"
              opacity={0.85}
            />
          ))}
        </motion.g>
      </g>
      <defs>
        <clipPath id="extruder-barrel">
          <rect x={-80} y={-62} width={104} height={38} rx={19} />
        </clipPath>
      </defs>
      <Shell x={24} y={-68} width={38} height={50} radius={8} />
      <rect x={30} y={-58} width={26} height={6} rx={3} fill={accent} />
      <path d="M 62 -46 L 74 -46 L 74 -12 L 62 -12 Z" fill={SHELL_DEEP} stroke={OUTLINE} strokeWidth={1.2} />
      <Belt x1={-76} x2={78} y={2} active={active} accent={accent} />
      <rect x={-14} y={8} width={28} height={6} rx={3} fill={METAL} opacity={0.55} />
    </g>
  );
}
