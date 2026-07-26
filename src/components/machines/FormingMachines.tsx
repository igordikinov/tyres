import { motion } from 'framer-motion';
import {
  METAL,
  METAL_DARK,
  OUTLINE,
  Plinth,
  Rotor,
  SHELL_DEEP,
  SHELL_SHADE,
  Shell,
  type MachineProps,
} from './parts';

/** 04 — Calender: a stack of rolls pressing rubber onto steel cord. */
export function CalenderMachine({ active, accent }: MachineProps) {
  const rolls = [-52, -28, -4];
  return (
    <g>
      <Plinth width={172} />
      <Shell x={-78} y={-70} width={22} height={84} radius={6} />
      <Shell x={56} y={-70} width={22} height={84} radius={6} />
      {rolls.map((cy, index) => (
        <Rotor
          key={cy}
          cx={0}
          cy={cy}
          radius={15}
          blades={4}
          active={active}
          duration={1.7}
          reverse={index % 2 === 1}
          accent={accent}
        />
      ))}
      <motion.line
        x1={-56}
        x2={56}
        y1={-16}
        y2={-16}
        stroke={accent}
        strokeWidth={2.6}
        strokeDasharray="10 8"
        strokeLinecap="round"
        initial={false}
        animate={active ? { strokeDashoffset: [0, -36] } : { strokeDashoffset: 0 }}
        transition={active ? { duration: 1.2, ease: 'linear', repeat: Infinity } : { duration: 0.3 }}
      />
      <rect x={-56} y={4} width={112} height={10} rx={4} fill={SHELL_DEEP} stroke={OUTLINE} strokeWidth={1.1} />
      <rect x={-18} y={7} width={36} height={4} rx={2} fill={METAL} opacity={0.6} />
    </g>
  );
}

/** 05 — Bead forming: wire spool winding a bead ring. */
export function BeadMachine({ active, accent }: MachineProps) {
  return (
    <g>
      <Plinth width={168} />
      <Shell x={-80} y={-52} width={44} height={66} radius={8}>
        <circle cx={-58} cy={-24} r={13} fill={SHELL_SHADE} stroke={OUTLINE} strokeWidth={1.2} />
        <motion.circle
          cx={-58}
          cy={-24}
          r={6}
          fill={accent}
          initial={false}
          animate={active ? { scale: [1, 0.72, 1] } : { scale: 1 }}
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          transition={active ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
        />
      </Shell>
      <motion.line
        x1={-36}
        x2={12}
        y1={-30}
        y2={-30}
        stroke={METAL}
        strokeWidth={2}
        strokeDasharray="5 5"
        initial={false}
        animate={active ? { strokeDashoffset: [0, -20] } : { strokeDashoffset: 0 }}
        transition={active ? { duration: 0.8, ease: 'linear', repeat: Infinity } : { duration: 0.3 }}
      />
      <g>
        <circle cx={38} cy={-30} r={30} fill="none" stroke={OUTLINE} strokeWidth={1.4} />
        <motion.g
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          initial={false}
          animate={{ rotate: active ? 360 : 0 }}
          transition={active ? { duration: 2.8, ease: 'linear', repeat: Infinity } : { duration: 0.4 }}
        >
          <circle cx={38} cy={-30} r={22} fill="none" stroke={accent} strokeWidth={5} strokeDasharray="12 7" />
        </motion.g>
        <circle cx={38} cy={-30} r={7} fill={METAL_DARK} />
      </g>
      <path d="M 8 14 L 68 14 L 62 0 L 14 0 Z" fill={SHELL_DEEP} stroke={OUTLINE} strokeWidth={1.2} strokeLinejoin="round" />
    </g>
  );
}

/** 06 — Tire building machine: the drum where the green tire is assembled. */
export function AssemblyMachine({ active, accent }: MachineProps) {
  return (
    <g>
      <Plinth width={176} />
      <Shell x={-84} y={-58} width={30} height={72} radius={7} />
      <Shell x={54} y={-58} width={30} height={72} radius={7} />
      <rect x={-54} y={-36} width={108} height={12} rx={6} fill={SHELL_DEEP} stroke={OUTLINE} strokeWidth={1.1} />
      <g>
        <ellipse cx={0} cy={-30} rx={40} ry={30} fill={SHELL_SHADE} stroke={OUTLINE} strokeWidth={1.4} />
        <motion.g
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          initial={false}
          animate={{ rotate: active ? 360 : 0 }}
          transition={active ? { duration: 2.2, ease: 'linear', repeat: Infinity } : { duration: 0.4 }}
        >
          <g>
            {[0, 45, 90, 135].map((angle) => (
              <line
                key={angle}
                x1={-32}
                x2={32}
                y1={-30}
                y2={-30}
                stroke={accent}
                strokeWidth={2.4}
                strokeLinecap="round"
                opacity={0.55}
                transform={`rotate(${angle} 0 -30)`}
              />
            ))}
            <ellipse cx={0} cy={-30} rx={24} ry={18} fill="none" stroke={accent} strokeWidth={4} />
          </g>
        </motion.g>
        <ellipse cx={0} cy={-30} rx={8} ry={6} fill={METAL_DARK} />
      </g>
      <motion.rect
        x={-6}
        y={-72}
        width={12}
        height={16}
        rx={3}
        fill={accent}
        initial={false}
        animate={active ? { y: [-72, -66, -72] } : { y: -72 }}
        transition={active ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
      />
      <rect x={-40} y={6} width={80} height={8} rx={4} fill={METAL} opacity={0.45} />
    </g>
  );
}
