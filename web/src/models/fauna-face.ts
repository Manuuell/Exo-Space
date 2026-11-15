// Kind cartoon faces for the peaceful fauna: big round eyes with a shine,
// in the soft style of the protagonist.

import { glow, node, part, soft, sphere } from './kit.ts';
import type { Vec3 } from './kit.ts';
import type * as THREE from 'three';

/**
 * A pair of big round eyes looking along +Z, `gap` apart, each `size` in
 * radius. The node is named `eyes`: scale its Y to blink.
 */
export function kindEyes(at: Vec3, gap: number, size: number, iris = '#2a2440'): THREE.Group {
  const eye = (s: number) => [
    part(sphere(size, 0.7), soft('#ffffff', 0.15), { at: [s * gap / 2, 0, 0] }),
    part(sphere(size * 0.62, 0.6), soft(iris, 0.5), { at: [s * gap / 2, -size * 0.05, size * 0.5], scale: [1, 1, 0.6] }),
    part(sphere(size * 0.2, 0.4), glow('#ffffff'), { at: [s * gap / 2 + size * 0.22, size * 0.25, size * 0.85], outline: false }),
  ];
  return node('eyes', { at }, ...eye(1), ...eye(-1));
}
