import type { MachineKind } from '@/core/types';
import assembly from '@/assets/img/machines/assembly.png';
import bead from '@/assets/img/machines/bead.png';
import calender from '@/assets/img/machines/calender.png';
import extruder from '@/assets/img/machines/extruder.png';
import inspection from '@/assets/img/machines/inspection.png';
import mixer from '@/assets/img/machines/mixer.png';
import press from '@/assets/img/machines/press.png';
import raw from '@/assets/img/machines/raw.png';
import restStack from '@/assets/img/machines/rest-rack.png';
import studcheck from '@/assets/img/machines/studcheck.png';
import studding from '@/assets/img/machines/studding.png';

/**
 * Realistic equipment renders for the process stations. Buffer and warehouse
 * are intentionally absent — those keep their SVG art so live stock still fills.
 */
export const MACHINE_IMAGES: Partial<Record<MachineKind, string>> = {
  raw,
  mixer,
  extruder,
  calender,
  bead,
  assembly,
  press,
  inspection,
  studding,
  studcheck,
  reststack: restStack,
};
