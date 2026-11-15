// Friendly faces for the NPCs. They share the detailed voxel style of the
// enemies (team decision, 2026-11-14), so the face is what tells them apart
// from a monster: pixel eyes with a sparkle, kind brows that rise in the
// middle, blush and a smile; never teeth or angry brows. The eyes are one
// node, so squashing it on Y is a blink. Every species keeps its own head
// and body.

import type * as THREE from 'three';
import { block, light, node } from './kit.ts';
import type { Vec3 } from './kit.ts';

export interface PixelFaceOptions {
  /** Centre of the eyes, on the front surface of the head. */
  at: Vec3;
  /** Size of one face pixel, in metres. */
  px: number;
  /** Distance between the centres of the eyes, in pixels. */
  gap: number;
  eye?: string;
  brow?: string;
  blush?: string;
  mouth?: string;
  /** Where the smile goes instead, for species with a snout or a beak. */
  mouthAt?: Vec3;
}

export function pixelFace(options: PixelFaceOptions): THREE.Object3D[] {
  const p = options.px;
  const [x, y, z] = options.at;
  const g = (options.gap * p) / 2;
  const eye = options.eye ?? '#1b1d33';
  const [mx, my, mz] = options.mouthAt ?? [x, y - p * 3.2, z];
  const parts: THREE.Object3D[] = [
    node('eyes', { at: [x, y, z] },
      ...[1, -1].flatMap((s) => [
        block(p * 2, p * 2.6, p * 0.6, eye, { at: [g * s, 0, p * 0.3] }),
        ...light(p * 0.9, p * 0.9, p * 0.3, '#ffffff', { at: [g * s + p * 0.5, p * 0.8, p * 0.66] }, 1),
      ])),
    ...[1, -1].map((s) => block(p * 1.6, p * 0.8, p * 0.3, options.blush ?? '#ff8fae', { at: [x + (g + p * 2.2) * s, y - p * 1.8, z + p * 0.15] })),
    // A smile: the corners one pixel up.
    ...[[-1.5, 0.5], [-0.5, 0], [0.5, 0], [1.5, 0.5]].map(([dx, dy]) =>
      block(p, p * 0.8, p * 0.5, options.mouth ?? '#6a2c25', { at: [mx + dx * p, my + dy * p, mz + p * 0.25] })),
  ];
  if (options.brow) {
    // Kind brows: the inner ends higher than the outer ones.
    parts.push(...[1, -1].map((s) => block(p * 2.2, p * 0.6, p * 0.5, options.brow!, { at: [x + g * s, y + p * 2.1, z + p * 0.25], rot: [0, 0, -10 * s] })));
  }
  return parts;
}

/** Blinks once near a moment of a loop: the Y scale of the eyes node. */
export function blink(phase: number, at = 0.9): Vec3 {
  const d = Math.abs(phase - at);
  return [1, d < 0.04 ? 0.1 + (d / 0.04) * 0.9 : 1, 1];
}
