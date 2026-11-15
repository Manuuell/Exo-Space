// Lander Overseer: a sub-boss of the depots on TRAPPIST-1 b, a machine of the
// planner AI. Adapted from NASA's Apollo Lunar Module (NASA 3D Resources,
// reference-models/nasa/apollo-lunar-module.glb): the gold-foil descent stage,
// the faceted ascent stage with its two windows, the docking hatch, the dish
// antenna, the thruster quads and four splayed legs with footpads. Rebuilt
// in voxel and turned into a walking machine about 4.5 m tall: the windows
// glow red like angry eyes, a claw arm hangs in front, and its weak point is
// the red core in the descent engine underneath. No insignia or text.

import { TAU, animation, block, light, loop, model, node, poses, rig, speckle } from './kit.ts';
import type { Model, ModelEntry, Vec3 } from './kit.ts';
import { shades } from './beasts.ts';

const BODY_Y = 2.3;
const GOLD = '#c9a24a';
const GOLD_DARK = '#9c7a2e';
const SILVER = '#b8bcc6';
const GREY = '#8a8f99';
const DARK = '#33363e';
const RED = '#ff3b2f';
const DEG = 180 / Math.PI;

/** A strut from one point to another in the Y–Z plane of its node. */
function strut(from: [number, number], to: [number, number], thick: number, colour: string) {
  const [y0, z0] = from;
  const [y1, z1] = to;
  const length = Math.hypot(y1 - y0, z1 - z0);
  return block(thick, thick, length, colour, { at: [0, (y0 + y1) / 2, (z0 + z1) / 2], rot: [-Math.atan2(y1 - y0, z1 - z0) * DEG, 0, 0] });
}

