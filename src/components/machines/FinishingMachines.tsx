import { motion } from 'framer-motion';
import bufferRack from '@/assets/img/machines/buffer-rack.png';
import warehouseRack from '@/assets/img/machines/warehouse-rack.png';
import { serviceOffset } from '@/core/layout';
import {
  METAL,
  OUTLINE,
  Plinth,
  SHELL_DEEP,
  SHELL_SHADE,
  Shell,
  Steam,
  WHITE,
  type MachineProps,
} from './parts';

/** Shared rack render box — matches MachineImage so the nodes line up with the row. */
const RACK_X = -84;
const RACK_Y = -66;
const RACK_W = 168;
const RACK_H = 112;

/** Opacity ramp shared by the buffer and warehouse racks (empty ghost → full). */
function rackOpacity(fill: number): number {
  return 0.2 + 0.8 * Math.min(Math.max(fill, 0), 1);
}

/** 07 — Green tire buffer: the real storage rack, intensifying as the queue fills. */
export function BufferMachine({ stock, queueCapacity, accent }: MachineProps) {
  const cap = Math.max(queueCapacity, 1);
  const fill = Math.min(Math.max(stock, 0) / cap, 1);
  return (
    <g>
      <ellipse cx={0} cy={RACK_Y + RACK_H - 3} rx={RACK_W * 0.32} ry={10} fill={accent} opacity={0.14 * fill} />
      <image
        href={bufferRack}
        x={RACK_X}
        y={RACK_Y}
        width={RACK_W}
        height={RACK_H}
        preserveAspectRatio="xMidYMax meet"
        opacity={rackOpacity(fill)}
        style={{ transition: 'opacity 0.4s ease' }}
      />
    </g>
  );
}

/** 08 — Vulcanisation: one press module is drawn per available press. */
export function PressMachine({ active, accent, slots }: MachineProps) {
  const presses = Array.from({ length: Math.max(1, slots) }, (_, index) =>
    serviceOffset(index, Math.max(1, slots)),
  );
  const minX = Math.min(...presses.map((p) => p.x));
  const maxX = Math.max(...presses.map((p) => p.x));
  const minY = Math.min(...presses.map((p) => p.y));
  const maxY = Math.max(...presses.map((p) => p.y));

  return (
    <g>
      <Plinth width={Math.max(120, maxX - minX + 76)} />
      <rect
        x={minX - 26}
        y={minY - 18}
        width={maxX - minX + 52}
        height={maxY - minY + 38}
        rx={10}
        fill={SHELL_SHADE}
        stroke={OUTLINE}
        strokeWidth={1.3}
      />
      {presses.map((offset, index) => (
        <g key={index} transform={`translate(${offset.x} ${offset.y})`}>
          <rect x={-13} y={4} width={26} height={7} rx={2.5} fill={SHELL_DEEP} stroke={OUTLINE} strokeWidth={1} />
          <motion.rect
            x={-13}
            y={-15}
            width={26}
            height={7}
            rx={2.5}
            fill={accent}
            initial={false}
            animate={active ? { y: [-15, -9, -9, -15] } : { y: -15 }}
            transition={
              active
                ? { duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: index * 0.18 }
                : { duration: 0.3 }
            }
          />
          <line x1={-15} x2={-15} y1={-16} y2={11} stroke={METAL} strokeWidth={2} strokeLinecap="round" />
          <line x1={15} x2={15} y1={-16} y2={11} stroke={METAL} strokeWidth={2} strokeLinecap="round" />
          <Steam x={0} y={-18} active={active} delay={index * 0.24} />
        </g>
      ))}
    </g>
  );
}

/** 09 — Inspection: scanning gantry with a sweeping sensor head. */
export function InspectionMachine({ active, accent }: MachineProps) {
  return (
    <g>
      <Plinth width={170} />
      <Shell x={-80} y={-66} width={18} height={80} radius={5} />
      <Shell x={62} y={-66} width={18} height={80} radius={5} />
      <rect x={-80} y={-72} width={160} height={12} rx={5} fill={SHELL_DEEP} stroke={OUTLINE} strokeWidth={1.2} />
      <motion.g
        initial={false}
        animate={active ? { x: [-42, 42, -42] } : { x: 0 }}
        transition={active ? { duration: 2.6, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.4 }}
      >
        <rect x={-16} y={-60} width={32} height={16} rx={4} fill={WHITE} stroke={OUTLINE} strokeWidth={1.3} />
        <rect x={-9} y={-55} width={18} height={6} rx={3} fill={accent} />
        <motion.path
          d="M -12 -44 L 12 -44 L 20 6 L -20 6 Z"
          fill={accent}
          initial={false}
          animate={active ? { opacity: [0.05, 0.22, 0.05] } : { opacity: 0 }}
          transition={active ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
        />
      </motion.g>
      <rect x={-62} y={2} width={124} height={12} rx={5} fill={SHELL_DEEP} stroke={OUTLINE} strokeWidth={1.1} />
      <line x1={-56} x2={56} y1={8} y2={8} stroke={METAL} strokeWidth={1.6} strokeDasharray="6 6" opacity={0.6} />
    </g>
  );
}

/** 10 — Finished goods warehouse: the real storage rack, filling as output completes. */
export function WarehouseMachine({ fill }: MachineProps) {
  return (
    <image
      href={warehouseRack}
      x={RACK_X}
      y={RACK_Y}
      width={RACK_W}
      height={RACK_H}
      preserveAspectRatio="xMidYMax meet"
      opacity={rackOpacity(fill)}
      style={{ transition: 'opacity 0.4s ease' }}
    />
  );
}
