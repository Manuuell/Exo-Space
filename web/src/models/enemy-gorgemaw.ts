// Gorgemaw: planet fauna that never moves from its spot: a thorny stalk
// rooted in the ground, a huge head that splits into two jaws full of teeth,
// three glowing eyes and three spiked tentacles. It spits a glowing glob.
// About 2.2 m tall. It changes with the planet through the team's table
// (fauna.ts): its stalk grows taller under low gravity.

import { TAU, animation, block, light, loop, model, node, poses, rig, speckle } from './kit.ts';
import type { Model, ModelEntry, Vec3 } from './kit.ts';
import type { PlanetLook } from './contract.ts';
import { shades, teeth } from './beasts.ts';
import { faunaLook } from './fauna.ts';

function create(planet?: PlanetLook): Model {
  const look = faunaLook(planet);
  const { skin, skinDark, spine, growth, claw } = look.palette;
  const G = look.glow;
  const W = look.wide;
  const T = look.tall;

  const tentacle = (i: number) => {
    const angle = (i * 120 + 30) * (Math.PI / 180);
    return node(`tentacle_${i}`, { at: [Math.sin(angle) * 0.42, 0.14, Math.cos(angle) * 0.42], rot: [0, (i * 120 + 30), 0] },
      block(0.13, 0.12, 0.42, skin, { at: [0, 0, 0.2] }),
      ...[0.1, 0.3].map((z) => block(0.04, 0.08, 0.04, spine, { at: [0, 0.08, z] })),
      node(`tentacle_${i}_tip`, { at: [0, 0, 0.42], rot: [-25, 0, 0] },
        block(0.09, 0.09, 0.36, skinDark, { at: [0, 0, 0.17] }),
        ...light(0.05, 0.05, 0.1, G, { at: [0, 0, 0.38] }, 1.6)),
    );
  };

  const eyes = node('eyes', {},
    ...light(0.1, 0.07, 0.04, G, { at: [-0.22 * W, 0.33, 0.52] }),
    ...light(0.12, 0.08, 0.04, G, { at: [0, 0.35, 0.6] }),
    ...light(0.1, 0.07, 0.04, G, { at: [0.22 * W, 0.33, 0.52] }),
  );

  const head = node('head', { at: [0, 1.4 * T, 0.08] },
    node('jaw_top', { at: [0, 0, -0.25] },
      block(0.9 * W, 0.32, 0.8, skin, { at: [0, 0.16, 0.35] }),
      block(0.7 * W, 0.1, 0.6, skinDark, { at: [0, 0.35, 0.3] }),
      ...[-0.25, 0, 0.25].map((x) => block(0.07, 0.22, 0.07, spine, { at: [x * W, 0.45, 0.1], rot: [-30, 0, x * 40] })),
      ...speckle(shades(skin), { box: [0.9 * W, 0.32, 0.8], at: [0, 0.16, 0.35], faces: 'lrt', count: 8, size: 0.06, seed: 71 }),
      eyes,
      ...teeth(-0.38 * W, 0.38 * W, 9, 0, 0.74, 0.045, claw),
      ...[0.15, 0.35, 0.55].flatMap((z) => [
        block(0.04, 0.09, 0.04, claw, { at: [0.41 * W, -0.04, z] }),
        block(0.04, 0.09, 0.04, claw, { at: [-0.41 * W, -0.04, z] }),
      ])),
    node('jaw', { at: [0, 0, -0.25] },
      block(0.9 * W, 0.28, 0.8, skinDark, { at: [0, -0.14, 0.35] }),
      ...teeth(-0.36 * W, 0.36 * W, 8, 0, 0.72, 0.04, claw, true),
      ...light(0.5 * W, 0.06, 0.5, G, { at: [0, 0.0, 0.35] }, 1.2)),
    // The glob it spits: almost nothing at rest, the Attack clip grows it.
    node('glob', { at: [0, 0.02, 0.45], scale: 0.02 }, ...light(0.25, 0.25, 0.25, G, {}, 1.6)),
  );

  const body = node('body', { at: [0, 0.2, 0] },
    block(0.38 * W, 0.5 * T, 0.38 * W, skin, { at: [0, 0.25 * T, 0] }),
    block(0.34 * W, 0.5 * T, 0.34 * W, skinDark, { at: [0.05, 0.72 * T, 0.02] }),
    block(0.3 * W, 0.45 * T, 0.3 * W, skin, { at: [0.02, 1.15 * T, 0.06] }),
    ...[0.3, 0.6, 0.9, 1.2].flatMap((y, i) => [
      block(0.05, 0.05, 0.12, spine, { at: [0.2 * W, y * T, 0], rot: [0, 90, -20] }),
      block(0.05, 0.05, 0.12, spine, { at: [-0.19 * W, (y + 0.15) * T, 0.02 * i], rot: [0, 90, 20] }),
    ]),
    head,
  );

  const root = node('gorgemaw', { scale: look.size },
    block(1.0, 0.22, 1.0, skinDark, { at: [0, 0.11, 0] }),
    ...[0, 90, 180, 270].map((a) => block(0.16, 0.1, 0.5, skinDark, { at: [Math.sin((a * Math.PI) / 180) * 0.55, 0.05, Math.cos((a * Math.PI) / 180) * 0.55], rot: [0, a, 0] })),
    ...speckle(shades(growth), { box: [1.0, 0.22, 1.0], at: [0, 0.11, 0], faces: 't', count: 10, size: 0.08, seed: 73 }),
    body,
    tentacle(0),
    tentacle(1),
    tentacle(2),
  );
  const { rot, mov, scl } = rig(root);
  const wave = (p: number, shift = 0) => Math.sin((p + shift) * TAU);
  const zero: Vec3 = [0, 0, 0];
  const writhe = (speed: number, amount: number) =>
    [0, 1, 2].flatMap((i) => [
      rot(`tentacle_${i}`, loop((p) => [4 * wave(p * speed, i / 3), amount * wave(p * speed, i / 3 + 0.1), 0])),
      rot(`tentacle_${i}_tip`, loop((p) => [10 * wave(p * speed, i / 3 + 0.25), 0, 0])),
    ]);

  const idle = animation('Idle', 2.6, [
    rot('body', loop((p) => [2 * wave(p, 0.3), 0, 3 * wave(p)])),
    rot('head', loop((p) => [4 * wave(p, 0.2), 8 * wave(p), 0])),
    rot('jaw_top', loop((p) => [-4 - 4 * wave(p * 2), 0, 0])),
    rot('jaw', loop((p) => [4 + 4 * wave(p * 2), 0, 0])),
    scl('eyes', loop((p) => 1 + 0.1 * wave(p * 2))),
    ...writhe(1, 12),
  ]);

  // Rooted to the spot: "moving" is thrashing about, faster and wider.
  const move = animation('Move', 1, [
    rot('body', loop((p) => [5 * wave(p, 0.3), 0, 7 * wave(p)])),
    rot('head', loop((p) => [8 * wave(p, 0.2), 15 * wave(p), 0])),
    rot('jaw_top', loop((p) => [-10 - 6 * wave(p * 2), 0, 0])),
    rot('jaw', loop((p) => [10 + 6 * wave(p * 2), 0, 0])),
    ...writhe(1, 25),
  ]);

  // The tell: it pulls its head back with its jaws wide and the glob glowing
  // in its throat (0.3–0.75 s); it lunges and spits at 0.8 s.
  const attack = animation('Attack', 1.6, [
    rot('head', poses([0, zero], [0.3, zero], [0.75, [-22, 0, 0]], [0.8, [15, 0, 0], 'snap'], [1.0, [12, 0, 0]], [1.6, zero])),
    rot('body', poses([0, zero], [0.75, [-8, 0, 0]], [0.8, [6, 0, 0], 'snap'], [1.6, zero])),
    rot('jaw_top', poses([0, zero], [0.3, zero], [0.75, [-38, 0, 0]], [1.0, [-30, 0, 0]], [1.6, zero])),
    rot('jaw', poses([0, zero], [0.3, zero], [0.75, [28, 0, 0]], [1.0, [22, 0, 0]], [1.6, zero])),
    scl('glob', poses([0, 1], [0.3, 1], [0.75, 10], [0.8, 12, 'snap'], [0.98, 12], [1.0, 1, 'snap'], [1.6, 1])),
    mov('glob', poses([0, zero], [0.75, zero], [0.95, [0, -0.3, 2.5], 'linear'], [1.0, zero, 'snap'], [1.6, zero])),
    scl('eyes', poses([0, 1], [0.75, 1.4], [1.6, 1])),
    ...[0, 1, 2].map((i) => rot(`tentacle_${i}`, poses([0, zero], [0.75, [-20, 0, 0]], [0.8, [10, 0, 0], 'snap'], [1.6, zero]))),
  ]);

  const hit = animation('Hit', 0.5, [
    rot('body', poses([0, zero], [0.08, [-10, 0, 8], 'snap'], [0.5, zero])),
    rot('head', poses([0, zero], [0.08, [-18, 12, 0], 'snap'], [0.5, zero])),
    rot('jaw_top', poses([0, zero], [0.08, [-20, 0, 0], 'snap'], [0.5, zero])),
  ]);

  // It wilts: the stalk bends, the head hangs and the eyes go out.
  const die = animation('Die', 2, [
    rot('body', poses([0, zero], [0.3, [-8, 0, 0]], [1.4, [32, 0, 18], 'in'], [2, [34, 0, 18]])),
    rot('head', poses([0, zero], [1.4, [45, 0, 10]], [2, [50, 0, 10]])),
    rot('jaw_top', poses([0, zero], [1.4, [-15, 0, 0]], [2, [-12, 0, 0]])),
    rot('jaw', poses([0, zero], [1.4, [20, 0, 0]], [2, [22, 0, 0]])),
    scl('eyes', poses([0, 1], [1.2, 1], [2, 0.05])),
    ...[0, 1, 2].map((i) => rot(`tentacle_${i}_tip`, poses([0, zero], [1.4, [20, 0, 0]], [2, [22, 0, 0]]))),
  ]);

  return model(root, [idle, move, attack, hit, die], {
    attacks: { Attack: { warn: 0.3, hit: 0.8, end: 1.0 } },
  });
}

export const gorgemaw: ModelEntry = { id: 'gorgemaw', name: 'Gorgemaw', type: 'enemy', planetary: true, create };
