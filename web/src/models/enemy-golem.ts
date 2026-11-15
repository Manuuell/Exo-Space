// Crag Golem: planet fauna, living rock about 2.5 m tall. Huge fists on long
// arms, a small head sunk between boulder shoulders, glowing eyes, a glowing
// core in its chest and glowing cracks. It changes with the planet through
// the team's table (fauna.ts): mossy rock, basalt or ice; taller under low
// gravity, wider under high gravity; what glows takes the star's colour.

import { TAU, animation, block, light, loop, model, node, poses, rig, speckle, tint } from './kit.ts';
import type { Model, ModelEntry, Vec3 } from './kit.ts';
import type { PlanetLook } from './contract.ts';
import { CRACK_TALL, angryEyes, cracks, shades, teeth } from './beasts.ts';
import { faunaLook } from './fauna.ts';

function create(planet?: PlanetLook): Model {
  const look = faunaLook(planet);
  const { skin, skinDark, growth, claw } = look.palette;
  const G = look.glow;
  const W = look.wide;
  const legH = 0.75 * look.tall;
  const rock = shades(skin);

  const leg = (side: 'l' | 'r') => {
    const s = side === 'l' ? 1 : -1;
    return node(`leg_${side}`, { at: [0.3 * W * s, 0, 0] },
      block(0.4 * W, legH - 0.18, 0.44, skin, { at: [0, -(legH - 0.18) / 2, 0] }),
      block(0.46 * W, 0.2, 0.48, skinDark, { at: [0, -legH * 0.45, 0.02] }),
      block(0.5 * W, 0.2, 0.6, skinDark, { at: [0, -legH + 0.1, 0.06] }),
      ...light(0.05, 0.16, 0.02, G, { at: [0.08 * s, -legH * 0.7, 0.225] }, 1.5),
      ...speckle(rock, { box: [0.4 * W, legH - 0.18, 0.44], at: [0, -(legH - 0.18) / 2, 0], faces: 'lrf', count: 5, size: 0.08, seed: 3 + s }),
    );
  };

  const arm = (side: 'l' | 'r') => {
    const s = side === 'l' ? 1 : -1;
    return node(`arm_${side}`, { at: [0.78 * W * s, 0.85, 0], rot: [0, 0, 8 * s] },
      block(0.34, 0.6, 0.38, skin, { at: [0, -0.28, 0] }),
      ...light(0.03, 0.2, 0.05, G, { at: [0.17 * s, -0.3, 0.05] }, 1.5),
      ...speckle(rock, { box: [0.34, 0.6, 0.38], at: [0, -0.28, 0], faces: 'lrb', count: 4, size: 0.07, seed: 11 + s }),
      node(`fist_${side}`, { at: [0, -0.58, 0] },
        block(0.42, 0.48, 0.46, skinDark, { at: [0, -0.24, 0] }),
        block(0.56, 0.46, 0.56, skin, { at: [0, -0.62, 0.03] }),
        ...[-0.16, 0, 0.16].map((x) => block(0.08, 0.1, 0.12, claw, { at: [x, -0.55, 0.36] })),
        ...light(0.16, 0.04, 0.02, G, { at: [0, -0.7, 0.315] }, 1.5),
        ...speckle(rock, { box: [0.56, 0.46, 0.56], at: [0, -0.62, 0.03], faces: 'lrt', count: 5, size: 0.08, seed: 21 + s }),
      ),
    );
  };

  const head = node('head', { at: [0, 1.0, 0.22] },
    block(0.42, 0.36, 0.4, skin, { at: [0, 0.12, 0] }),
    block(0.5, 0.1, 0.16, skinDark, { at: [0, 0.24, 0.16], rot: [12, 0, 0] }),
    angryEyes('eyes', { at: [0, 0.13, 0.205], gap: 0.2, size: [0.1, 0.045], glow: G, brow: skinDark, tilt: 20 }),
    block(0.38, 0.12, 0.38, skinDark, { at: [0, -0.08, 0.03] }),
    ...teeth(-0.13, 0.13, 5, -0.02, 0.215, 0.035, claw, true),
    block(0.08, 0.2, 0.08, growth, { at: [0.17, 0.36, -0.05], rot: [0, 0, -15] }),
    block(0.08, 0.26, 0.08, tint(growth, 0.06), { at: [-0.15, 0.38, -0.08], rot: [0, 0, 12] }),
  );

  const torso = node('torso', { at: [0, 0.25, 0] },
    block(1.2 * W, 0.85, 0.8, skin, { at: [0, 0.5, 0] }),
    block(0.9 * W, 0.3, 0.6, skinDark, { at: [0, 0.05, 0.02] }),
    block(0.55, 0.5, 0.6, skin, { at: [0.72 * W, 0.85, 0], rot: [0, 0, 12] }),
    block(0.55, 0.5, 0.6, skin, { at: [-0.72 * W, 0.85, 0], rot: [0, 0, -12] }),
    block(0.9 * W, 0.45, 0.55, skinDark, { at: [0, 0.95, -0.22] }),
    ...speckle(rock, { box: [1.2 * W, 0.85, 0.8], at: [0, 0.5, 0], faces: 'lrb', count: 18, size: 0.09, seed: 5 }),
    ...speckle(shades(growth), { box: [1.2 * W, 0.1, 0.7], at: [0, 1.15, 0], faces: 't', count: 16, size: 0.12, seed: 9 }),
    ...[-0.25, 0, 0.25].map((x, i) => block(0.1, 0.3 + i * 0.08, 0.1, growth, { at: [x, 1.32, -0.3], rot: [-20, 0, x * 40] })),
    node('core', { at: [0, 0.55, 0.41] }, ...light(0.26, 0.26, 0.06, G, {}, 1.8)),
    cracks('crack_chest_l', CRACK_TALL, G, { at: [0.32 * W, 0.5, 0.401] }, 0.06),
    cracks('crack_chest_r', CRACK_TALL, G, { at: [-0.3 * W, 0.42, 0.401] }, 0.06),
    head,
    arm('l'),
    arm('r'),
  );

  const body = node('body', { at: [0, legH, 0] },
    block(0.8 * W, 0.32, 0.55, skinDark, { at: [0, 0.1, 0] }),
    torso,
    leg('l'),
    leg('r'),
  );

  const root = node('golem', { scale: look.size }, body);
  const { rot, mov, scl } = rig(root);
  const wave = (p: number, shift = 0) => Math.sin((p + shift) * TAU);
  const zero: Vec3 = [0, 0, 0];

  const idle = animation('Idle', 3, [
    mov('body', loop((p) => [0, 0.02 * wave(p), 0])),
    rot('torso', loop((p) => [1.5 * wave(p), 0, 2 * wave(p, 0.25)])),
    rot('head', loop((p) => [3 * wave(p, 0.3), 10 * wave(p, 0.1), 0])),
    rot('arm_l', loop((p) => [4 * wave(p, 0.2), 0, 2 * wave(p)])),
    rot('arm_r', loop((p) => [-4 * wave(p, 0.2), 0, -2 * wave(p)])),
    scl('core', loop((p) => 1 + 0.15 * wave(p * 2))),
    scl('eyes', loop((p) => 1 + 0.06 * wave(p * 2, 0.3))),
  ]);

  // A lumbering walk: heavy steps, the torso rolls, the fists swing.
  const move = animation('Move', 1.2, [
    rot('leg_l', loop((p) => [22 * wave(p), 0, 0])),
    rot('leg_r', loop((p) => [-22 * wave(p), 0, 0])),
    mov('body', loop((p) => [0, 0.05 * Math.abs(wave(p)), 0])),
    rot('torso', loop((p) => [4, 7 * wave(p), 4 * wave(p)])),
    rot('arm_l', loop((p) => [-18 * wave(p), 0, 0])),
    rot('arm_r', loop((p) => [18 * wave(p), 0, 0])),
  ]);

  // Overhead smash: both fists rise and hang there (the tell, from 0.3 s),
  // then come down on the ground in front at 1.05 s.
  const attack = animation('Attack', 2, [
    rot('arm_l', poses([0, zero], [0.3, zero], [0.9, [-165, 0, -10]], [1.05, [-55, 0, 0], 'snap'], [1.3, [-50, 0, 0]], [2, zero])),
    rot('arm_r', poses([0, zero], [0.3, zero], [0.9, [-165, 0, 10]], [1.05, [-55, 0, 0], 'snap'], [1.3, [-50, 0, 0]], [2, zero])),
    rot('fist_l', poses([0, zero], [0.9, [-20, 0, 0]], [1.05, [-10, 0, 0], 'snap'], [2, zero])),
    rot('fist_r', poses([0, zero], [0.9, [-20, 0, 0]], [1.05, [-10, 0, 0], 'snap'], [2, zero])),
    rot('torso', poses([0, zero], [0.3, zero], [0.9, [-15, 0, 0]], [1.05, [22, 0, 0], 'snap'], [1.3, [20, 0, 0]], [2, zero])),
    mov('body', poses([0, zero], [0.9, [0, 0.04, -0.08]], [1.05, [0, -0.14, 0.12], 'snap'], [1.3, [0, -0.12, 0.1]], [2, zero])),
    rot('head', poses([0, zero], [0.9, [-12, 0, 0]], [1.05, [10, 0, 0], 'snap'], [2, zero])),
    scl('core', poses([0, 1], [0.3, 1], [0.9, 1.5], [1.05, 1.7], [1.3, 1.2], [2, 1])),
    scl('eyes', poses([0, 1], [0.9, 1.4], [2, 1])),
  ]);

  const hit = animation('Hit', 0.6, [
    rot('torso', poses([0, zero], [0.1, [-10, 6, 0], 'snap'], [0.6, zero])),
    mov('body', poses([0, zero], [0.1, [0, 0, -0.12], 'snap'], [0.6, zero])),
    rot('head', poses([0, zero], [0.1, [-15, -10, 0], 'snap'], [0.6, zero])),
    scl('core', poses([0, 1], [0.1, 0.6, 'snap'], [0.6, 1])),
  ]);

  // It drops to its knees, then topples forward and goes dark.
  const die = animation('Die', 2.2, [
    mov('body', poses([0, zero], [0.6, [0, -legH * 0.55, 0.05]], [1.4, [0, -legH * 0.75, 0.35], 'in'], [2.2, [0, -legH * 0.75, 0.35]])),
    rot('torso', poses([0, zero], [0.6, [10, 0, 0]], [1.4, [70, 0, 4], 'in'], [1.55, [64, 0, 4], 'out'], [2.2, [66, 0, 4]])),
    rot('leg_l', poses([0, zero], [0.6, [-70, 0, 0]], [2.2, [-80, 0, 0]])),
    rot('leg_r', poses([0, zero], [0.6, [-70, 0, 0]], [2.2, [-80, 0, 0]])),
    rot('arm_l', poses([0, zero], [0.6, [-20, 0, 10]], [1.4, [-60, 0, 25]], [2.2, [-55, 0, 25]])),
    rot('arm_r', poses([0, zero], [0.6, [-20, 0, -10]], [1.4, [-60, 0, -25]], [2.2, [-55, 0, -25]])),
    rot('head', poses([0, zero], [1.4, [25, 0, 0]], [2.2, [30, 0, 0]])),
    scl('core', poses([0, 1], [1.2, 0.8], [2.2, 0.05])),
    scl('eyes', poses([0, 1], [1.4, 0.8], [2.2, 0.05])),
  ]);

  return model(root, [idle, move, attack, hit, die], {
    attacks: { Attack: { warn: 0.3, hit: 1.05, end: 1.3 } },
  });
}

export const golem: ModelEntry = { id: 'golem', name: 'Crag Golem', type: 'enemy', planetary: true, create };
