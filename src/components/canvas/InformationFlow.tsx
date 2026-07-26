import { motion } from 'framer-motion';
import { INFO_BUS_OFFSET, INFO_FLOW, STATION_HEIGHT } from '@/core/constants';
import type { NodeDef } from '@/core/types';

const HALF_H = STATION_HEIGHT / 2;
const BUS_MARGIN = 60;
const LABEL_OFFSET = 10;

export interface InformationFlowProps {
  nodes: NodeDef[];
  canvasWidth: number;
}

/**
 * The schedule travelling from the APS engine down to every resource, drawn as
 * a dashed bus under each row so it never competes with the material flow.
 */
export function InformationFlow({ nodes, canvasWidth }: InformationFlowProps) {
  const rows = Array.from(new Set(nodes.map((node) => node.y)));

  return (
    <g pointerEvents="none">
      {rows.map((rowY) => {
        const busY = rowY + HALF_H + INFO_BUS_OFFSET;
        const rowNodes = nodes.filter((node) => node.y === rowY);
        return (
          <g key={rowY}>
            <motion.line
              x1={BUS_MARGIN}
              x2={canvasWidth - BUS_MARGIN}
              y1={busY}
              y2={busY}
              stroke={INFO_FLOW}
              strokeWidth={1.8}
              strokeDasharray="9 7"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.75, strokeDashoffset: [0, -32] }}
              transition={{
                opacity: { duration: 0.3 },
                strokeDashoffset: { duration: 1.6, ease: 'linear', repeat: Infinity },
              }}
            />
            <text
              x={BUS_MARGIN}
              y={busY + 16}
              fontSize={11}
              fontWeight={700}
              letterSpacing={1.4}
              fill={INFO_FLOW}
              opacity={0.85}
            >
              INFORMATION FLOW
            </text>
            {rowNodes.map((node) => (
              <g key={node.id}>
                <line
                  x1={node.x}
                  x2={node.x}
                  y1={rowY + HALF_H}
                  y2={busY}
                  stroke={INFO_FLOW}
                  strokeWidth={1.4}
                  strokeDasharray="4 4"
                  opacity={0.7}
                />
                <circle cx={node.x} cy={busY} r={3.2} fill={INFO_FLOW} opacity={0.85} />
              </g>
            ))}
          </g>
        );
      })}
      <text
        x={canvasWidth - BUS_MARGIN}
        y={rows[0] + HALF_H + INFO_BUS_OFFSET - LABEL_OFFSET}
        textAnchor="end"
        fontSize={11}
        fontWeight={600}
        fill={INFO_FLOW}
        opacity={0.7}
      >
        finite schedule → resources
      </text>
    </g>
  );
}
