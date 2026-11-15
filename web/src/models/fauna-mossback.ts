// Mossback: the gentle grazer of TRAPPIST-1 e's meadows, about 3.4 m tall
// at the head. A round periwinkle body with a cream belly, a back covered in
// moss and little pink flowers, a row of glowing spots, four stubby legs, a
// long neck and a small round head with big kind eyes and leafy ear-fronds.
// It walks in herds and grazes. Soft cartoon, the game's style.

import { TAU, animation, bar, glow, loop, model, node, part, rig, soft, sphere, tube } from './kit.ts';
import type { Model, ModelEntry, Vec3 } from './kit.ts';
import { kindEyes } from './fauna-face.ts';

const HIDE = soft('#8fa8ff', 0.45);
const HIDE_DARK = soft('#6f86e0', 0.35);
const BELLY = soft('#fff1d6', 0.3);
const MOSS = soft('#6fbf4e', 0.35);
const MOSS_DARK = soft('#4f9a3c', 0.3);
const HOOF = soft('#4a3f5a', 0.3);
const FLOWER = ['#ff8fc4', '#ffd23f', '#ffffff'];
const HIP = 1.45;

function create(): Model {
  const leg = (name: string, at: Vec3) => node(name, { at },
    bar([0, 0, 0], [0, -HIP + 0.36, 0], 0.3, HIDE_DARK),
    part(sphere(0.34, 0.6), HOOF, { at: [0, -HIP + 0.28, 0.04], scale: [1, 0.8, 1.1] }));

  // Moss and flowers on the back.
  const back = Array.from({ length: 7 }, (_, k) => {
    const a = (k / 7) * TAU;
    const x = Math.sin(a) * 0.55;
    const z = Math.cos(a) * 0.8 - 0.1;
    return [
      part(sphere(0.42, 0.5), k % 2 ? MOSS : MOSS_DARK, { at: [x, 1.0, z], scale: [1, 0.45, 1] }),
      part(sphere(0.1, 0.4), soft(FLOWER[k % 3], 0.5), { at: [x * 1.1, 1.18, z * 1.05] }),
    ];
  }).flat();

  const head = node('head', { at: [0, 1.55, 0.35] },
    part(sphere(0.55, 0.9), HIDE, { scale: [1, 0.92, 1.05] }),
    part(sphere(0.34, 0.7), BELLY, { at: [0, -0.18, 0.38], scale: [1.1, 0.75, 0.8] }),
    kindEyes([0, 0.1, 0.36], 0.46, 0.17),
    // Leafy ear-fronds.
    ...[1, -1].map((s) => node(`ear_${s > 0 ? 'l' : 'r'}`, { at: [s * 0.42, 0.3, -0.05], rot: [0, 0, s * -40] },
      part(sphere(0.3, 0.5), MOSS, { at: [0, 0.22, 0], scale: [0.45, 1, 0.25] }))),
    part(sphere(0.05, 0.3), soft('#2a2440', 0.3), { at: [0.1, -0.25, 0.6] }),
    part(sphere(0.05, 0.3), soft('#2a2440', 0.3), { at: [-0.1, -0.25, 0.6] }));

  // The neck grows from the top front of the body (the body's node is its centre).
  const neck = node('neck', { at: [0, 0.4, 1.15], rot: [-10, 0, 0] },
    part(tube([[0, 0, 0], [0, 0.6, 0.15], [0, 1.2, 0.25], [0, 1.5, 0.3]], 0.3, 0.6), HIDE),
    head);

  const body = node('body', { at: [0, 2.0, 0] },
    part(sphere(1.25, 1), HIDE, { scale: [1, 0.85, 1.35] }),
    part(sphere(1.0, 0.8), BELLY, { at: [0, -0.35, 0.1], scale: [0.95, 0.7, 1.25] }),
    ...back,
    ...Array.from({ length: 5 }, (_, k) => part(sphere(0.09, 0.4), glow('#7ff7e0'), { at: [0, 0.8 - Math.abs(k - 2) * 0.08, 0.9 - k * 0.45], outline: false })),
    node('tail', { at: [0, 0.1, -1.6], rot: [30, 0, 0] },
      bar([0, 0, 0], [0, 0, -0.55], 0.16, HIDE_DARK),
      part(sphere(0.2, 0.5), MOSS, { at: [0, 0, -0.7] })),
    neck,
    leg('leg_fl', [0.65, -0.55, 0.85]), leg('leg_fr', [-0.65, -0.55, 0.85]),
    leg('leg_bl', [0.65, -0.55, -0.85]), leg('leg_br', [-0.65, -0.55, -0.85]),
  );

  const root = node('mossback', {}, body);
  const { rot, mov, scl } = rig(root);
  const wave = (p: number, shift = 0) => Math.sin((p + shift) * TAU);

  // Breathing, a slow look around and a dip of the head to graze.
  const idle = animation('Idle', 4, [
    scl('body', loop((p) => [1 + 0.015 * wave(p * 2), 1 + 0.02 * wave(p * 2), 1])),
    rot('neck', loop((p) => [38 * Math.max(0, wave(p, 0.6)) ** 2, 12 * wave(p), 0])),
    rot('head', loop((p) => [-14 * Math.max(0, wave(p, 0.6)) ** 2, 0, 6 * wave(p, 0.3)])),
    rot('tail', loop((p) => [0, 18 * wave(p * 2), 0])),
    rot('ear_l', loop((p) => [0, 0, 10 * wave(p * 2)])),
    rot('ear_r', loop((p) => [0, 0, -10 * wave(p * 2, 0.2)])),
    scl('eyes', loop((p) => [1, (p + 0.1) % 0.5 < 0.04 ? 0.1 : 1, 1])),
  ]);

  // An easy walk: legs in diagonal pairs, a bob and a nod.
  const move = animation('Move', 1.4, [
    rot('leg_fl', loop((p) => [26 * wave(p), 0, 0])),
    rot('leg_br', loop((p) => [26 * wave(p), 0, 0])),
    rot('leg_fr', loop((p) => [-26 * wave(p), 0, 0])),
    rot('leg_bl', loop((p) => [-26 * wave(p), 0, 0])),
    mov('body', loop((p) => [0, 0.06 * wave(p * 2), 0])),
    rot('body', loop((p) => [0, 0, 2.5 * wave(p)])),
    rot('neck', loop((p) => [6 * wave(p * 2, 0.2), 0, 0])),
    rot('tail', loop((p) => [0, 22 * wave(p), 0])),
  ]);

  return model(root, [idle, move]);
}

export const mossback: ModelEntry = { id: 'fauna-mossback', name: 'Mossback', type: 'fauna', create };
