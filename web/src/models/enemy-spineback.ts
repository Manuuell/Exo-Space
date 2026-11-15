// Spineback: planet fauna, a four-legged dragon-lizard with a row of spines,
// glowing eyes and glowing cracks along its flanks. Detailed voxel style.
// It changes with the planet through the team's table (fauna.ts): moss on
// temperate worlds, basalt and lava on hot ones, ice on cold ones; taller and
// lighter under low gravity, shorter and wider under high gravity; whatever
// glows takes the star's colour. About 1.3 m tall and 2.6 m long.

import { TAU, animation, block, light, loop, model, node, pixels, poses, rig, speckle, tint } from './kit.ts';
import type { Model, ModelEntry, Vec3 } from './kit.ts';
import type { PlanetLook } from './contract.ts';
import { faunaLook } from './fauna.ts';

const CRACK = [
  '...c........',
  'c..cc...c...',
  '.cc..c.cc.c.',
  '......c...cc',
];

function create(planet?: PlanetLook): Model {
  const look = faunaLook(planet);
  const { skin, skinDark, belly, spine, growth, claw } = look.palette;
  const T = look.tall;
  const W = look.wide;
  const glowColour = look.glow;
  const legLength = 0.55 * T;
  const hide = [skin, skinDark, tint(skin, 0.05), tint(skin, -0.06)];

  /** The tip of a spine: it glows on lava worlds, it is crystal on ice. */
  const tip = (at: Vec3, size: number) =>
    look.family === 'lava' ? light(size, size * 1.4, size, glowColour, { at }, 1.6)
      : [block(size, size * 1.4, size, look.family === 'ice' ? growth : tint(spine, -0.05), { at })];

  const leg = (name: string, x: number, z: number, front: boolean) => {
    const drop = legLength + 0.1;
    return node(name, { at: [x, -0.15, z] },
      block(0.26 * W, 0.22, 0.3, skin, { at: [0, -0.04, 0] }),
      block(0.2 * W, drop - 0.12, 0.22, front ? skin : skinDark, { at: [0, -(drop - 0.12) / 2, 0] }),
      block(0.27 * W, 0.12, 0.32, skinDark, { at: [0, -drop + 0.06, 0.04] }),
      ...[-0.08, 0, 0.08].map((cx) => block(0.05, 0.05, 0.08, claw, { at: [cx * W, -drop + 0.03, 0.22] })),
      ...speckle(hide, { box: [0.2 * W, drop - 0.12, 0.22], at: [0, -(drop - 0.12) / 2, 0], faces: 'lrf', count: 4, size: 0.05, seed: x * 10 + z }),
    );
  };

  const eyes = node('eyes', {},
    ...light(0.09, 0.06, 0.03, glowColour, { at: [0.13 * W, 0.19, 0.475] }),
    ...light(0.09, 0.06, 0.03, glowColour, { at: [-0.13 * W, 0.19, 0.475] }),
  );

  const head = node('head', { at: [0, 0.1, 0.62] },
    block(0.5 * W, 0.36, 0.5, skin, { at: [0, 0.08, 0.22] }),
    block(0.38 * W, 0.2, 0.36, skin, { at: [0, 0.0, 0.55] }),
    block(0.3 * W, 0.04, 0.3, skinDark, { at: [0, 0.11, 0.56] }),
    block(0.04, 0.03, 0.02, skinDark, { at: [0.08, 0.07, 0.735] }),
    block(0.04, 0.03, 0.02, skinDark, { at: [-0.08, 0.07, 0.735] }),
    // Angry brows: the inner ends lower.
    block(0.2, 0.06, 0.1, skinDark, { at: [0.13 * W, 0.255, 0.45], rot: [0, 0, 22] }),
    block(0.2, 0.06, 0.1, skinDark, { at: [-0.13 * W, 0.255, 0.45], rot: [0, 0, -22] }),
    eyes,
    // Horns sweeping back.
    block(0.09, 0.09, 0.2, spine, { at: [0.2 * W, 0.28, 0.08], rot: [-30, 0, 0] }),
    block(0.09, 0.09, 0.2, spine, { at: [-0.2 * W, 0.28, 0.08], rot: [-30, 0, 0] }),
    block(0.06, 0.06, 0.15, claw, { at: [0.22 * W, 0.37, -0.04], rot: [-45, 0, 0] }),
    block(0.06, 0.06, 0.15, claw, { at: [-0.22 * W, 0.37, -0.04], rot: [-45, 0, 0] }),
    // Upper teeth and the inside of the mouth.
    ...[-0.12, -0.06, 0, 0.06, 0.12].map((tx) => block(0.035, 0.06, 0.035, claw, { at: [tx * W, -0.12, 0.66] })),
    ...[0.5, 0.58].flatMap((tz) => [
      block(0.035, 0.05, 0.035, claw, { at: [0.15 * W, -0.11, tz] }),
      block(0.035, 0.05, 0.035, claw, { at: [-0.15 * W, -0.11, tz] }),
    ]),
    block(0.3 * W, 0.04, 0.4, '#5a1a1a', { at: [0, -0.11, 0.45] }),
    ...speckle(hide, { box: [0.5 * W, 0.36, 0.5], at: [0, 0.08, 0.22], faces: 'lrt', count: 6, size: 0.05, seed: 77 }),
    node('jaw', { at: [0, -0.1, 0.18] },
      block(0.36 * W, 0.12, 0.52, skinDark, { at: [0, -0.06, 0.26] }),
      block(0.3 * W, 0.04, 0.4, belly, { at: [0, -0.125, 0.24] }),
      ...[-0.1, -0.03, 0.04, 0.11].map((tx) => block(0.035, 0.05, 0.035, claw, { at: [tx * W, 0.02, 0.46] })),
    ),
  );

  const spines = node('spines', { at: [0, 0.3, 0] },
    ...[0, 1, 2, 3, 4].flatMap((i) => {
      const z = 0.45 - i * 0.25;
      const h = (0.38 - Math.abs(i - 1.5) * 0.05) * T;
      return [
        block(0.16, h * 0.4, 0.2, spine, { at: [0, h * 0.2, z], rot: [-15, 0, 0] }),
        block(0.11, h * 0.35, 0.14, tint(spine, 0.05), { at: [0, h * 0.55, z - 0.06], rot: [-15, 0, 0] }),
        ...tip([0, h * 0.82, z - 0.12], 0.06),
      ];
    }),
  );

  const tail = node('tail', { at: [0, 0.05, -0.65] },
    block(0.36 * W, 0.3, 0.5, skin, { at: [0, 0, -0.25] }),
    block(0.1, 0.12, 0.14, spine, { at: [0, 0.2, -0.2] }),
    ...speckle(hide, { box: [0.36 * W, 0.3, 0.5], at: [0, 0, -0.25], faces: 'lrt', count: 5, size: 0.05, seed: 13 }),
    node('tail_tip', { at: [0, -0.02, -0.5] },
      block(0.22 * W, 0.2, 0.5, skinDark, { at: [0, 0, -0.25] }),
      block(0.08, 0.1, 0.12, spine, { at: [0, 0.14, -0.2] }),
      block(0.1, 0.1, 0.25, spine, { at: [0, 0.02, -0.58] }),
      ...tip([0, 0.02, -0.73], 0.05),
    ),
  );

  const body = node('body', { at: [0, legLength + 0.25, 0] },
    block(0.7 * W, 0.5, 1.3, skin),
    block(0.6 * W, 0.12, 1.1, belly, { at: [0, -0.24, 0] }),
    block(0.5 * W, 0.1, 1.2, skinDark, { at: [0, 0.28, 0] }),
    ...speckle(hide, { box: [0.7 * W, 0.5, 1.3], faces: 'lr', count: 18, size: 0.07, seed: 5 }),
    ...speckle([growth, tint(growth, -0.08), tint(growth, 0.08)], { box: [0.5 * W, 0.1, 1.2], at: [0, 0.28, 0], faces: 't', count: 12, size: 0.09, seed: 9 }),
    pixels('crack_l', CRACK, { c: glowColour }, { at: [0.35 * W + 0.001, 0.02, 0], rot: [0, 90, 0], size: 0.06, depth: 0.02, glow: 'c' }),
    pixels('crack_r', CRACK, { c: glowColour }, { at: [-0.35 * W - 0.001, 0.02, 0], rot: [0, -90, 0], size: 0.06, depth: 0.02, glow: 'c' }),
    spines,
    head,
    tail,
    leg('leg_fl', 0.3 * W, 0.4, true),
    leg('leg_fr', -0.3 * W, 0.4, true),
    leg('leg_bl', 0.3 * W, -0.4, false),
    leg('leg_br', -0.3 * W, -0.4, false),
  );

  const root = node('spineback', { scale: look.size }, body);
  const { rot, mov, scl } = rig(root);
  const wave = (p: number, shift = 0) => Math.sin((p + shift) * TAU);
  const zero: Vec3 = [0, 0, 0];

  const idle = animation('Idle', 2.4, [
    mov('body', loop((p) => [0, 0.012 * wave(p), 0])),
    scl('body', loop((p) => [1 + 0.015 * wave(p), 1 + 0.025 * wave(p), 1])),
    rot('head', loop((p) => [4 * wave(p, 0.2), 12 * wave(p, 0.1), 0])),
    rot('jaw', loop((p) => [3 + 3 * wave(p * 2), 0, 0])),
    rot('tail', loop((p) => [0, 10 * wave(p), 0])),
    rot('tail_tip', loop((p) => [0, 15 * wave(p, -0.15), 0])),
    scl('eyes', loop((p) => 1 + 0.08 * wave(p * 2))),
  ]);

  // A trot: diagonal pairs of legs swing together, the body bobs twice.
  const move = animation('Move', 0.7, [
    rot('leg_fl', loop((p) => [28 * wave(p), 0, 0])),
    rot('leg_br', loop((p) => [28 * wave(p), 0, 0])),
    rot('leg_fr', loop((p) => [-28 * wave(p), 0, 0])),
    rot('leg_bl', loop((p) => [-28 * wave(p), 0, 0])),
    mov('body', loop((p) => [0, 0.035 * Math.abs(wave(p)), 0])),
    rot('body', loop((p) => [0, 0, 3 * wave(p)])),
    rot('head', loop((p) => [-4 * wave(p * 2), 0, -3 * wave(p)])),
    rot('tail', loop((p) => [0, 14 * wave(p), 0])),
    rot('tail_tip', loop((p) => [0, 18 * wave(p, -0.2), 0])),
  ]);

  // The tell: it rears back with its jaw wide open (0.2–0.6 s), then lunges
  // and snaps shut at 0.72 s.
  const attack = animation('Attack', 1.4, [
    mov('body', poses([0, zero], [0.2, zero], [0.6, [0, 0.05, -0.15]], [0.72, [0, 0, 0.35], 'snap'], [0.95, [0, 0, 0.3]], [1.4, zero])),
    rot('body', poses([0, zero], [0.2, zero], [0.6, [-10, 0, 0]], [0.72, [8, 0, 0], 'snap'], [0.95, [6, 0, 0]], [1.4, zero])),
    rot('head', poses([0, zero], [0.2, zero], [0.6, [-25, 0, 0]], [0.72, [15, 0, 0], 'snap'], [0.95, [12, 0, 0]], [1.4, zero])),
    rot('jaw', poses([0, zero], [0.2, zero], [0.6, [38, 0, 0]], [0.72, [0, 0, 0], 'snap'], [0.95, zero], [1.4, zero])),
    rot('leg_fl', poses([0, zero], [0.6, [-14, 0, 0]], [0.72, [20, 0, 0], 'snap'], [1.4, zero])),
    rot('leg_fr', poses([0, zero], [0.6, [-14, 0, 0]], [0.72, [20, 0, 0], 'snap'], [1.4, zero])),
    rot('tail', poses([0, zero], [0.6, [-15, 0, 0]], [0.72, [10, 0, 0], 'snap'], [1.4, zero])),
    scl('eyes', poses([0, 1], [0.2, 1], [0.6, 1.35], [0.95, 1.2], [1.4, 1])),
  ]);

  const hit = animation('Hit', 0.5, [
    mov('body', poses([0, zero], [0.08, [0, 0, -0.14], 'snap'], [0.5, zero])),
    scl('body', poses([0, 1], [0.08, [1.08, 0.9, 1.04], 'snap'], [0.25, [0.97, 1.04, 1]], [0.5, 1])),
    rot('head', poses([0, zero], [0.08, [-18, 8, 0], 'snap'], [0.5, zero])),
    rot('tail', poses([0, zero], [0.1, [0, -20, 0], 'snap'], [0.5, zero])),
  ]);

  const lieDown = -(legLength + 0.25) + 0.42 * W;
  const die = animation('Die', 1.8, [
    rot('body', poses([0, zero], [0.3, [-12, 0, 0]], [1.0, [0, 0, 84], 'in'], [1.15, [0, 0, 80], 'out'], [1.8, [0, 0, 82]])),
    mov('body', poses([0, zero], [0.3, [0, 0.04, 0]], [1.0, [0, lieDown, 0], 'in'], [1.8, [0, lieDown, 0]])),
    rot('head', poses([0, zero], [0.3, [-30, 0, 0]], [1.1, [20, 0, 0]], [1.8, [25, 0, 0]])),
    rot('jaw', poses([0, zero], [0.3, [30, 0, 0]], [1.8, [20, 0, 0]])),
    rot('leg_fl', poses([0, zero], [1.1, [30, 0, -20]], [1.8, [25, 0, -15]])),
    rot('leg_bl', poses([0, zero], [1.1, [-30, 0, -20]], [1.8, [-25, 0, -15]])),
    rot('tail', poses([0, zero], [1.1, [0, 25, 0]], [1.8, [0, 20, 0]])),
    scl('eyes', poses([0, 1], [1.0, 1], [1.8, 0.15])),
  ]);

  return model(root, [idle, move, attack, hit, die], {
    attacks: { Attack: { warn: 0.2, hit: 0.72, end: 0.95 } },
  });
}

export const spineback: ModelEntry = { id: 'spineback', name: 'Spineback', type: 'enemy', planetary: true, create };
