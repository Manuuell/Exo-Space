// Cinder Hermit: a sub-boss of the ruins of TRAPPIST-1 b. A giant hermit crab
// that carries a volcano for a shell, about 3.5 m tall: a stepped cone of
// obsidian with lava running down it and a glowing crater, a crab body in
// orange-red plates, one giant claw and one small one, eyes on stalks and
// eight legs. Its weak point is the molten heart showing in the mouth of the
// shell, above its body. Its own palette (obsidian and orange-red plates),
// unlike the black basalt of b's other creatures; what glows takes the
// star's orange. Detailed voxel.

import { TAU, animation, block, light, loop, model, node, poses, rig, speckle } from './kit.ts';
import type { Model, ModelEntry, Vec3 } from './kit.ts';
import { TRAPPIST_1 } from './contract.ts';
import { shades } from './beasts.ts';
import { faunaLook } from './fauna.ts';

const BODY_Y = 0.9;
const PLATE = '#b8441f';
const PLATE_DARK = '#8a2f16';
const OBSIDIAN = '#1e1a22';
const OBSIDIAN_LIGHT = '#34303c';
const BONE = '#f0d9b0';
const HEART = '#ffe08a';
const DEG = 180 / Math.PI;

function create(): Model {
  const G = faunaLook(TRAPPIST_1.b).glow;

  /** A segment from one point to another in the X–Y plane of its node. */
  const segment = (from: [number, number], to: [number, number], thick: number, colour: string) => {
    const [x0, y0] = from;
    const [x1, y1] = to;
    return block(Math.hypot(x1 - x0, y1 - y0), thick, thick, colour, { at: [(x0 + x1) / 2, (y0 + y1) / 2, 0], rot: [0, 0, Math.atan2(y1 - y0, x1 - x0) * DEG] });
  };

  const leg = (name: string, s: number, z: number, yaw: number) => {
    const fy = -(BODY_Y - 0.15) + 0.05;
    return node(name, { at: [0.7 * s, -0.15, z], rot: [0, yaw * s, 0], scale: [s, 1, 1] },
      segment([0, 0], [0.7, 0.35], 0.16, PLATE_DARK),
      block(0.2, 0.2, 0.2, OBSIDIAN, { at: [0.7, 0.35, 0] }),
      segment([0.7, 0.35], [1.15, fy], 0.13, PLATE),
      block(0.08, 0.12, 0.08, BONE, { at: [1.15, fy + 0.01, 0] }),
    );
  };

  const claw = (side: 'l' | 'r') => {
    const s = side === 'l' ? 1 : -1;
    return node(`claw_${side}`, { at: [0.85 * s, 0, 0.75], rot: [0, -20 * s, 0], scale: side === 'l' ? 1 : 0.55 },
      block(0.4, 0.4, 0.6, PLATE_DARK, { at: [0, 0, 0.3] }),
      node(`pincer_${side}`, { at: [0, 0, 0.65] },
        block(0.8, 0.7, 0.8, PLATE, { at: [0, 0.1, 0.35] }),
        ...speckle(shades(PLATE), { box: [0.8, 0.7, 0.8], at: [0, 0.1, 0.35], faces: 'lrt', count: 6, size: 0.08, seed: 3 + s }),
        block(0.3, 0.3, 0.7, PLATE, { at: [0.18 * s, 0.15, 0.95] }),
        ...[0.75, 0.95, 1.15].map((z) => block(0.06, 0.08, 0.06, BONE, { at: [0.1 * s, -0.02, z] })),
        ...light(0.04, 0.3, 0.02, G, { at: [0.405 * s, 0.1, 0.35], rot: [0, 90, 0] }, 1.4),
        node(`pincer_${side}_jaw`, { at: [-0.15 * s, -0.15, 0.6] },
          block(0.25, 0.28, 0.65, OBSIDIAN_LIGHT, { at: [0, 0, 0.32] }),
          ...[0.2, 0.4].map((z) => block(0.06, 0.08, 0.06, BONE, { at: [0.08 * s, 0.16, z] })))),
    );
  };

  // The volcano shell: a stepped cone with lava streaks and a glowing crater.
  const tiers: [number, number, number, number][] = [[2.2, 0.7, 2.0, 0.35], [1.8, 0.6, 1.6, 0.95], [1.4, 0.55, 1.2, 1.5], [1.0, 0.5, 0.85, 2.0]];
  const shell = node('shell', { at: [0, 0.2, -0.5] },
    ...tiers.map(([w, h, d, y], i) => block(w, h, d, i % 2 ? OBSIDIAN_LIGHT : OBSIDIAN, { at: [0, y, 0] })),
    ...speckle(shades(OBSIDIAN_LIGHT), { box: [2.2, 0.7, 2.0], at: [0, 0.35, 0], faces: 'lrb', count: 18, size: 0.12, seed: 7 }),
    ...speckle([PLATE, PLATE_DARK], { box: [1.8, 0.6, 1.6], at: [0, 0.95, 0], faces: 'lrb', count: 10, size: 0.1, seed: 9 }),
    block(0.8, 0.2, 0.7, OBSIDIAN, { at: [0, 2.35, 0] }),
    node('crater', { at: [0, 2.42, 0] }, ...light(0.5, 0.1, 0.45, G, {}, 1.8)),
    // Lava running down the sides and the back.
    ...[[-0.45, -1], [0.5, -1], [0.92, 0], [-0.92, 0.2]].flatMap(([x, z]) =>
      [0, 1, 2].flatMap((i) => light(0.08, 0.45, 0.04, G, { at: [x * (1 - i * 0.2), 2.0 - i * 0.6, z === -1 ? -(0.43 + i * 0.18) : z], rot: [0, z === -1 ? 0 : 90, 0] }, 1.3))),
    node('eruption', { at: [0, 2.6, 0], scale: 0.02 },
      ...[0, 1, 2, 3].flatMap((i) => light(0.5 - i * 0.08, 0.35, 0.5 - i * 0.08, i % 2 ? G : HEART, { at: [0, i * 0.35, 0] }, 1.6))),
    // The molten heart in the mouth of the shell: the weak point.
    node('weak_point', { at: [0, 1.0, 0.82] },
      ...light(0.7, 0.42, 0.06, HEART, {}, 1.7),
      block(0.85, 0.08, 0.08, OBSIDIAN, { at: [0, 0.26, 0] }),
      block(0.08, 0.5, 0.08, OBSIDIAN, { at: [0.42, 0, 0] }),
      block(0.08, 0.5, 0.08, OBSIDIAN, { at: [-0.42, 0, 0] })),
  );

  const eyes = node('eyes', { at: [0, 0.3, 0.85] },
    ...[1, -1].flatMap((s) => [
      block(0.1, 0.6, 0.1, OBSIDIAN, { at: [0.3 * s, 0.3, 0] }),
      ...light(0.18, 0.18, 0.18, G, { at: [0.3 * s, 0.65, 0] }, 1.6),
      block(0.24, 0.06, 0.1, PLATE_DARK, { at: [0.3 * s, 0.78, 0.04], rot: [0, 0, 18 * s] }),
    ]),
  );

  const body = node('body', { at: [0, BODY_Y, 0] },
    block(1.6, 0.6, 1.0, PLATE, { at: [0, 0, 0.5] }),
    block(1.4, 0.25, 0.9, OBSIDIAN, { at: [0, -0.38, 0.5] }),
    ...speckle(shades(PLATE), { box: [1.6, 0.6, 1.0], at: [0, 0, 0.5], faces: 'lrt', count: 10, size: 0.08, seed: 11 }),
    ...[-0.2, 0, 0.2].map((x) => block(0.08, 0.16, 0.08, BONE, { at: [x, -0.32, 1.02] })),
    eyes,
    claw('l'),
    claw('r'),
    ...[1, -1].flatMap((s) => {
      const side = s > 0 ? 'l' : 'r';
      return [leg(`leg_${side}1`, s, 0.75, -30), leg(`leg_${side}2`, s, 0.45, -10), leg(`leg_${side}3`, s, 0.15, 10), leg(`leg_${side}4`, s, -0.15, 30)];
    }),
    shell,
  );

  const root = node('cinderhermit', {}, body);
  const { rot, mov, scl } = rig(root);
  const wave = (p: number, shift = 0) => Math.sin((p + shift) * TAU);
  const zero: Vec3 = [0, 0, 0];
  const legs = ['l1', 'l2', 'l3', 'l4', 'r1', 'r2', 'r3', 'r4'];

  const idle = animation('Idle', 3, [
    rot('pincer_l_jaw', loop((p) => [0, -14 * Math.abs(wave(p)), 0])),
    rot('pincer_r_jaw', loop((p) => [0, 14 * Math.abs(wave(p, 0.3)), 0])),
    rot('claw_l', loop((p) => [4 * wave(p), 4 * wave(p, 0.2), 0])),
    rot('eyes', loop((p) => [5 * wave(p, 0.4), 12 * wave(p), 0])),
    scl('crater', loop((p) => 1 + 0.2 * wave(p * 2))),
    scl('weak_point', loop((p) => 1 + 0.1 * wave(p * 2, 0.25))),
    mov('body', loop((p) => [0, 0.02 * wave(p), 0])),
  ]);

  // A dormant volcano: sunk low with its eyes drawn in; the eyes pop up at
  // 1.0 s, it rises at 2.0 s and lifts its great claw.
  const low: Vec3 = [0, -0.75, 0];
  const wake = animation('Wake', 3, [
    mov('body', poses([0, low], [1.0, low], [2.0, zero, 'out'], [3, zero])),
    scl('eyes', poses([0, 0.05], [0.95, 0.05], [1.15, 1.2, 'back'], [3, 1])),
    rot('claw_l', poses([0, [20, 30, 0]], [1.6, [20, 30, 0]], [2.4, [-50, 0, 0]], [3, zero])),
    rot('claw_r', poses([0, [20, -30, 0]], [1.6, [20, -30, 0]], [2.4, zero])),
    scl('crater', poses([0, 0.3], [1.0, 0.3], [2.4, 2], [3, 1])),
    scl('weak_point', poses([0, 0.3], [1.0, 0.3], [2.2, 1.3], [3, 1])),
  ]);

  // Scuttling: the legs move in two alternating groups, the shell rocks.
  const move = animation('Move', 1, [
    ...legs.map((l, i) => rot(`leg_${l}`, loop((p) => [0, 14 * (i % 2 ? 1 : -1) * wave(p), 0]))),
    rot('body', loop((p) => [0, 0, 3 * wave(p)])),
    mov('body', loop((p) => [0, 0.04 * wave(p * 2), 0])),
  ]);

  // Smash: the great claw rises and opens (the tell, from 0.4 s), then
  // crashes down at 1.1 s.
  const attack = animation('Attack', 2.2, [
    rot('claw_l', poses([0, zero], [0.4, zero], [1.0, [-75, 10, 0]], [1.1, [35, 0, 0], 'snap'], [1.3, [32, 0, 0]], [2.2, zero])),
    rot('pincer_l_jaw', poses([0, zero], [1.0, [0, -35, 0]], [1.1, zero, 'snap'], [2.2, zero])),
    rot('body', poses([0, zero], [1.0, [-6, 0, 4]], [1.1, [6, 0, -2], 'snap'], [2.2, zero])),
    scl('eyes', poses([0, 1], [1.0, 1.35], [2.2, 1])),
  ]);

  // Eruption: it squats while the crater and its heart blaze (the tell, from
  // 0.5 s), then the volcano erupts at 1.3 s.
  const erupt = animation('Attack_eruption', 2.6, [
    mov('body', poses([0, zero], [0.5, zero], [1.2, [0, -0.22, 0]], [1.3, [0, 0.1, 0], 'snap'], [1.9, [0, 0.05, 0]], [2.6, zero])),
    scl('crater', poses([0, 1], [0.5, 1], [1.2, 2.2], [1.9, 2.5], [2.6, 1])),
    scl('eruption', poses([0, 1], [1.25, 1], [1.3, 45, 'snap'], [1.9, 40], [2.1, 1], [2.6, 1])),
    scl('weak_point', poses([0, 1], [0.5, 1], [1.2, 1.6], [1.9, 1.3], [2.6, 1])),
    rot('claw_l', poses([0, zero], [1.2, [10, 25, 0]], [2.6, zero])),
    rot('claw_r', poses([0, zero], [1.2, [10, -25, 0]], [2.6, zero])),
  ]);

  const hit = animation('Hit', 0.6, [
    mov('body', poses([0, zero], [0.08, [0, 0.05, -0.2], 'snap'], [0.6, zero])),
    rot('body', poses([0, zero], [0.08, [-8, 6, 0], 'snap'], [0.6, zero])),
    scl('weak_point', poses([0, 1], [0.05, 0.4, 'snap'], [0.15, 1.5], [0.6, 1])),
  ]);

  // It sinks, the claws drop, the eyes droop and the volcano cools.
  const die = animation('Die', 3, [
    mov('body', poses([0, zero], [0.4, [0, 0.1, 0]], [1.8, [0, -0.6, 0], 'in'], [3, [0, -0.62, 0]])),
    rot('body', poses([0, zero], [1.8, [6, 0, 10]], [3, [6, 0, 10]])),
    rot('claw_l', poses([0, zero], [1.8, [30, 20, 0]], [3, [32, 20, 0]])),
    rot('claw_r', poses([0, zero], [1.8, [30, -20, 0]], [3, [32, -20, 0]])),
    rot('eyes', poses([0, zero], [1.8, [50, 0, 0]], [3, [55, 0, 0]])),
    scl('crater', poses([0, 1], [0.4, 2], [2.4, 0.3], [3, 0.05])),
    scl('weak_point', poses([0, 1], [0.4, 1.8], [0.7, 0.05, 'snap'], [3, 0.05])),
  ]);

  return model(root, [idle, wake, move, attack, erupt, hit, die], {
    attacks: {
      Attack: { warn: 0.4, hit: 1.1, end: 1.3 },
      Attack_eruption: { warn: 0.5, hit: 1.3, end: 1.9 },
    },
  });
}

export const cinderhermit: ModelEntry = { id: 'subboss-cinderhermit', name: 'Cinder Hermit', type: 'guardian', create };