function create(): Model {
  // Four legs on the diagonals; each one reaches out and down to a footpad.
  const leg = (i: number, sx: number, sz: number) => {
    const ground = -BODY_Y + 0.1;
    return node(`leg_${i}`, { at: [0.7 * sx, -0.1, 0.7 * sz], rot: [0, Math.atan2(sx, sz) * DEG, 0] },
      strut([0, 0], [-0.5, 0.9], 0.16, SILVER),
      block(0.24, 0.24, 0.24, DARK, { at: [0, -0.5, 0.9] }),
      strut([-0.5, 0.9], [ground + 0.05, 1.5], 0.13, GOLD_DARK),
      strut([0.1, 0.3], [-0.5, 0.9], 0.07, GREY),
      block(0.62, 0.1, 0.62, GOLD_DARK, { at: [0, ground + 0.05, 1.5] }),
      block(0.5, 0.06, 0.5, GOLD, { at: [0, ground + 0.13, 1.5] }),
    );
  };

  const cabin = node('cabin', { at: [0, 0.85, 0.05] },
    block(1.4, 0.9, 1.2, SILVER),
    block(1.2, 0.6, 0.3, GREY, { at: [0, -0.05, 0.65], rot: [-15, 0, 0] }),
    ...speckle(shades(SILVER), { box: [1.4, 0.9, 1.2], faces: 'lrbt', count: 14, size: 0.08, seed: 11 }),
    // The two windows, glowing like angry eyes.
    node('eyes', { at: [0, 0.1, 0.8] },
      ...light(0.3, 0.16, 0.04, RED, { at: [0.28, 0, 0], rot: [0, 0, 18] }, 1.8),
      ...light(0.3, 0.16, 0.04, RED, { at: [-0.28, 0, 0], rot: [0, 0, -18] }, 1.8)),
    block(0.5, 0.2, 0.5, GREY, { at: [0, 0.55, 0] }),
    block(0.36, 0.06, 0.36, DARK, { at: [0, 0.67, 0] }),
    ...[[1, 1], [1, -1], [-1, 1], [-1, -1]].flatMap(([sx, sz]) => [
      block(0.14, 0.14, 0.14, DARK, { at: [0.76 * sx, 0.2, 0.5 * sz] }),
      block(0.06, 0.06, 0.2, DARK, { at: [0.76 * sx, 0.2, 0.5 * sz + 0.1 * sz] }),
      block(0.2, 0.06, 0.06, DARK, { at: [0.76 * sx + 0.1 * sx, 0.2, 0.5 * sz] }),
    ]),
    node('dish', { at: [0.55, 0.6, -0.35] },
      block(0.05, 0.4, 0.05, GREY, { at: [0, 0.2, 0] }),
      block(0.5, 0.06, 0.5, SILVER, { at: [0, 0.42, 0], rot: [30, 0, 0] }),
      block(0.04, 0.16, 0.04, DARK, { at: [0, 0.5, 0.05], rot: [30, 0, 0] })),
    block(0.03, 0.5, 0.03, GREY, { at: [-0.5, 0.7, -0.4], rot: [0, 0, 15] }),
    ...light(0.05, 0.05, 0.05, RED, { at: [-0.56, 0.95, -0.4] }, 1.5),
  );

  // The descent engine underneath, with the red core: the weak point.
  const engine = node('engine', { at: [0, -0.5, 0] },
    block(0.6, 0.3, 0.6, DARK, { at: [0, -0.1, 0] }),
    block(0.8, 0.12, 0.3, DARK, { at: [0, -0.3, 0] }),
    block(0.3, 0.12, 0.8, DARK, { at: [0, -0.3, 0] }),
    node('weak_point', { at: [0, -0.32, 0] }, ...light(0.5, 0.18, 0.5, RED, {}, 1.8)),
    node('flame', { at: [0, -0.45, 0], scale: 0.02 },
      ...[0, 1, 2, 3].flatMap((i) => light(0.25 + i * 0.12, 0.25, 0.25 + i * 0.12, i % 2 ? RED : '#ffb347', { at: [0, -0.15 - i * 0.25, 0] }, 1.6))),
  );

  const arm = node('arm', { at: [0, -0.35, 0.85] },
    block(0.24, 0.24, 0.24, DARK),
    block(0.16, 0.16, 0.7, GREY, { at: [0, 0, 0.35] }),
    node('claw', { at: [0, 0, 0.7], rot: [50, 0, 0] },
      block(0.2, 0.2, 0.2, DARK),
      block(0.14, 0.14, 0.6, SILVER, { at: [0, 0, 0.3] }),
      ...[[0.1, 0], [-0.1, 0], [0, 0.1]].flatMap(([x, y]) => [
        block(0.06, 0.06, 0.24, GREY, { at: [x, y, 0.68], rot: [y * 200, -x * 200, 0] }),
        block(0.05, 0.05, 0.08, RED, { at: [x * 1.5, y * 1.5, 0.82] }),
      ])),
  );

  const body = node('body', { at: [0, BODY_Y, 0] },
    // The descent stage, an octagon in gold foil.
    block(1.8, 0.9, 1.3, GOLD),
    block(1.3, 0.9, 1.8, GOLD),
    block(1.55, 0.88, 1.55, GOLD_DARK, { rot: [0, 45, 0] }),
    ...speckle(shades(GOLD), { box: [1.8, 0.9, 1.3], faces: 'lrfb', count: 24, size: 0.1, seed: 7 }),
    block(0.5, 0.4, 0.04, DARK, { at: [0, 0, 0.92] }),
    ...light(0.3, 0.04, 0.02, RED, { at: [0, 0.1, 0.945] }, 1.4),
    cabin,
    engine,
    arm,
    leg(0, 1, 1), leg(1, 1, -1), leg(2, -1, 1), leg(3, -1, -1),
  );

  const root = node('overseer', {}, body);
  const { rot, mov, scl } = rig(root);
  const wave = (p: number, shift = 0) => Math.sin((p + shift) * TAU);
  const zero: Vec3 = [0, 0, 0];

  const idle = animation('Idle', 2.6, [
    rot('cabin', loop((p) => [0, 10 * wave(p), 0])),
    rot('dish', loop((p) => [0, 35 * wave(p, 0.25), 0])),
    scl('eyes', loop((p) => 1 + 0.12 * wave(p * 2))),
    scl('weak_point', loop((p) => 1 + 0.1 * wave(p * 3))),
    rot('arm', loop((p) => [4 * wave(p), 6 * wave(p, 0.3), 0])),
    mov('body', loop((p) => [0, 0.02 * wave(p * 2), 0])),
  ]);

  // Powered down on folded legs; it boots at 1.0 s (the windows flicker on),
  // stands up and turns its cabin to the player.
  const folded: Vec3 = [0, -1.1, 0];
  const wake = animation('Wake', 3, [
    mov('body', poses([0, folded], [1.0, folded], [2.2, zero, 'out'], [3, zero])),
    ...[0, 1, 2, 3].map((i) => rot(`leg_${i}`, poses([0, [35, 0, 0]], [1.0, [35, 0, 0]], [2.2, zero, 'out'], [3, zero]))),
    scl('eyes', poses([0, 0.05], [1.0, 0.05], [1.05, 1.4, 'snap'], [1.15, 0.2], [1.25, 1.6, 'snap'], [2.2, 1.2], [3, 1])),
    rot('cabin', poses([0, [0, 40, 0]], [2.2, [0, 40, 0]], [2.6, [0, -5, 0]], [3, zero])),
    scl('weak_point', poses([0, 0.2], [1.0, 0.2], [1.6, 1.3], [3, 1])),
  ]);

  // A heavy walk on the diagonals.
  const move = animation('Move', 1.4, [
    rot('leg_0', loop((p) => [14 * wave(p), 0, 0])),
    rot('leg_3', loop((p) => [14 * wave(p), 0, 0])),
    rot('leg_1', loop((p) => [-14 * wave(p), 0, 0])),
    rot('leg_2', loop((p) => [-14 * wave(p), 0, 0])),
    mov('body', loop((p) => [0, 0.08 * Math.abs(wave(p)), 0])),
    rot('body', loop((p) => [2 * wave(p * 2), 0, 3 * wave(p)])),
  ]);

  // Claw slam: the arm rises and the claw opens (the tell, from 0.4 s), then
  // smashes down at 1.0 s.
  const attack = animation('Attack', 2, [
    rot('arm', poses([0, zero], [0.4, zero], [0.9, [-70, 0, 0]], [1.0, [35, 0, 0], 'snap'], [1.2, [32, 0, 0]], [2, zero])),
    rot('claw', poses([0, zero], [0.9, [-35, 0, 0]], [1.0, [10, 0, 0], 'snap'], [2, zero])),
    rot('body', poses([0, zero], [0.9, [-6, 0, 0]], [1.0, [8, 0, 0], 'snap'], [2, zero])),
    scl('eyes', poses([0, 1], [0.4, 1], [0.9, 1.6], [2, 1])),
  ]);

  // Engine blast: it crouches and its core blazes (the tell, from 0.4 s),
  // then hops and fires its descent engine at the ground at 1.1 s.
  const blast = animation('Attack_blast', 2.4, [
    mov('body', poses([0, zero], [0.4, zero], [1.0, [0, -0.4, 0]], [1.1, [0, 0.5, 0], 'snap'], [1.6, [0, 0.45, 0]], [1.9, zero, 'in'], [2.4, zero])),
    scl('weak_point', poses([0, 1], [0.4, 1], [1.0, 1.7], [1.6, 1.4], [2.4, 1])),
    scl('flame', poses([0, 1], [1.05, 1], [1.1, 40, 'snap'], [1.6, 38], [1.75, 1], [2.4, 1])),
    ...[0, 1, 2, 3].map((i) => rot(`leg_${i}`, poses([0, zero], [1.0, [20, 0, 0]], [1.1, [-10, 0, 0], 'snap'], [1.9, zero], [2.4, zero]))),
  ]);

  const hit = animation('Hit', 0.6, [
    rot('body', poses([0, zero], [0.08, [-6, 0, 6], 'snap'], [0.6, zero])),
    scl('eyes', poses([0, 1], [0.05, 0.2, 'snap'], [0.15, 1.5], [0.6, 1])),
    scl('weak_point', poses([0, 1], [0.05, 0.3, 'snap'], [0.6, 1])),
  ]);

  // Two legs buckle, it slumps onto one side, flickers and goes dark.
  const die = animation('Die', 3, [
    rot('leg_0', poses([0, zero], [0.8, [30, 0, 0]], [1.6, [45, 0, 0]], [3, [45, 0, 0]])),
    rot('leg_2', poses([0, zero], [0.8, [30, 0, 0]], [1.6, [45, 0, 0]], [3, [45, 0, 0]])),
    rot('body', poses([0, zero], [0.8, [8, 0, 0]], [1.6, [18, 0, 0], 'in'], [3, [18, 0, 0]])),
    mov('body', poses([0, zero], [1.6, [0, -0.9, 0.2], 'in'], [3, [0, -0.9, 0.2]])),
    rot('arm', poses([0, zero], [1.6, [60, 0, 0]], [3, [65, 0, 0]])),
    scl('eyes', poses([0, 1], [0.6, 1.5], [0.7, 0.2], [1.0, 1.2], [2.0, 0.6], [3, 0.05])),
    scl('weak_point', poses([0, 1], [0.8, 1.8], [1.0, 0.05, 'snap'], [3, 0.05])),
  ]);

  return model(root, [idle, wake, move, attack, blast, hit, die], {
    attacks: {
      Attack: { warn: 0.4, hit: 1.0, end: 1.2 },
      Attack_blast: { warn: 0.4, hit: 1.1, end: 1.6 },
    },
  });
}

export const overseer: ModelEntry = { id: 'subboss-overseer', name: 'Lander Overseer', type: 'guardian', create };
