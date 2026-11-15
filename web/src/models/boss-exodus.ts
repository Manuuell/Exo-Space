// Exodus Engine: the last boss. The planner AI's last great machine, built
// from the colony ship's own engine: a heavy walking tripod about 5.8 m tall
// with a white ceramic hull, black joints and gold trim. Armoured legs with
// pistons and clawed feet, a rotating collar of red eyes under a spiked crown,
// a cannon for one arm, a three-clawed grapple for the other, and the colony
// ship's twin engine burning on its back. Locked in its open core is the
// mega-rune, its weak point: defeating it sets the rune free, the only thing
// the final jump needs. Its own silhouette and palette. Detailed voxel.

import { TAU, animation, block, light, loop, model, node, poses, rig, speckle } from './kit.ts';
import type { Model, ModelEntry, Vec3 } from './kit.ts';
import { shades } from './beasts.ts';

const HUB_Y = 3.1;
const LEG_Y = -0.3;
const HULL = '#e8e6e1';
const HULL_DARK = '#bdb8ae';
const BLACK = '#1f2026';
const GOLD = '#d9a441';
const RED = '#ff3b2f';
const RUNE = '#fff3b0';
const ENGINE = '#ff8a3d';
const DEG = 180 / Math.PI;

type YZ = [number, number];
interface Span { x?: number; lift?: number; t0?: number; t1?: number }

/** Where a piece laid along the segment from → to (Y–Z plane) goes: `lift`
 *  moves it off the line along the piece's own up, `t0`–`t1` take part of it. */
function span(from: YZ, to: YZ, { x = 0, lift = 0, t0 = 0, t1 = 1 }: Span = {}) {
  const dy = to[0] - from[0];
  const dz = to[1] - from[1];
  const len = Math.hypot(dy, dz);
  const mid = (t0 + t1) / 2;
  const at: Vec3 = [x, from[0] + dy * mid + (dz / len) * lift, from[1] + dz * mid - (dy / len) * lift];
  const rot: Vec3 = [-Math.atan2(dy, dz) * DEG, 0, 0];
  return { len: len * (t1 - t0), place: { at, rot } };
}

function bar(from: YZ, to: YZ, w: number, h: number, colour: string, o: Span = {}) {
  const { len, place } = span(from, to, o);
  return block(w, h, len, colour, place);
}

