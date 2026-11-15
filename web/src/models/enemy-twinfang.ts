// Twinfang: planet fauna, a lean two-headed hound with long legs, a mane of
// spines, a ring of bone spikes round its necks and glowing ribs. It pounces
// and bites with both heads. About 1.6 m tall at the heads and 2.4 m long.
// It changes with the planet through the team's table (fauna.ts).

import { TAU, animation, block, light, loop, model, node, poses, rig, speckle } from './kit.ts';
import type { Model, ModelEntry, Vec3 } from './kit.ts';
import type { PlanetLook } from './contract.ts';
import { angryEyes, shades, teeth } from './beasts.ts';
import { faunaLook } from './fauna.ts';

function create(planet?: PlanetLook): Model {
  const look = faunaLook(planet);
  const { skin, skinDark, belly, spine, claw } = look.palette;
  const G = look.glow;
  const W = look.wide;
  const legH = 0.7 * look.tall;
  const hide = shades(skin);

  const tip = (at: Vec3, size: number) =>
    look.family === 'lava' ? light(size, size * 1.4, size, G, { at }, 1.5) : [block(size, size * 1.4, size, claw, { at })];

  const neck = (side: 'l' | 'r') => {
    const s = side === 'l' ? 1 : -1;
    return node(`neck_${side}`, { at: [0.16 * W * s, 0.22, 0.6], rot: [-10, 20 * s, 0] },
      block(0.2, 0.22, 0.38, skin, { at: [0, 0, 0.18] }),
      ...[0.05, 0.2].map((z) => block(0.06, 0.12, 0.06, spine, { at: [0, 0.15, z], rot: [-30, 0, 0] })),
      node(`head_${side}`, { at: [0, 0.02, 0.38] },
        block(0.3, 0.26, 0.32, skin, { at: [0, 0.02, 0.1] }),
        block(0.22, 0.15, 0.28, skinDark, { at: [0, -0.03, 0.36] }),
        block(0.08, 0.05, 0.03, '#161416', { at: [0, 0.04, 0.505] }),
        block(0.06, 0.18, 0.06, spine, { at: [0.1, 0.2, -0.02], rot: [-20, 0, -10] }),
        block(0.06, 0.18, 0.06, spine, { at: [-0.1, 0.2, -0.02], rot: [-20, 0, 10] }),
        angryEyes(`eyes_${side}`, { at: [0, 0.08, 0.265], gap: 0.16, size: [0.07, 0.035], glow: G, brow: skinDark, tilt: 26 }),
        ...teeth(-0.08, 0.08, 5, -0.105, 0.47, 0.025, claw),
        block(0.03, 0.09, 0.03, claw, { at: [0.09, -0.15, 0.42] }),
        block(0.03, 0.09, 0.03, claw, { at: [-0.09, -0.15, 0.42] }),
        block(0.18, 0.03, 0.28, '#5a1a1a', { at: [0, -0.1, 0.33] }),
        node(`jaw_${side}`, { at: [0, -0.1, 0.12] },
          block(0.2, 0.07, 0.36, skinDark, { at: [0, -0.03, 0.18] }),
          ...teeth(-0.07, 0.07, 4, 0.005, 0.33, 0.022, claw, true)),
      ),
    );
  };

  const leg = (name: string, x: number, z: number, back: boolean) => {
    const drop = legH + 0.02;
    return node(name, { at: [x, -0.18, z] },
      block((back ? 0.2 : 0.17) * W, back ? 0.36 : drop * 0.55, back ? 0.28 : 0.2, skin, { at: [0, back ? -0.12 : -drop * 0.275, back ? -0.03 : 0] }),
      block(0.13 * W, drop * 0.5, 0.15, skinDark, { at: [0, -drop * 0.7, 0.02] }),
      block(0.2 * W, 0.08, 0.24, skinDark, { at: [0, -drop + 0.04, 0.05] }),
      ...[-0.06, 0, 0.06].map((cx) => block(0.04, 0.04, 0.07, claw, { at: [cx * W, -drop + 0.025, 0.19] })),
    );
  };

  const body = node('body', { at: [0, legH + 0.2, 0] },
    block(0.62 * W, 0.62, 0.55, skin, { at: [0, 0.08, 0.35] }),
    block(0.52 * W, 0.5, 0.55, skinDark, { at: [0, 0, -0.1] }),
    block(0.48 * W, 0.42, 0.45, skin, { at: [0, 0.02, -0.5] }),
    block(0.42 * W, 0.1, 0.9, belly, { at: [0, -0.24, 0] }),
    // Glowing ribs on both flanks.
    ...[-0.25, -0.1, 0.05].flatMap((rz) => [
      ...light(0.02, 0.32, 0.04, G, { at: [0.265 * W, 0, rz] }, 1.4),
      ...light(0.02, 0.32, 0.04, G, { at: [-0.265 * W, 0, rz] }, 1.4),
    ]),
    // A double mane of spines down the back.
    ...[0, 1, 2, 3, 4, 5].flatMap((i) => {
      const mz = 0.55 - i * 0.19;
      const h = 0.26 - i * 0.025;
      return [0.12, -0.12].flatMap((mx) => [
        block(0.08, h, 0.08, spine, { at: [mx * W, 0.42 + h / 2 - 0.05, mz], rot: [-35, 0, 0] }),
        ...tip([mx * W, 0.42 + h - 0.02, mz - h * 0.4], 0.04),
      ]);
    }),
    // A ring of bone spikes round the necks.
    block(0.68 * W, 0.14, 0.32, claw, { at: [0, 0.2, 0.62] }),
    ...[-0.3, -0.15, 0, 0.15, 0.3].map((cx) => block(0.05, 0.16, 0.05, claw, { at: [cx * W, 0.33, 0.66], rot: [20, 0, cx * 60] })),
    ...speckle(hide, { box: [0.62 * W, 0.62, 0.55], at: [0, 0.08, 0.35], faces: 'lr', count: 8, size: 0.06, seed: 31 }),
    ...speckle(hide, { box: [0.48 * W, 0.42, 0.45], at: [0, 0.02, -0.5], faces: 'lrb', count: 6, size: 0.06, seed: 37 }),
    neck('l'),
    neck('r'),
    leg('leg_fl', 0.22 * W, 0.38, false),
    leg('leg_fr', -0.22 * W, 0.38, false),
    leg('leg_bl', 0.2 * W, -0.5, true),
    leg('leg_br', -0.2 * W, -0.5, true),
    node('tail', { at: [0, 0.12, -0.72], rot: [-25, 0, 0] },
      block(0.09, 0.09, 0.55, skin, { at: [0, 0, -0.27] }),
      node('tail_tip', { at: [0, 0, -0.55] },
        block(0.07, 0.07, 0.4, skinDark, { at: [0, 0, -0.2] }),
        ...tip([0, 0, -0.44], 0.06))),
  );

  const root = node('twinfang', { scale: look.size }, body);
  const { rot, mov, scl } = rig(root);
  const wave = (p: number, shift = 0) => Math.sin((p + shift) * TAU);
  const zero: Vec3 = [0, 0, 0];

  const idle = animation('Idle', 2.4, [
    scl('body', loop((p) => [1 + 0.012 * wave(p), 1 + 0.02 * wave(p), 1])),
    rot('neck_l', loop((p) => [3 * wave(p, 0.2), 9 * wave(p), 0])),
    rot('neck_r', loop((p) => [3 * wave(p, 0.7), 9 * wave(p, 0.5), 0])),
    rot('jaw_l', loop((p) => [4 + 4 * wave(p * 2), 0, 0])),
    rot('jaw_r', loop((p) => [4 + 4 * wave(p * 2, 0.5), 0, 0])),
    rot('tail', loop((p) => [0, 12 * wave(p), 0])),
    scl('eyes_l', loop((p) => 1 + 0.08 * wave(p * 2))),
    scl('eyes_r', loop((p) => 1 + 0.08 * wave(p * 2, 0.5))),
  ]);

  // A bounding gallop: front legs together, back legs together.
  const move = animation('Move', 0.6, [
    rot('leg_fl', loop((p) => [32 * wave(p), 0, 0])),
    rot('leg_fr', loop((p) => [32 * wave(p, 0.05), 0, 0])),
    rot('leg_bl', loop((p) => [-32 * wave(p), 0, 0])),
    rot('leg_br', loop((p) => [-32 * wave(p, 0.05), 0, 0])),
    rot('body', loop((p) => [5 * wave(p), 0, 0])),
    mov('body', loop((p) => [0, 0.06 * Math.abs(wave(p)), 0])),
    rot('neck_l', loop((p) => [-6 * wave(p), 8, 0])),
    rot('neck_r', loop((p) => [-6 * wave(p), -8, 0])),
    rot('tail', loop((p) => [10 * wave(p), 0, 0])),
  ]);

  // The tell: it crouches with both jaws open (0.2–0.6 s), then leaps and
  // both heads bite at 0.88 s.
  const attack = animation('Attack', 1.5, [
    mov('body', poses([0, zero], [0.2, zero], [0.6, [0, -0.14, -0.1]], [0.85, [0, 0.25, 0.9], 'out'], [1.0, [0, 0, 0.85], 'in'], [1.5, zero])),
    rot('body', poses([0, zero], [0.6, [6, 0, 0]], [0.85, [-10, 0, 0]], [1.0, [4, 0, 0]], [1.5, zero])),
    rot('leg_fl', poses([0, zero], [0.6, [-20, 0, 0]], [0.85, [-50, 0, 0]], [1.0, [10, 0, 0]], [1.5, zero])),
    rot('leg_fr', poses([0, zero], [0.6, [-20, 0, 0]], [0.85, [-50, 0, 0]], [1.0, [10, 0, 0]], [1.5, zero])),
    rot('leg_bl', poses([0, zero], [0.6, [15, 0, 0]], [0.85, [40, 0, 0]], [1.0, [0, 0, 0]], [1.5, zero])),
    rot('leg_br', poses([0, zero], [0.6, [15, 0, 0]], [0.85, [40, 0, 0]], [1.0, [0, 0, 0]], [1.5, zero])),
    rot('neck_l', poses([0, zero], [0.6, [12, 6, 0]], [0.88, [8, 0, 0], 'snap'], [1.5, zero])),
    rot('neck_r', poses([0, zero], [0.6, [12, -6, 0]], [0.88, [8, 0, 0], 'snap'], [1.5, zero])),
    rot('jaw_l', poses([0, zero], [0.2, zero], [0.6, [34, 0, 0]], [0.88, zero, 'snap'], [1.5, zero])),
    rot('jaw_r', poses([0, zero], [0.2, zero], [0.6, [34, 0, 0]], [0.88, zero, 'snap'], [1.5, zero])),
    scl('eyes_l', poses([0, 1], [0.6, 1.35], [1.5, 1])),
    scl('eyes_r', poses([0, 1], [0.6, 1.35], [1.5, 1])),
  ]);

  const hit = animation('Hit', 0.5, [
    mov('body', poses([0, zero], [0.08, [0, 0.02, -0.15], 'snap'], [0.5, zero])),
    rot('neck_l', poses([0, zero], [0.08, [-20, 15, 0], 'snap'], [0.5, zero])),
    rot('neck_r', poses([0, zero], [0.08, [-20, -15, 0], 'snap'], [0.5, zero])),
    rot('tail', poses([0, zero], [0.1, [0, 25, 0], 'snap'], [0.5, zero])),
  ]);

  const down = -(legH + 0.2) + 0.32 * look.wide;
  const die = animation('Die', 1.8, [
    rot('body', poses([0, zero], [0.3, [-8, 0, 0]], [1.0, [0, 0, -86], 'in'], [1.15, [0, 0, -80], 'out'], [1.8, [0, 0, -83]])),
    mov('body', poses([0, zero], [1.0, [0, down, 0], 'in'], [1.8, [0, down, 0]])),
    rot('neck_l', poses([0, zero], [1.1, [30, 20, 0]], [1.8, [35, 20, 0]])),
    rot('neck_r', poses([0, zero], [1.1, [20, -30, 0]], [1.8, [25, -30, 0]])),
    rot('jaw_l', poses([0, zero], [1.8, [22, 0, 0]])),
    rot('jaw_r', poses([0, zero], [1.8, [18, 0, 0]])),
    rot('leg_fr', poses([0, zero], [1.1, [35, 0, 20]], [1.8, [30, 0, 15]])),
    rot('leg_br', poses([0, zero], [1.1, [-35, 0, 20]], [1.8, [-30, 0, 15]])),
    scl('eyes_l', poses([0, 1], [1.0, 1], [1.8, 0.1])),
    scl('eyes_r', poses([0, 1], [1.0, 1], [1.8, 0.1])),
  ]);

  return model(root, [idle, move, attack, hit, die], {
    attacks: { Attack: { warn: 0.2, hit: 0.88, end: 1.05 } },
  });
}

export const twinfang: ModelEntry = { id: 'twinfang', name: 'Twinfang', type: 'enemy', planetary: true, create };
