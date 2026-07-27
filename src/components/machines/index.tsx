import { memo, type ComponentType } from 'react';
import type { MachineKind } from '@/core/types';
import { BufferMachine, InspectionMachine, PressMachine, WarehouseMachine } from './FinishingMachines';
import { AssemblyMachine, BeadMachine, CalenderMachine } from './FormingMachines';
import { ExtruderMachine, MixerMachine, RawMaterialMachine } from './PreparationMachines';
import type { MachineProps } from './parts';

// Partial: 'studding'/'studcheck' renderers land with the studded line (tyre-ag5.6).
// MachineArt already falls back to null for a kind without a drawing.
const REGISTRY: Partial<Record<MachineKind, ComponentType<MachineProps>>> = {
  raw: RawMaterialMachine,
  mixer: MixerMachine,
  extruder: ExtruderMachine,
  calender: CalenderMachine,
  bead: BeadMachine,
  assembly: AssemblyMachine,
  buffer: BufferMachine,
  press: PressMachine,
  inspection: InspectionMachine,
  warehouse: WarehouseMachine,
};

export interface MachineArtProps extends MachineProps {
  kind: MachineKind;
}

/**
 * Memoised so that 60 fps canvas updates never restart machine animations.
 * Every drawing is inline SVG — no raster assets are used anywhere.
 */
export const MachineArt = memo(function MachineArt({ kind, ...props }: MachineArtProps) {
  const Machine = REGISTRY[kind];
  if (!Machine) return null;
  return <Machine {...props} />;
});

export type { MachineProps };
