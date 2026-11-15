// Puffhop: a small round critter of TRAPPIST-1 e, about 0.7 m tall with its
// ears up. A fluffy peach body, long soft ears, big eyes, tiny feet and a
// cotton tail. It sits and twitches its ears, then hops away. Soft cartoon,
// the game's style.

import { TAU, animation, bar, loop, model, node, part, poses, rig, soft, sphere } from './kit.ts';
import type { Model, ModelEntry, Vec3 } from './kit.ts';
import { kindEyes } from './fauna-face.ts';

const FUR = soft('#ffc4a8', 0.5);
const FUR_LIGHT = soft('#fff1e6', 0.4);
const INNER = soft('#ff8fc4', 0.4);
const NOSE = soft('#e0567f', 0.4);

function create(): Model {
  const ear = (s: number) => node(`ear_${s > 0 ? 'l' : 'r'}`, { at: [s * 0.12, 0.2, -0.02], rot: [-10, 0, s * -12] },
    part(sphere(0.09, 0.6), FUR, { at: [0, 0.2, 0], scale: [0.9, 2.4, 0.55] }),
    part(sphere(0.06, 0.5), INNER, { at: [0, 0.2, 0.04], scale: [0.8, 2.2, 0.3] }));

  const head = node('head', { at: [0, 0.38, 0.12] },
    part(sphere(0.2, 0.8), FUR),
    part(sphere(0.12, 0.6), FUR_LIGHT, { at: [0, -0.07, 0.12], scale: [1.2, 0.8, 0.8] }),
    kindEyes([0, 0.03, 0.14], 0.17, 0.065),
    part(sphere(0.03, 0.4), NOSE, { at: [0, -0.04, 0.21] }),
    ear(1), ear(-1));

  const foot = (s: number, z: number): Vec3 => [s * 0.11, 0.04, z];
  const body = node('body', {},
    part(sphere(0.24, 0.8), FUR, { at: [0, 0.22, -0.02], scale: [1, 0.92, 1.1] }),
    part(sphere(0.17, 0.6), FUR_LIGHT, { at: [0, 0.17, 0.09], scale: [1, 1, 0.8] }),
    part(sphere(0.09, 0.5), FUR_LIGHT, { at: [0, 0.26, -0.27] }),
    ...[[1, 0.1], [-1, 0.1], [1, -0.12], [-1, -0.12]].map(([s, z]) => part(sphere(0.06, 0.5), FUR, { at: foot(s, z), scale: [1, 0.7, 1.4] })),
    bar([0.15, 0.14, 0.12], [0.1, 0.06, 0.16], 0.03, FUR),
    bar([-0.15, 0.14, 0.12], [-0.1, 0.06, 0.16], 0.03, FUR),
    head);

  const root = node('puffhop', {}, body);
  const { rot, mov, scl } = rig(root);
  const wave = (p: number, shift = 0) => Math.sin((p + shift) * TAU);

  const idle = animation('Idle', 3, [
    scl('body', loop((p) => [1, 1 + 0.03 * wave(p * 3), 1])),
    rot('head', loop((p) => [5 * wave(p, 0.2), 20 * wave(p), 0])),
    rot('ear_l', loop((p) => [0, 0, (p % 1 < 0.08 ? -25 : 0) * Math.sin(p * 40)])),
    rot('ear_r', loop((p) => [0, 0, ((p + 0.5) % 1 < 0.08 ? 25 : 0) * Math.sin(p * 40)])),
    scl('eyes', loop((p) => [1, (p + 0.3) % 1 < 0.05 ? 0.1 : 1, 1])),
  ]);

  // A hop: crouch, spring up and stretch, land and squash.
  const move = animation('Move', 0.6, [
    mov('body', poses([0, [0, 0, 0]], [0.12, [0, 0, 0]], [0.32, [0, 0.32, 0], 'out'], [0.5, [0, 0, 0], 'in'], [0.6, [0, 0, 0]])),
    scl('body', poses([0, [1.08, 0.88, 1.08]], [0.12, [1.1, 0.85, 1.1]], [0.2, [0.92, 1.12, 0.92]], [0.45, [0.96, 1.05, 0.96]], [0.52, [1.12, 0.84, 1.12]], [0.6, [1.08, 0.88, 1.08]])),
    rot('ear_l', poses([0, [0, 0, 0]], [0.2, [30, 0, 0]], [0.5, [-10, 0, 0]], [0.6, [0, 0, 0]])),
    rot('ear_r', poses([0, [0, 0, 0]], [0.2, [30, 0, 0]], [0.5, [-10, 0, 0]], [0.6, [0, 0, 0]])),
  ]);
  move.userData.loop = true;

  return model(root, [idle, move]);
}

export const puffhop: ModelEntry = { id: 'fauna-puffhop', name: 'Puffhop', type: 'fauna', create };
