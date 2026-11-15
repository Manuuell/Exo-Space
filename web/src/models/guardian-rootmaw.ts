// Rootmaw: the guardian of the ruins of TRAPPIST-1 e. A titan of the planet,
// about 5 m tall, that the first colonists bound to guard their sealed
// archive: hunched, with huge arms that nearly touch the ground, a horned
// skull with a jaw of fangs, eyes burning in the star's colour, a back of
// moss and great crystal spikes, and the colonists' shackles: a collar and
// manacles of rune metal glowing cyan, with hanging chains. Its weak point is
// the rune seal on its chest that keeps it bound.
// Its look follows TRAPPIST-1 e through the team's table (fauna.ts): moss,
// 0.82 g, the star's orange glow. Detailed voxel.

import { TAU, animation, block, light, loop, model, node, poses, rig, speckle, tint } from './kit.ts';
import type { Model, ModelEntry, Vec3 } from './kit.ts';
import { TRAPPIST_1 } from './contract.ts';
import { CRACK_TALL, angryEyes, cracks, shades, teeth } from './beasts.ts';
import { faunaLook } from './fauna.ts';

const METAL = '#5b6170';
const METAL_DARK = '#3d424e';
const RUNE = '#63e9ff';

function create(): Model {
  const look = faunaLook(TRAPPIST_1.e);
  const { skin, skinDark, spine, growth, claw } = look.palette;
  const G = look.glow;
  const W = look.wide;
  const legH = 1.3 * look.tall;
  const hide = shades(skin);
  const moss = shades(growth);

  /** A short chain of links hanging down from a point. */
  const chain = (at: Vec3, links: number) =>
    Array.from({ length: links }, (_, i) =>
      block(i % 2 ? 0.06 : 0.12, 0.12, i % 2 ? 0.12 : 0.06, i % 2 ? METAL : METAL_DARK, { at: [at[0], at[1] - i * 0.1, at[2]] }));

  /** A crystal spike growing from the back: stacked, narrowing blocks. */
  const crystal = (at: Vec3, height: number, lean: number) =>
    [0, 1, 2, 3].map((i) => block(0.24 - i * 0.05, height / 4, 0.24 - i * 0.05, i % 2 ? growth : tint(growth, 0.1), {
      at: [at[0] + lean * i * 0.05, at[1] + (i + 0.5) * (height / 4), at[2] - i * 0.04], rot: [-15, 0, lean * 10],
    }));

  const leg = (side: 'l' | 'r') => {
    const s = side === 'l' ? 1 : -1;
    return node(`leg_${side}`, { at: [0.7 * W * s, 0, 0] },
      block(0.75 * W, 0.8, 0.85, skin, { at: [0, -0.3, 0] }),
      block(0.62 * W, legH - 0.85, 0.7, skinDark, { at: [0, -0.7 - (legH - 0.85) / 2 + 0.15, 0.02] }),
      block(0.95 * W, 0.3, 1.15, skinDark, { at: [0, -legH + 0.15, 0.15] }),
      ...[-0.3, -0.1, 0.1, 0.3].map((x) => block(0.12, 0.12, 0.22, claw, { at: [x * W, -legH + 0.08, 0.78] })),
      ...speckle(hide, { box: [0.75 * W, 0.8, 0.85], at: [0, -0.3, 0], faces: 'lrf', count: 6, size: 0.12, seed: 3 + s }),
    );
  };

  const arm = (side: 'l' | 'r') => {
    const s = side === 'l' ? 1 : -1;
    return node(`arm_${side}`, { at: [1.3 * W * s, 1.5, 0.1], rot: [0, 0, 10 * s] },
      block(0.8, 0.6, 0.85, skin, { at: [0.05 * s, 0.05, 0] }),
      ...crystal([0.1 * s, 0.35, -0.1], 0.6, s),
      block(0.75, 1.3, 0.8, skin, { at: [0, -0.6, 0] }),
      ...speckle(hide, { box: [0.75, 1.3, 0.8], at: [0, -0.6, 0], faces: 'lrb', count: 8, size: 0.12, seed: 11 + s }),
      node(`fist_${side}`, { at: [0, -1.25, 0.1] },
        block(0.85, 1.1, 0.9, skinDark, { at: [0, -0.5, 0] }),
        // The colonists' manacle, with glowing runes and a broken chain.
        block(1.0, 0.28, 1.05, METAL, { at: [0, -0.18, 0] }),
        ...[-0.25, 0, 0.25].flatMap((x) => light(0.1, 0.1, 0.02, RUNE, { at: [x, -0.18, 0.535] }, 1.5)),
        ...chain([0.35 * s, -0.35, 0.4], 5),
        block(1.1, 0.8, 1.0, skin, { at: [0, -1.3, 0.15] }),
        ...[-0.36, -0.12, 0.12, 0.36].map((x) => block(0.14, 0.14, 0.28, claw, { at: [x, -1.55, 0.7] })),
        ...light(0.08, 0.4, 0.02, G, { at: [0.3 * s, -0.55, 0.455] }, 1.5),
      ),
    );
  };

  const head = node('head', { at: [0, 1.95, 0.85] },
    block(0.95, 0.8, 0.95, skin, { at: [0, 0.1, 0.2] }),
    block(1.05, 0.22, 0.4, skinDark, { at: [0, 0.42, 0.55], rot: [12, 0, 0] }),
    angryEyes('eyes', { at: [0, 0.22, 0.68], gap: 0.42, size: [0.2, 0.09], glow: G, brow: skinDark, tilt: 22 }),
    // Horns: four blocks each, sweeping out, up and back.
    // Horns: overlapping blocks that sweep out, up and back, thinner each step.
    ...[1, -1].flatMap((s) => [0, 1, 2, 3, 4].map((i) =>
      block(0.28 - i * 0.045, 0.28 - i * 0.045, 0.3, i === 4 ? claw : spine, {
        at: [s * (0.42 + i * 0.13), 0.48 + i * 0.17, 0.12 - i * 0.09], rot: [-20 - i * 10, s * 20, -s * 12],
      }))),
    ...teeth(-0.36, 0.36, 9, -0.3, 0.66, 0.08, claw),
    block(0.8, 0.08, 0.6, '#5a1a1a', { at: [0, -0.32, 0.35] }),
    ...light(0.5, 0.05, 0.4, G, { at: [0, -0.35, 0.3] }, 1.3),
    node('jaw', { at: [0, -0.32, 0.0] },
      block(0.85, 0.28, 0.75, skinDark, { at: [0, -0.15, 0.32] }),
      ...teeth(-0.34, 0.34, 8, 0, 0.62, 0.075, claw, true),
      block(0.14, 0.42, 0.14, claw, { at: [0.36, 0.18, 0.6], rot: [-20, 0, -10] }),
      block(0.14, 0.42, 0.14, claw, { at: [-0.36, 0.18, 0.6], rot: [-20, 0, 10] })),
    ...speckle(hide, { box: [0.95, 0.8, 0.95], at: [0, 0.1, 0.2], faces: 'lrt', count: 6, size: 0.1, seed: 17 }),
  );

  // The rune seal on its chest: the weak point, framed in metal.
  const weakPoint = node('weak_point', { at: [0, 1.0, 0.86] },
    ...light(0.45, 0.45, 0.08, RUNE, {}, 1.7),
    ...[[0, 0.3, 0.6, 0.1], [0, -0.3, 0.6, 0.1], [0.3, 0, 0.1, 0.6], [-0.3, 0, 0.1, 0.6]].map(([x, y, w, h]) =>
      block(w, h, 0.12, METAL, { at: [x, y, 0.01] })),
    cracks('seal_cracks', CRACK_TALL, RUNE, { at: [0.42, -0.1, 0.0] }, 0.08),
  );

  const torso = node('torso', { at: [0, 0.4, 0], rot: [18, 0, 0] },
    block(2.2 * W, 1.6, 1.5, skin, { at: [0, 1.0, 0.1] }),
    block(1.6 * W, 0.8, 1.2, skinDark, { at: [0, 0.2, 0.15] }),
    block(1.8 * W, 0.9, 1.0, skinDark, { at: [0, 1.7, -0.4] }),
    ...speckle(hide, { box: [2.2 * W, 1.6, 1.5], at: [0, 1.0, 0.1], faces: 'lrb', count: 20, size: 0.14, seed: 5 }),
    ...speckle(moss, { box: [1.8 * W, 0.9, 1.0], at: [0, 1.7, -0.4], faces: 'tb', count: 22, size: 0.16, seed: 9 }),
    ...[[-0.5, -0.5], [0, -0.7], [0.5, -0.5], [-0.3, -0.1], [0.3, -0.1]].flatMap(([x, z], i) =>
      crystal([x * W, 2.1, z], 0.7 + (i % 3) * 0.25, x > 0 ? 1 : -1)),
    // The colonists' collar, with runes and a chain.
    block(1.3, 0.28, 1.15, METAL, { at: [0, 1.95, 0.45] }),
    ...[-0.4, -0.13, 0.13, 0.4].flatMap((x) => light(0.1, 0.1, 0.02, RUNE, { at: [x, 1.95, 1.03] }, 1.5)),
    ...chain([0.3, 1.78, 1.0], 6),
    ...chain([-0.45, 1.78, 0.95], 4),
    cracks('crack_side_l', CRACK_TALL, G, { at: [1.1 * W + 0.001, 0.9, 0.2], rot: [0, 90, 0] }, 0.1),
    cracks('crack_side_r', CRACK_TALL, G, { at: [-1.1 * W - 0.001, 1.0, 0.1], rot: [0, -90, 0] }, 0.1),
    weakPoint,
    head,
    arm('l'),
    arm('r'),
  );

  const body = node('body', { at: [0, legH, 0] },
    block(1.4 * W, 0.6, 1.0, skinDark, { at: [0, 0.2, 0] }),
    torso,
    leg('l'),
    leg('r'),
  );

  const root = node('rootmaw', {}, body);
  const { rot, mov, scl } = rig(root);
  const wave = (p: number, shift = 0) => Math.sin((p + shift) * TAU);
  const zero: Vec3 = [0, 0, 0];

  const idle = animation('Idle', 4, [
    scl('torso', loop((p) => [1 + 0.015 * wave(p), 1 + 0.02 * wave(p), 1 + 0.01 * wave(p)])),
    rot('head', loop((p) => [4 * wave(p, 0.3), 12 * wave(p, 0.1), 2 * wave(p)])),
    rot('jaw', loop((p) => [4 + 4 * wave(p * 2), 0, 0])),
    rot('arm_l', loop((p) => [3 * wave(p, 0.2), 0, 2 * wave(p)])),
    rot('arm_r', loop((p) => [-3 * wave(p, 0.2), 0, -2 * wave(p)])),
    scl('weak_point', loop((p) => 1 + 0.1 * wave(p * 2))),
    scl('eyes', loop((p) => 1 + 0.06 * wave(p * 2, 0.3))),
  ]);

  // It sleeps hunched with dark eyes, the eyes ignite at 1.0 s, it rises and
  // roars from 2.2 s, then settles into its stance.
  const crouch: Vec3 = [0, -legH * 0.45, 0];
  const wake = animation('Wake', 3.6, [
    mov('body', poses([0, crouch], [1.0, crouch], [2.2, [0, 0.1, 0], 'out'], [3.0, [0, 0.1, 0]], [3.6, zero])),
    rot('torso', poses([0, [32, 0, 0]], [1.0, [30, 0, 0]], [2.2, [-12, 0, 0], 'out'], [3.0, [-14, 0, 0]], [3.6, zero])),
    rot('head', poses([0, [35, 0, 0]], [1.0, [30, 0, 0]], [2.2, [-25, 0, 0]], [3.0, [-28, 0, 0]], [3.6, zero])),
    rot('jaw', poses([0, zero], [2.0, zero], [2.3, [42, 0, 0], 'snap'], [3.0, [40, 0, 0]], [3.6, zero])),
    rot('arm_l', poses([0, [20, 0, -8]], [1.0, [20, 0, -8]], [2.2, [-30, 0, 40]], [3.0, [-30, 0, 42]], [3.6, zero])),
    rot('arm_r', poses([0, [20, 0, 8]], [1.0, [20, 0, 8]], [2.2, [-30, 0, -40]], [3.0, [-30, 0, -42]], [3.6, zero])),
    rot('leg_l', poses([0, [-40, 0, 0]], [1.0, [-40, 0, 0]], [2.2, zero, 'out'], [3.6, zero])),
    rot('leg_r', poses([0, [-40, 0, 0]], [1.0, [-40, 0, 0]], [2.2, zero, 'out'], [3.6, zero])),
    scl('eyes', poses([0, 0.05], [0.95, 0.05], [1.05, 1.5, 'snap'], [2.2, 1.2], [3.0, 1.4], [3.6, 1])),
    scl('weak_point', poses([0, 0.4], [1.0, 0.4], [1.3, 1.3], [2.2, 1.1], [3.6, 1])),
  ]);

  // Heavy steps; the arms swing low like a great ape.
  const move = animation('Move', 1.6, [
    rot('leg_l', loop((p) => [20 * wave(p), 0, 0])),
    rot('leg_r', loop((p) => [-20 * wave(p), 0, 0])),
    mov('body', loop((p) => [0, 0.12 * Math.abs(wave(p)), 0])),
    rot('torso', loop((p) => [3, 6 * wave(p), 4 * wave(p)])),
    rot('arm_l', loop((p) => [-16 * wave(p), 0, 0])),
    rot('arm_r', loop((p) => [16 * wave(p), 0, 0])),
    rot('head', loop((p) => [-3 * wave(p * 2), -4 * wave(p), 0])),
  ]);

  // Double slam: both fists rise and hang (the tell, from 0.4 s, the seal
  // blazes), then crash down at 1.3 s; the shockwave lasts to 1.6 s.
  const attack = animation('Attack', 2.6, [
    rot('arm_l', poses([0, zero], [0.4, zero], [1.1, [-170, 0, -12]], [1.3, [-55, 0, 0], 'snap'], [1.6, [-50, 0, 0]], [2.6, zero])),
    rot('arm_r', poses([0, zero], [0.4, zero], [1.1, [-170, 0, 12]], [1.3, [-55, 0, 0], 'snap'], [1.6, [-50, 0, 0]], [2.6, zero])),
    rot('torso', poses([0, zero], [0.4, zero], [1.1, [-18, 0, 0]], [1.3, [24, 0, 0], 'snap'], [1.6, [22, 0, 0]], [2.6, zero])),
    mov('body', poses([0, zero], [1.1, [0, 0.12, -0.2]], [1.3, [0, -0.3, 0.3], 'snap'], [1.6, [0, -0.28, 0.28]], [2.6, zero])),
    rot('head', poses([0, zero], [1.1, [-20, 0, 0]], [1.3, [12, 0, 0], 'snap'], [2.6, zero])),
    rot('jaw', poses([0, zero], [1.1, [30, 0, 0]], [1.3, [38, 0, 0]], [2.6, zero])),
    scl('weak_point', poses([0, 1], [0.4, 1], [1.1, 1.5], [1.3, 1.7], [1.6, 1.2], [2.6, 1])),
    scl('eyes', poses([0, 1], [1.1, 1.5], [2.6, 1])),
  ]);

  // Sweep: the right arm draws back across the body (the tell, from 0.3 s)
  // and swings across the front at 1.0 s.
  const sweep = animation('Attack_sweep', 2.2, [
    rot('arm_r', poses([0, zero], [0.3, zero], [0.85, [-40, 70, -30]], [1.0, [-60, -80, -10], 'snap'], [1.2, [-55, -90, -10]], [2.2, zero])),
    rot('torso', poses([0, zero], [0.3, zero], [0.85, [0, 28, 0]], [1.0, [6, -30, 0], 'snap'], [1.2, [6, -34, 0]], [2.2, zero])),
    rot('head', poses([0, zero], [0.85, [-6, 20, 0]], [1.0, [0, -15, 0], 'snap'], [2.2, zero])),
    rot('jaw', poses([0, zero], [0.85, [25, 0, 0]], [1.2, [20, 0, 0]], [2.2, zero])),
    scl('eyes', poses([0, 1], [0.85, 1.4], [2.2, 1])),
  ]);

  const hit = animation('Hit', 0.7, [
    rot('torso', poses([0, zero], [0.1, [-10, 8, 0], 'snap'], [0.7, zero])),
    mov('body', poses([0, zero], [0.1, [0, 0, -0.25], 'snap'], [0.7, zero])),
    rot('head', poses([0, zero], [0.1, [-18, -12, 0], 'snap'], [0.7, zero])),
    scl('weak_point', poses([0, 1], [0.05, 0.4, 'snap'], [0.15, 1.5], [0.7, 1])),
  ]);

  // The seal breaks: it roars, falls to its knees and collapses forward,
  // and the light goes out of its eyes.
  const die = animation('Die', 3.6, [
    rot('head', poses([0, zero], [0.6, [-35, 0, 0]], [1.2, [-30, 0, 0]], [2.6, [30, 0, 0]], [3.6, [35, 0, 0]])),
    rot('jaw', poses([0, zero], [0.6, [45, 0, 0]], [1.4, [40, 0, 0]], [3.6, [25, 0, 0]])),
    scl('weak_point', poses([0, 1], [0.6, 2], [1.0, 0.05, 'snap'], [3.6, 0.05])),
    mov('body', poses([0, zero], [1.2, zero], [2.0, [0, -legH * 0.55, 0.1], 'in'], [2.8, [0, -legH * 0.8, 0.6], 'in'], [3.6, [0, -legH * 0.8, 0.6]])),
    rot('torso', poses([0, zero], [1.2, [-15, 0, 0]], [2.0, [20, 0, 0]], [2.8, [62, 0, 6], 'in'], [3.0, [58, 0, 6], 'out'], [3.6, [60, 0, 6]])),
    rot('leg_l', poses([0, zero], [1.2, zero], [2.0, [-75, 0, 0]], [3.6, [-80, 0, 0]])),
    rot('leg_r', poses([0, zero], [1.2, zero], [2.0, [-75, 0, 0]], [3.6, [-80, 0, 0]])),
    rot('arm_l', poses([0, zero], [0.6, [-40, 0, 35]], [2.8, [-60, 0, 25]], [3.6, [-55, 0, 25]])),
    rot('arm_r', poses([0, zero], [0.6, [-40, 0, -35]], [2.8, [-60, 0, -25]], [3.6, [-55, 0, -25]])),
    scl('eyes', poses([0, 1], [0.6, 1.6], [2.4, 0.8], [3.6, 0.05])),
  ]);

  return model(root, [idle, wake, move, attack, sweep, hit, die], {
    outline: 0.05,
    attacks: {
      Attack: { warn: 0.4, hit: 1.3, end: 1.6 },
      Attack_sweep: { warn: 0.3, hit: 1.0, end: 1.2 },
    },
  });
}

export const rootmaw: ModelEntry = { id: 'guardian-rootmaw', name: 'Rootmaw', type: 'guardian', create };
