/**
 * Geometry of the radial tire cross-section.
 *
 * All paths follow the same arch: bead seat → sidewall → shoulder → crown →
 * shoulder → sidewall → bead seat. Layers are stroked copies of that arch at
 * different offsets, which keeps every ply parallel by construction.
 */

export const CROSS_SECTION_VIEWBOX = '-200 40 480 320';

/** Outer rubber surface. */
export const PROFILE_OUTER =
  'M -150 328 C -168 262, -168 186, -146 138 C -132 108, -100 84, -60 76 ' +
  'C -40 72, -20 70, 0 70 C 20 70, 40 72, 60 76 C 100 84, 132 108, 146 138 ' +
  'C 168 186, 168 262, 150 328';

/** Mid-wall reference used for the body stroke. */
export const PROFILE_BODY =
  'M -136 328 C -152 262, -152 190, -132 144 C -119 116, -90 96, -54 89 ' +
  'C -36 85, -18 84, 0 84 C 18 84, 36 85, 54 89 C 90 96, 119 116, 132 144 ' +
  'C 152 190, 152 262, 136 328';

/** Carcass ply, running the full height of the wall. */
export const PROFILE_CARCASS =
  'M -124 328 C -138 262, -138 194, -120 150 C -108 124, -82 106, -50 100 ' +
  'C -33 97, -16 96, 0 96 C 16 96, 33 97, 50 100 C 82 106, 108 124, 120 150 ' +
  'C 138 194, 138 262, 124 328';

/** Inner liner, the innermost skin. */
export const PROFILE_LINER =
  'M -114 328 C -127 262, -127 197, -110 154 C -99 130, -75 111, -45 106 ' +
  'C -30 103, -15 102, 0 102 C 15 102, 30 103, 45 106 C 75 111, 99 130, 110 154 ' +
  'C 127 197, 127 262, 114 328';

/** Tread band — crown only. */
export const CROWN_TREAD =
  'M -142 140 C -128 110, -96 88, -56 80 C -37 76, -19 75, 0 75 ' +
  'C 19 75, 37 76, 56 80 C 96 88, 128 110, 142 140';

/** First steel belt ply — crown only. */
export const CROWN_BELT_OUTER =
  'M -128 146 C -116 118, -86 98, -50 91 C -33 88, -16 87, 0 87 ' +
  'C 16 87, 33 88, 50 91 C 86 98, 116 118, 128 146';

/** Second steel belt ply — crown only. */
export const CROWN_BELT_INNER =
  'M -123 151 C -112 123, -83 104, -48 97 C -32 94, -16 93, 0 93 ' +
  'C 16 93, 32 94, 48 97 C 83 104, 112 123, 123 151';

/** Left and right flanks, used to highlight the sidewalls. */
export const FLANK_LEFT = 'M -136 328 C -152 262, -152 190, -132 144';
export const FLANK_RIGHT = 'M 132 144 C 152 190, 152 262, 136 328';

export const BEAD_CENTERS: Array<{ x: number; y: number }> = [
  { x: -130, y: 314 },
  { x: 130, y: 314 },
];

/** Where each callout leader starts on the drawing. */
export const CALLOUT_ANCHORS: Record<string, { x: number; y: number }> = {
  tread: { x: 46, y: 77 },
  belt: { x: 86, y: 99 },
  carcass: { x: 112, y: 136 },
  liner: { x: 120, y: 210 },
  sidewall: { x: 148, y: 262 },
  bead: { x: 138, y: 312 },
};

/** Vertical position of each callout badge, all aligned on one column. */
export const CALLOUT_COLUMN_X = 236;
export const CALLOUT_ROWS: Record<string, number> = {
  tread: 84,
  belt: 130,
  carcass: 176,
  liner: 222,
  sidewall: 268,
  bead: 314,
};

/** Concentric radii of the front view used by the assembly sequence. */
export const BUILD_RADII: Record<string, { inner: number; outer: number }> = {
  liner: { inner: 22, outer: 26 },
  carcass: { inner: 26, outer: 31 },
  bead: { inner: 21, outer: 24 },
  sidewall: { inner: 31, outer: 36 },
  belt: { inner: 36, outer: 40 },
  tread: { inner: 40, outer: 45 },
};
