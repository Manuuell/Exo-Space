// Small pieces the voxel monsters share: angry glowing eyes, jagged rows of
// teeth and glowing cracks. Only details: every monster keeps its own
// silhouette, proportions and way of moving.

import { block, light, node, pixels, tint } from './kit.ts';
import type { Place, Vec3 } from './kit.ts';

/** A colour and three close shades, for specks and hide. */
export const shades = (colour: string): string[] => [colour, tint(colour, 0.05), tint(colour, -0.06), tint(colour, -0.12)];

export interface EyeOptions {
  at: Vec3;
  /** Distance between the centres of the two eyes. */
  gap: number;
  /** Width and height of one eye. */
  size: readonly [number, number];
  glow: string;
  brow: string;
  /** Brow angle in degrees; the inner ends go down. */
  tilt?: number;
}

/** Two glowing eyes under angry brows, as a node of their own (pulse it). */
export function angryEyes(name: string, options: EyeOptions): ReturnType<typeof node> {
  const [w, h] = options.size;
  const g = options.gap / 2;
  const tilt = options.tilt ?? 24;
  return node(name, { at: options.at },
    ...light(w, h, 0.03, options.glow, { at: [g, 0, 0] }),
    ...light(w, h, 0.03, options.glow, { at: [-g, 0, 0] }),
    block(w * 1.5, h * 0.9, 0.06, options.brow, { at: [g, h * 1.15, 0.01], rot: [0, 0, tilt] }),
    block(w * 1.5, h * 0.9, 0.06, options.brow, { at: [-g, h * 1.15, 0.01], rot: [0, 0, -tilt] }),
  );
}

/**
 * A jagged row of teeth across X, from one x to another, hanging down from
 * y (or standing up from it).
 */
export function teeth(from: number, to: number, count: number, y: number, z: number, size: number, colour: string, up = false) {
  return Array.from({ length: count }, (_, i) => {
    const x = count === 1 ? from : from + ((to - from) * i) / (count - 1);
    const h = size * (1.3 + (i % 2) * 0.7);
    return block(size, h, size, colour, { at: [x, up ? y + h / 2 : y - h / 2, z] });
  });
}

export const CRACK_WIDE = [
  '..c....c..',
  'c.cc..cc.c',
  '.c..cc..c.',
  '....c.....',
];

export const CRACK_TALL = [
  '.c.',
  'cc.',
  '.c.',
  '.cc',
  'c..',
  'cc.',
];

/** Glowing cracks drawn as pixels, facing +Z of their place. */
export function cracks(name: string, pattern: readonly string[], glow: string, place: Place, size: number) {
  return pixels(name, pattern, { c: glow }, { ...place, size, depth: size * 0.4, glow: 'c' });
}
