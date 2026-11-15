// Wyvern: flying planet fauna, a two-legged dragon with a long horned neck,
// a jaw full of teeth, great wings in two sections with glowing veins, hanging
// talons and a spade-tipped tail. It breathes fire. It hovers about 2.6 m
// above its origin; wingspan about 4.8 m. It changes with the planet through
// the team's table (fauna.ts): its fire takes the star's colour.

import { TAU, animation, block, light, loop, model, node, poses, rig, speckle, tint } from './kit.ts';
import type { Model, ModelEntry, Vec3 } from './kit.ts';
import type { PlanetLook } from './contract.ts';
import { angryEyes, shades, teeth } from './beasts.ts';
import { faunaLook } from './fauna.ts';

const HOVER = 2.6;

function create(planet?: PlanetLook): Model {
  const look = faunaLook(planet);
  const { skin, skinDark, belly, spine, claw } = look.palette;
  const G = look.glow;
  const W = look.wide;
  const T = look.tall;

  const wing = (side: 'l' | 'r') => {
    const s = side === 'l' ? 1 : -1;
    return node(`wing_${side}`, { at: [0.3 * W * s, 0.2, 0.1] },
      block(1.0 * T, 0.1, 0.1, skinDark, { at: [0.5 * T * s, 0, 0.3] }),
      block(1.0 * T, 0.05, 1.0, tint(skin, -0.1), { at: [0.5 * T * s, -0.02, -0.15] }),
      block(0.06, 0.12, 0.06, claw, { at: [1.0 * T * s, 0.08, 0.32] }),
      ...light(0.5 * T, 0.02, 0.03, G, { at: [0.5 * T * s, 0.012, -0.1] }, 1.4),
      node(`wing_${side}_outer`, { at: [1.0 * T * s, 0, 0.3] },
        block(1.1 * T, 0.08, 0.08, skinDark, { at: [0.55 * T * s, 0, 0] }),
        block(0.06, 0.06, 0.9, skinDark, { at: [0.4 * T * s, 0, -0.45], rot: [0, 10 * s, 0] }),
        block(0.06, 0.06, 0.8, skinDark, { at: [0.85 * T * s, 0, -0.4], rot: [0, -15 * s, 0] }),
        block(1.05 * T, 0.04, 0.9, tint(skin, -0.14), { at: [0.55 * T * s, -0.02, -0.45] }),
        block(0.3, 0.06, 0.06, claw, { at: [1.2 * T * s, 0, 0.05], rot: [0, -15 * s, 0] }),
        ...light(0.6 * T, 0.02, 0.03, G, { at: [0.55 * T * s, 0.01, -0.35] }, 1.4)),
    );
  };

  const leg = (side: 'l' | 'r') => {
    const s = side === 'l' ? 1 : -1;
    return node(`leg_${side}`, { at: [0.22 * W * s, -0.25, -0.1] },
      block(0.18, 0.3, 0.24, skin, { at: [0, -0.12, 0] }),
      block(0.1, 0.3, 0.12, skinDark, { at: [0, -0.38, 0.06], rot: [-20, 0, 0] }),
      block(0.16, 0.06, 0.2, skinDark, { at: [0, -0.55, 0.12] }),
      ...[-0.05, 0, 0.05].map((x) => block(0.035, 0.08, 0.035, claw, { at: [x, -0.6, 0.22] })),
    );
  };

  // The fire: rest scale almost nothing; the Attack clip grows it.
  const flame = node('flame', { at: [0, -0.06, 0.75], scale: 0.02 },
    ...[0, 1, 2, 3, 4, 5, 6].flatMap((i) => {
      const size = 0.1 + i * 0.05;
      return light(size, size, 0.22, i % 2 ? G : tint(G, 0.15), { at: [0, 0, 0.12 + i * 0.24] }, 1.6);
    }),
  );

  const head = node('head', { at: [0, 0.05, 0.5], rot: [30, 0, 0] },
    block(0.42, 0.34, 0.45, skin, { at: [0, 0.05, 0.15] }),
    block(0.3, 0.2, 0.45, skin, { at: [0, -0.02, 0.5] }),
    ...light(0.04, 0.03, 0.02, G, { at: [0.07, 0.06, 0.725] }, 1.6),
    ...light(0.04, 0.03, 0.02, G, { at: [-0.07, 0.06, 0.725] }, 1.6),
    angryEyes('eyes', { at: [0, 0.13, 0.376], gap: 0.22, size: [0.08, 0.04], glow: G, brow: skinDark, tilt: 26 }),
    block(0.07, 0.07, 0.4, spine, { at: [0.16, 0.24, -0.12], rot: [25, 0, 0] }),
    block(0.07, 0.07, 0.4, spine, { at: [-0.16, 0.24, -0.12], rot: [25, 0, 0] }),
    block(0.05, 0.05, 0.15, claw, { at: [0.16, 0.34, -0.36], rot: [35, 0, 0] }),
    block(0.05, 0.05, 0.15, claw, { at: [-0.16, 0.34, -0.36], rot: [35, 0, 0] }),
    block(0.05, 0.05, 0.2, spine, { at: [0.22, 0.1, -0.02], rot: [20, 30, 0] }),
    block(0.05, 0.05, 0.2, spine, { at: [-0.22, 0.1, -0.02], rot: [20, -30, 0] }),
    ...teeth(-0.12, 0.12, 7, -0.12, 0.7, 0.03, claw),
    block(0.26, 0.04, 0.4, '#5a1a1a', { at: [0, -0.12, 0.5] }),
    node('jaw', { at: [0, -0.1, 0.2] },
      block(0.28, 0.1, 0.55, skinDark, { at: [0, -0.05, 0.27] }),
      ...teeth(-0.11, 0.11, 6, 0, 0.52, 0.028, claw, true)),
    flame,
  );

  const body = node('body', { at: [0, HOVER, 0] },
    block(0.6 * W, 0.55, 1.1, skin),
    block(0.5 * W, 0.12, 0.9, belly, { at: [0, -0.26, 0.02] }),
    ...[0.35, 0.1, -0.15, -0.4].map((z, i) => block(0.08, 0.22 - i * 0.03, 0.12, spine, { at: [0, 0.36, z], rot: [-25, 0, 0] })),
    ...light(0.02, 0.3, 0.04, G, { at: [0.305 * W, 0, 0.25] }, 1.4),
    ...light(0.02, 0.3, 0.04, G, { at: [-0.305 * W, 0, 0.25] }, 1.4),
    ...speckle(shades(skin), { box: [0.6 * W, 0.55, 1.1], faces: 'lrt', count: 14, size: 0.06, seed: 51 }),
    node('neck', { at: [0, 0.15, 0.5], rot: [-30, 0, 0] },
      block(0.3, 0.3, 0.5, skin, { at: [0, 0, 0.25] }),
      block(0.06, 0.14, 0.1, spine, { at: [0, 0.2, 0.2], rot: [-25, 0, 0] }),
      head),
    wing('l'),
    wing('r'),
    leg('l'),
    leg('r'),
    node('tail', { at: [0, 0, -0.55] },
      block(0.3, 0.25, 0.8, skin, { at: [0, 0, -0.4] }),
      block(0.06, 0.14, 0.1, spine, { at: [0, 0.18, -0.3], rot: [-25, 0, 0] }),
      node('tail_tip', { at: [0, 0, -0.8] },
        block(0.18, 0.15, 0.9, skinDark, { at: [0, 0, -0.45] }),
        block(0.4, 0.06, 0.3, spine, { at: [0, 0, -0.95] }),
        ...light(0.12, 0.03, 0.1, G, { at: [0, 0.04, -0.95] }, 1.5))),
  );

  const root = node('wyvern', { scale: look.size }, body);
  const { rot, mov, scl } = rig(root);
  const wave = (p: number, shift = 0) => Math.sin((p + shift) * TAU);
  const zero: Vec3 = [0, 0, 0];

  const flapTracks = (amount: number, outer: number) => [
    rot('wing_l', loop((p) => [0, 0, amount * wave(p)])),
    rot('wing_r', loop((p) => [0, 0, -amount * wave(p)])),
    rot('wing_l_outer', loop((p) => [0, 0, outer * wave(p, -0.15)])),
    rot('wing_r_outer', loop((p) => [0, 0, -outer * wave(p, -0.15)])),
  ];

  const idle = animation('Idle', 2, [
    ...flapTracks(25, 20),
    mov('body', loop((p) => [0, 0.12 * wave(p, 0.25), 0])),
    rot('neck', loop((p) => [5 * wave(p, 0.3), 8 * wave(p), 0])),
    rot('head', loop((p) => [-4 * wave(p, 0.3), -6 * wave(p), 0])),
    rot('jaw', loop((p) => [4 + 4 * wave(p * 2), 0, 0])),
    rot('tail', loop((p) => [3 * wave(p, 0.4), 10 * wave(p), 0])),
    rot('tail_tip', loop((p) => [0, 14 * wave(p, -0.2), 0])),
    scl('eyes', loop((p) => 1 + 0.06 * wave(p))),
  ]);

  const move = animation('Move', 1, [
    ...flapTracks(35, 26),
    rot('body', loop(() => [10, 0, 0])),
    mov('body', loop((p) => [0, 0.1 * wave(p, 0.25), 0])),
    rot('neck', loop((p) => [8, 5 * wave(p), 0])),
    rot('tail', loop((p) => [-6, 12 * wave(p), 0])),
  ]);

  // The tell: it rears its neck, opens its jaw and the fire glows in its
  // mouth (0.3–0.8 s); the breath bursts out at 0.85 s and lasts to 1.5 s.
  const attack = animation('Attack', 2, [
    rot('neck', poses([0, zero], [0.3, zero], [0.8, [-25, 0, 0]], [0.9, [20, 0, 0], 'snap'], [1.5, [18, 0, 0]], [2, zero])),
    rot('head', poses([0, zero], [0.3, zero], [0.8, [-15, 0, 0]], [0.9, [10, 0, 0], 'snap'], [1.5, [8, 0, 0]], [2, zero])),
    rot('jaw', poses([0, zero], [0.3, zero], [0.8, [30, 0, 0]], [1.5, [32, 0, 0]], [2, zero])),
    scl('flame', poses([0, 1], [0.3, 1], [0.8, 12], [0.9, 50, 'snap'], [1.5, 48], [1.75, 1], [2, 1])),
    mov('body', poses([0, zero], [0.8, [0, 0.2, -0.25]], [0.9, [0, 0, 0.1], 'snap'], [1.5, [0, 0, 0.1]], [2, zero])),
    rot('wing_l', poses([0, zero], [0.8, [0, 0, 35]], [0.9, [0, 0, -10], 'snap'], [1.5, [0, 0, 10]], [2, zero])),
    rot('wing_r', poses([0, zero], [0.8, [0, 0, -35]], [0.9, [0, 0, 10], 'snap'], [1.5, [0, 0, -10]], [2, zero])),
    scl('eyes', poses([0, 1], [0.8, 1.4], [2, 1])),
  ]);

  const hit = animation('Hit', 0.6, [
    mov('body', poses([0, zero], [0.1, [0, 0.2, -0.2], 'snap'], [0.6, zero])),
    rot('body', poses([0, zero], [0.1, [-12, 0, -12], 'snap'], [0.6, zero])),
    rot('neck', poses([0, zero], [0.1, [-20, 10, 0], 'snap'], [0.6, zero])),
    rot('wing_l', poses([0, zero], [0.1, [0, 0, 45], 'snap'], [0.6, zero])),
  ]);

  // It folds its wings, falls and crashes on its side.
  const die = animation('Die', 2.2, [
    mov('body', poses([0, zero], [0.3, [0, 0.2, 0]], [1.5, [0, -HOVER + 0.35, 0.3], 'in'], [2.2, [0, -HOVER + 0.35, 0.3]])),
    rot('body', poses([0, zero], [0.3, [-10, 0, 0]], [1.5, [10, 0, 75], 'in'], [1.65, [8, 0, 70], 'out'], [2.2, [8, 0, 72]])),
    rot('wing_l', poses([0, zero], [1.5, [0, 0, -40]], [2.2, [0, 0, -35]])),
    rot('wing_r', poses([0, zero], [1.5, [0, 0, 40]], [2.2, [0, 0, 35]])),
    rot('wing_l_outer', poses([0, zero], [1.5, [0, 40, -30]], [2.2, [0, 40, -30]])),
    rot('wing_r_outer', poses([0, zero], [1.5, [0, -40, 30]], [2.2, [0, -40, 30]])),
    rot('neck', poses([0, zero], [0.3, [-25, 0, 0]], [1.6, [30, 15, 0]], [2.2, [35, 15, 0]])),
    rot('jaw', poses([0, zero], [2.2, [25, 0, 0]])),
    scl('eyes', poses([0, 1], [1.5, 1], [2.2, 0.1])),
  ]);

  return model(root, [idle, move, attack, hit, die], {
    attacks: { Attack: { warn: 0.3, hit: 0.85, end: 1.5 } },
  });
}

export const wyvern: ModelEntry = { id: 'wyvern', name: 'Wyvern', type: 'enemy', planetary: true, flies: true, create };