function create(): Model {
  // Three armoured legs: two forward at the sides, one behind, so the core
  // faces out. The foot's sole sits on the ground.
  const ground = -(HUB_Y + LEG_Y) + 0.16;
  const knee: YZ = [1.3, 1.5];
  const ankle: YZ = [ground + 0.4, 2.6];
  // The hip holds the yaw, so the leg swings about its own axis.
  const leg = (i: number, yaw: number) => {
    const stripe = span(knee, ankle, { x: 0.23, t0: 0.12, t1: 0.82 });
    return node(`hip_${i}`, { at: [Math.sin(yaw / DEG) * 0.9, LEG_Y, Math.cos(yaw / DEG) * 0.9], rot: [0, yaw, 0] }, node(`leg_${i}`, {},
      block(0.7, 0.7, 0.7, BLACK),
      block(0.78, 0.12, 0.78, GOLD, { at: [0, 0.3, 0] }),
      bar([0, 0], knee, 0.5, 0.5, HULL),
      bar([0, 0], knee, 0.64, 0.14, HULL, { lift: 0.3, t0: 0.18, t1: 0.86 }),
      bar([0, 0], knee, 0.12, 0.06, GOLD, { lift: 0.39, t0: 0.25, t1: 0.8 }),
      block(0.7, 0.7, 0.7, GOLD, { at: [0, knee[0], knee[1]] }),
      block(0.22, 0.6, 0.22, BLACK, { at: [0, knee[0] + 0.55, knee[1] + 0.15], rot: [-20, 0, 0] }),
      bar(knee, ankle, 0.42, 0.42, HULL_DARK),
      bar(knee, ankle, 0.14, 0.14, BLACK, { lift: -0.3, t0: 0.08, t1: 0.72 }),
      ...light(0.04, 0.06, stripe.len, RED, stripe.place, 1.5),
      block(0.5, 0.5, 0.5, BLACK, { at: [0, ankle[0], ankle[1]] }),
      block(1.0, 0.32, 1.1, BLACK, { at: [0, ground, 2.6] }),
      block(0.8, 0.14, 0.8, HULL, { at: [0, ground + 0.23, 2.55] }),
      ...[-0.34, 0, 0.34].map((x) => block(0.18, 0.16, 0.5, GOLD, { at: [x, ground - 0.08, 3.3] })),
      block(0.2, 0.16, 0.4, GOLD, { at: [0, ground - 0.08, 1.9] }),
    ));
  };

  const shoulder = (side: number) => [
    block(0.65, 0.65, 0.65, BLACK),
    block(0.82, 0.3, 0.86, HULL, { at: [side * 0.1, 0.38, 0] }),
    block(0.84, 0.08, 0.88, GOLD, { at: [side * 0.1, 0.22, 0] }),
  ];

  // Cannon arm: hangs at the side, the barrel pointing forward.
  const cannon = node('arm_l', { at: [1.35, 0.2, 0.3] },
    ...shoulder(1),
    block(0.5, 0.7, 0.5, HULL, { at: [0.1, -0.4, 0] }),
    node('cannon', { at: [0.1, -0.85, 0.1] },
      block(0.55, 0.55, 0.55, GOLD),
      block(0.65, 0.65, 0.9, HULL, { at: [0, 0, 0.45] }),
      block(0.45, 0.45, 1.6, HULL_DARK, { at: [0, 0, 1.6] }),
      ...[1.1, 1.65, 2.2].map((z) => block(0.55, 0.55, 0.12, GOLD, { at: [0, 0, z] })),
      block(0.58, 0.58, 0.2, BLACK, { at: [0, 0, 2.42] }),
      ...light(0.04, 0.12, 0.6, RED, { at: [0.34, 0, 0.45] }, 1.5),
      ...light(0.04, 0.12, 0.6, RED, { at: [-0.34, 0, 0.45] }, 1.5),
      node('charge', { at: [0, 0, 2.54] }, ...light(0.32, 0.32, 0.08, RED, {}, 1.8))),
  );

  // Grapple arm: a long hanging arm ending in three claws.
  const grapple = node('arm_r', { at: [-1.35, 0.2, 0.3] },
    ...shoulder(-1),
    block(0.5, 1.0, 0.5, HULL, { at: [-0.1, -0.6, 0] }),
    block(0.55, 0.55, 0.55, GOLD, { at: [-0.1, -1.2, 0] }),
    block(0.45, 0.55, 0.45, HULL_DARK, { at: [-0.1, -1.55, 0] }),
    node('claw', { at: [-0.1, -1.85, 0] },
      block(0.7, 0.35, 0.7, BLACK),
      ...[[0.28, -0.12], [-0.28, -0.12], [0, 0.28]].flatMap(([x, z], i) => [
        block(0.16, 0.85, 0.16, HULL_DARK, { at: [x, -0.5, z], rot: [z * -80, 0, x * 80] }),
        block(0.13, 0.32, 0.13, i === 2 ? RED : GOLD, { at: [x * 1.6, -0.98, z * 1.6], rot: [z * 90, 0, x * -90] }),
      ])),
  );

  // A collar of red eyes that turns under the head, and a spiked crown.
  const head = node('head', { at: [0, 1.25, 0] },
    block(0.7, 0.4, 0.7, BLACK, { at: [0, -0.1, 0] }),
    node('eyes', { at: [0, 0.05, 0] },
      ...Array.from({ length: 8 }, (_, k) => {
        const a = (k / 8) * TAU;
        const yaw = (k / 8) * 360;
        return [
          block(0.62, 0.26, 0.18, BLACK, { at: [Math.sin(a) * 0.75, 0, Math.cos(a) * 0.75], rot: [0, yaw, 0] }),
          ...light(0.24, 0.1, 0.04, RED, { at: [Math.sin(a) * 0.85, 0, Math.cos(a) * 0.85], rot: [0, yaw, 0] }, 1.6),
        ];
      }).flat()),
    block(1.15, 0.7, 1.15, HULL, { at: [0, 0.55, 0] }),
    block(1.22, 0.1, 1.22, GOLD, { at: [0, 0.25, 0] }),
    block(0.9, 0.16, 0.05, BLACK, { at: [0, 0.62, 0.58] }),
    ...light(0.7, 0.06, 0.04, RED, { at: [0, 0.62, 0.61] }, 1.5),
    ...[1, -1].map((s) => block(0.06, 0.4, 0.6, GOLD, { at: [s * 0.6, 0.5, 0] })),
    ...speckle(shades(HULL), { box: [1.15, 0.7, 1.15], at: [0, 0.55, 0], faces: 'lrb', count: 6, size: 0.08, seed: 11 }),
    ...[0, 72, 144, 216, 288].map((d, k) => {
      const a = d / DEG;
      const len = k % 2 ? 0.55 : 0.4;
      return block(0.14, len, 0.14, k % 2 ? GOLD : HULL_DARK, { at: [Math.sin(a) * 0.4, 0.9 + len / 2, Math.cos(a) * 0.4], rot: [Math.cos(a) * 15, 0, Math.sin(a) * -15] });
    }),
  );

  // The colony ship's twin engine, burning on its back, either side of the
  // rear leg.
  const pods = [0.7, -0.7].flatMap((x) => [
    block(0.7, 0.9, 0.45, BLACK, { at: [x, 0.1, -1.32] }),
    block(0.55, 0.55, 0.3, HULL_DARK, { at: [x, 0.1, -1.68] }),
    block(0.66, 0.66, 0.1, GOLD, { at: [x, 0.1, -1.84] }),
  ]);
  const engine = node('engine', { at: [0, 0.1, -1.91] },
    ...light(0.4, 0.4, 0.04, ENGINE, { at: [0.7, 0, 0] }, 1.8),
    ...light(0.4, 0.4, 0.04, ENGINE, { at: [-0.7, 0, 0] }, 1.8));

  const body = node('body', { at: [0, HUB_Y, 0] },
    block(2.2, 1.6, 2.2, HULL),
    ...[1, -1].map((s) => block(0.12, 1.3, 1.6, HULL_DARK, { at: [s * 1.14, 0, -0.1] })),
    block(1.6, 1.3, 0.12, HULL_DARK, { at: [0, 0, -1.14] }),
    block(2.3, 0.12, 2.3, GOLD, { at: [0, 0.62, 0] }),
    block(1.8, 0.25, 1.8, HULL_DARK, { at: [0, 0.92, 0] }),
    block(2.3, 0.2, 2.3, BLACK, { at: [0, -0.7, 0] }),
    block(1.4, 0.35, 1.4, BLACK, { at: [0, -0.95, 0] }),
    block(0.8, 0.2, 0.8, GOLD, { at: [0, -1.2, 0] }),
    ...speckle(shades(HULL), { box: [2.2, 1.6, 2.2], faces: 'lrb', count: 16, size: 0.1, seed: 7 }),
    // The open core with the mega-rune locked inside: the weak point.
    block(1.35, 1.35, 0.1, BLACK, { at: [0, 0, 1.13] }),
    ...[1, -1].flatMap((s) => [
      block(1.5, 0.14, 0.16, GOLD, { at: [0, s * 0.72, 1.17] }),
      block(0.14, 1.5, 0.16, GOLD, { at: [s * 0.72, 0, 1.17] }),
    ]),
    node('weak_point', { at: [0, 0, 1.22], rot: [0, 0, 45] }, ...light(0.62, 0.62, 0.12, RUNE, {}, 2.0)),
    ...[-0.3, 0.3].map((x) => block(0.08, 1.3, 0.08, GOLD, { at: [x, 0, 1.36] })),
    ...pods,
    engine,
    head,
    cannon,
    grapple,
    leg(0, 50), leg(1, -50), leg(2, 180),
  );

  const root = node('exodus', {}, body);
  const { rot, mov, scl } = rig(root);
  const wave = (p: number, shift = 0) => Math.sin((p + shift) * TAU);
  const zero: Vec3 = [0, 0, 0];

  const idle = animation('Idle', 4, [
    rot('eyes', loop((p) => [0, 720 * p, 0])),
    mov('body', loop((p) => [0, 0.06 * wave(p), 0])),
    rot('body', loop((p) => [0, 4 * wave(p), 1.5 * wave(p, 0.25)])),
    rot('head', loop((p) => [3 * wave(p, 0.5), 10 * wave(p), 0])),
    rot('arm_l', loop((p) => [4 * wave(p, 0.2), 0, 0])),
    rot('arm_r', loop((p) => [-4 * wave(p, 0.2), 0, 0])),
    rot('claw', loop((p) => [0, 20 * wave(p), 0])),
    scl('weak_point', loop((p) => 1 + 0.12 * wave(p * 2))),
    scl('charge', loop((p) => 0.8 + 0.2 * wave(p * 4))),
    scl('engine', loop((p) => 1 + 0.15 * wave(p * 4))),
  ]);

  // Crouched, head down and dark. The engine coughs alight at 0.7 s, the eye
  // collar lights and spins up at 1.2 s, then it rises on its three legs and
  // spreads its arms at 2.6 s. The crouch lowers the hub as far as the bent
  // legs lift the feet, so the feet stay on the ground.
  const low: Vec3 = [0, -1.0, 0];
  const crouch: Vec3 = [-19, 0, 0];
  const wake = animation('Wake', 3.6, [
    mov('body', poses([0, low], [1.2, low], [2.6, [0, 0.15, 0], 'out'], [3.6, zero])),
    ...[0, 1, 2].map((i) => rot(`leg_${i}`, poses([0, crouch], [1.2, crouch], [2.6, zero, 'out'], [3.6, zero]))),
    rot('head', poses([0, [25, 0, 0]], [1.2, [25, 0, 0]], [2.4, [-10, 0, 0], 'out'], [3.6, zero])),
    rot('eyes', poses([0, zero], [1.2, zero], [3.6, [0, 1080, 0], 'in'])),
    scl('eyes', poses([0, 0.05], [1.15, 0.05], [1.25, 1.4, 'snap'], [3.6, 1])),
    scl('engine', poses([0, 0.05], [0.6, 0.05], [0.7, 1.6, 'snap'], [1.2, 0.8], [3.6, 1])),
    rot('arm_l', poses([0, [60, 0, 0]], [2.2, [60, 0, 0]], [2.8, [-30, 0, 25]], [3.6, zero])),
    rot('arm_r', poses([0, [60, 0, 0]], [2.2, [60, 0, 0]], [2.8, [-30, 0, -25]], [3.6, zero])),
    scl('weak_point', poses([0, 0.4], [1.2, 0.4], [2.6, 1.4], [3.6, 1])),
  ]);

  // A tripod's walk: one leg after another, the hub swaying.
  const move = animation('Move', 2.1, [
    ...[0, 1, 2].map((i) => rot(`leg_${i}`, loop((p) => [-14 * Math.max(0, wave(p, i / 3)), 0, 0]))),
    mov('body', loop((p) => [0, 0.08 * wave(p * 3), 0])),
    rot('body', loop((p) => [2 * wave(p * 3), 6 * wave(p), 0])),
    rot('eyes', loop((p) => [0, 720 * p, 0])),
    scl('engine', loop((p) => 1.1 + 0.2 * wave(p * 3))),
  ]);

  // Cannon: it aims and the muzzle charges red (the tell, from 0.5 s), then
  // fires at 1.4 s.
  const attack = animation('Attack', 2.4, [
    rot('arm_l', poses([0, zero], [0.5, zero], [1.1, [-12, -15, 0]], [1.4, [-22, -15, 0], 'snap'], [1.7, [-14, -15, 0]], [2.4, zero])),
    scl('charge', poses([0, 1], [0.5, 1], [1.35, 2.4], [1.4, 3.6, 'snap'], [1.6, 1.3], [2.4, 1])),
    rot('body', poses([0, zero], [1.1, [0, 12, 0]], [1.4, [-4, 12, 0], 'snap'], [2.4, zero])),
    rot('head', poses([0, zero], [1.1, [0, 15, 0]], [2.4, zero])),
    scl('eyes', poses([0, 1], [1.1, 1.5], [2.4, 1])),
  ]);

  // Grapple: the claw rises and opens (the tell, from 0.4 s), then slams
  // forward at 1.1 s.
  const grab = animation('Attack_grapple', 2.2, [
    rot('arm_r', poses([0, zero], [0.4, zero], [0.95, [-110, 0, -20]], [1.1, [-35, 0, 0], 'snap'], [1.35, [-32, 0, 0]], [2.2, zero])),
    rot('claw', poses([0, zero], [0.95, [-30, 0, 0]], [1.1, [15, 0, 0], 'snap'], [2.2, zero])),
    mov('body', poses([0, zero], [0.95, [0, 0.1, -0.2]], [1.1, [0, -0.15, 0.5], 'snap'], [1.35, [0, -0.15, 0.45]], [2.2, zero])),
    scl('eyes', poses([0, 1], [0.95, 1.5], [2.2, 1])),
  ]);

  const hit = animation('Hit', 0.7, [
    rot('body', poses([0, zero], [0.1, [-8, 10, 0], 'snap'], [0.7, zero])),
    mov('body', poses([0, zero], [0.1, [0, 0.1, -0.3], 'snap'], [0.7, zero])),
    scl('weak_point', poses([0, 1], [0.05, 0.4, 'snap'], [0.15, 1.6], [0.7, 1])),
    scl('eyes', poses([0, 1], [0.05, 0.3, 'snap'], [0.7, 1])),
    scl('engine', poses([0, 1], [0.05, 0.3, 'snap'], [0.7, 1])),
  ]);

  // The legs buckle and the hub crashes down on its belly; the arms fall
  // aside, the eyes and the engine go out, and the mega-rune is left free
  // and blazing.
  const die = animation('Die', 3.6, [
    ...[0, 1, 2].map((i) => rot(`leg_${i}`, poses([0, zero], [0.8, [8, 0, 0]], [2.2, [-28, 0, i === 2 ? 0 : 8], 'in'], [3.6, [-29, 0, i === 2 ? 0 : 8]]))),
    mov('body', poses([0, zero], [0.8, [0, 0.2, 0]], [2.2, [0, -1.55, 0.2], 'in'], [2.4, [0, -1.42, 0.2], 'out'], [3.6, [0, -1.48, 0.2]])),
    rot('body', poses([0, zero], [2.2, [8, 0, 6]], [3.6, [7, 0, 6]])),
    rot('head', poses([0, zero], [2.2, [30, 0, 10]], [3.6, [32, 0, 10]])),
    rot('arm_l', poses([0, zero], [2.2, [-15, 0, 55]], [3.6, [-15, 0, 58]])),
    rot('arm_r', poses([0, zero], [2.2, [-15, 0, -55]], [3.6, [-15, 0, -58]])),
    rot('eyes', poses([0, zero], [1.6, [0, 200, 0], 'out'], [3.6, [0, 220, 0]])),
    scl('eyes', poses([0, 1], [1.0, 1.6], [2.4, 0.4], [3.6, 0.05])),
    scl('engine', poses([0, 1], [0.8, 1.6], [2.4, 0.3], [3.6, 0.05])),
    scl('weak_point', poses([0, 1], [2.2, 1.2], [2.6, 2.2], [3.6, 1.8])),
  ]);

  return model(root, [idle, wake, move, attack, grab, hit, die], {
    attacks: {
      Attack: { warn: 0.5, hit: 1.4, end: 1.6 },
      Attack_grapple: { warn: 0.4, hit: 1.1, end: 1.35 },
    },
  });
}

export const exodus: ModelEntry = { id: 'boss-exodus', name: 'Exodus Engine', type: 'guardian', create };
