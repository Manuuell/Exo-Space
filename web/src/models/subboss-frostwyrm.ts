// Frost Wyrm: a sub-boss of the ruins of TRAPPIST-1 h. A serpent that rises
// out of the ice from a coil on the ground, about 5 m tall: deep navy scales
// crusted with frost, cyan crystal spines down its back, a horned head with
// crystal horns and frills, a jaw of ice fangs and a freezing breath. Its
// weak point is the warm core glowing between the ice plates of its chest.
// Its own palette (deep navy and frost), unlike the pale ice of h's other
// creatures; its eyes take the star's orange. Detailed voxel.

import { TAU, animation, block, light, loop, model, node, poses, rig, speckle } from './kit.ts';
import type { Model, ModelEntry, Vec3 } from './kit.ts';
import { TRAPPIST_1 } from './contract.ts';
import { angryEyes, shades, teeth } from './beasts.ts';
import { faunaLook } from './fauna.ts';

const SCALE = '#1f3b6e';
const SCALE_DARK = '#152a50';
const FROST = '#e6f2ff';
const CRYSTAL = '#7fe0ff';
const BELLY = '#9fb8d8';
const CORE = '#ffd27a';
const BREATH = '#dff8ff';

function create(): Model {
  const G = faunaLook(TRAPPIST_1.h).glow;

  /** One segment of the neck: a block with a belly plate, frost and a spine. */
  const segment = (w: number, h: number, d: number, k: number) => [
    block(w, h, d, k % 2 ? SCALE_DARK : SCALE, { at: [0, h / 2, 0] }),
    block(w * 0.72, h * 0.9, 0.06, BELLY, { at: [0, h / 2, d / 2 + 0.02] }),
    ...speckle([FROST, '#c9dcf2', SCALE], { box: [w, h, d], at: [0, h / 2, 0], faces: 'lrb', count: 7, size: 0.08, seed: 20 + k }),
    block(0.12, 0.36, 0.14, CRYSTAL, { at: [0, h * 0.5, -d / 2 - 0.08], rot: [-35, 0, 0] }),
    block(0.07, 0.2, 0.08, FROST, { at: [0, h * 0.5 + 0.2, -d / 2 - 0.2], rot: [-50, 0, 0] }),
  ];

  const breath = node('breath', { at: [0, 0.05, 1.15], scale: 0.02 },
    ...[0, 1, 2, 3, 4, 5].flatMap((i) => light(0.15 + i * 0.07, 0.15 + i * 0.07, 0.25, i % 2 ? CRYSTAL : BREATH, { at: [0, 0, 0.1 + i * 0.27] }, 1.6)),
  );

  const head = node('head', { at: [0, 0.8, 0], rot: [-22, 0, 0] },
    block(0.85, 0.55, 0.95, SCALE, { at: [0, 0.25, 0.3] }),
    block(0.6, 0.35, 0.6, SCALE, { at: [0, 0.15, 0.85] }),
    block(0.62, 0.08, 0.5, FROST, { at: [0, 0.36, 0.9] }),
    angryEyes('eyes', { at: [0, 0.38, 0.79], gap: 0.4, size: [0.13, 0.06], glow: G, brow: SCALE_DARK, tilt: 24 }),
    // Crystal horns sweeping back and frills at the sides.
    ...[1, -1].flatMap((s) => [0, 1, 2, 3].map((i) =>
      block(0.16 - i * 0.03, 0.16 - i * 0.03, 0.3, i === 3 ? FROST : CRYSTAL, { at: [s * (0.3 + i * 0.07), 0.55 + i * 0.13, 0.05 - i * 0.2], rot: [-30 - i * 8, s * 15, 0] }))),
    ...[1, -1].flatMap((s) => [0, 1, 2].map((i) =>
      block(0.06, 0.32 - i * 0.07, 0.22, FROST, { at: [s * 0.45, 0.2 + i * 0.02, 0.15 - i * 0.22], rot: [0, 0, s * -25] }))),
    ...teeth(-0.24, 0.24, 7, -0.02, 1.12, 0.05, FROST),
    block(0.5, 0.05, 0.5, '#2a1640', { at: [0, -0.02, 0.85] }),
    node('jaw', { at: [0, -0.02, 0.35] },
      block(0.58, 0.18, 0.75, SCALE_DARK, { at: [0, -0.09, 0.38] }),
      ...teeth(-0.22, 0.22, 6, 0, 0.74, 0.045, FROST, true)),
    breath,
  );

  // The neck: five segments, each sitting on the last, in an S curve.
  const sizes: [number, number, number, number][] = [[0.92, 0.85, 0.8, 14], [0.84, 0.85, 0.74, 16], [0.76, 0.85, 0.68, 12], [0.68, 0.8, 0.62, -18]];
  let neck: ReturnType<typeof node> = head;
  sizes.slice().reverse().forEach(([w, h, d, angle], j) => {
    const k = sizes.length - j + 1;
    const extra = k === 2 ? [node('weak_point', { at: [0, 0.45, d / 2 + 0.05] },
      ...light(0.42, 0.42, 0.06, CORE, {}, 1.8),
      block(0.56, 0.08, 0.1, FROST, { at: [0, 0.25, 0] }),
      block(0.56, 0.08, 0.1, FROST, { at: [0, -0.25, 0] }),
      block(0.08, 0.42, 0.1, FROST, { at: [0.27, 0, 0] }),
      block(0.08, 0.42, 0.1, FROST, { at: [-0.27, 0, 0] }))] : [];
    neck = node(`seg_${k}`, { at: [0, sizes[k - 3]?.[1] ?? 0.9, 0], rot: [angle, 0, 0] }, ...segment(w, h, d, k), ...extra, neck);
  });
  const seg1 = node('seg_1', { at: [0, 0.3, 0.1], rot: [-12, 0, 0] }, ...segment(1.0, 0.9, 0.85, 1), neck);

  // The coil on the ground and the broken ice around it.
  const body = node('body', {},
    ...[0, 45, 90, 135, 180, 225, 270, 315].flatMap((d, i) => {
      const a = (d * Math.PI) / 180;
      return [
        block(0.75, 0.5, 0.6, i % 2 ? SCALE_DARK : SCALE, { at: [Math.sin(a) * 0.95, 0.25, Math.cos(a) * 0.95], rot: [0, d + 90, 0] }),
        block(0.1, 0.24, 0.12, CRYSTAL, { at: [Math.sin(a) * 0.95, 0.6, Math.cos(a) * 0.95], rot: [0, d, -20] }),
      ];
    }),
    ...speckle(shades(FROST), { box: [2.4, 0.1, 2.4], at: [0, 0.05, 0], faces: 't', count: 18, size: 0.14, seed: 31 }),
    ...[[1.6, 0.4], [-1.5, 0.7], [1.2, -1.3], [-1.1, -1.2]].map(([x, z], i) => block(0.25, 0.5 + i * 0.12, 0.25, i % 2 ? CRYSTAL : FROST, { at: [x, (0.5 + i * 0.12) / 2 + 0.08, z], rot: [10 * (i - 1.5), i * 30, 15] })),
    seg1,
  );

  const root = node('frostwyrm', {}, body);
  const { rot, mov, scl } = rig(root);
  const wave = (p: number, shift = 0) => Math.sin((p + shift) * TAU);
  const zero: Vec3 = [0, 0, 0];
  const segs = ['seg_1', 'seg_2', 'seg_3', 'seg_4', 'seg_5'];

  const idle = animation('Idle', 3.2, [
    ...segs.map((s, k) => rot(s, loop((p) => [2 * wave(p, k * 0.1), 0, 4 * wave(p, k * 0.15)]))),
    rot('head', loop((p) => [3 * wave(p, 0.3), 14 * wave(p, 0.1), 0])),
    rot('jaw', loop((p) => [4 + 4 * wave(p * 2), 0, 0])),
    scl('weak_point', loop((p) => 1 + 0.12 * wave(p * 2))),
    scl('eyes', loop((p) => 1 + 0.06 * wave(p * 2, 0.3))),
  ]);

  // It is under the ice: the neck rises out of the coil from 0.6 s, the
  // eyes light at 1.6 s and it roars at 2.4 s.
  const below: Vec3 = [0, -4.6, 0];
  const wake = animation('Wake', 3.6, [
    mov('seg_1', poses([0, below], [0.6, below], [2.2, zero, 'out'], [3.6, zero])),
    rot('seg_4', poses([0, zero], [2.2, zero], [2.6, [-12, 0, 0]], [3.2, [-10, 0, 0]], [3.6, zero])),
    rot('head', poses([0, zero], [2.2, zero], [2.6, [-25, 0, 0]], [3.2, [-22, 0, 0]], [3.6, zero])),
    rot('jaw', poses([0, zero], [2.3, zero], [2.6, [40, 0, 0], 'snap'], [3.2, [38, 0, 0]], [3.6, zero])),
    scl('eyes', poses([0, 0.05], [1.55, 0.05], [1.65, 1.5, 'snap'], [3.6, 1])),
    scl('weak_point', poses([0, 0.3], [1.6, 0.3], [2.4, 1.3], [3.6, 1])),
  ]);

  const move = animation('Move', 1.4, [
    ...segs.map((s, k) => rot(s, loop((p) => [4 * wave(p, k * 0.12), 0, 9 * wave(p, k * 0.18)]))),
    rot('head', loop((p) => [0, -10 * wave(p, 0.6), 0])),
  ]);

  // Lunge: it draws its head back with the jaw open (the tell, from 0.4 s)
  // and strikes down at 1.0 s.
  const attack = animation('Attack', 2.2, [
    rot('seg_3', poses([0, zero], [0.4, zero], [0.9, [-12, 0, 0]], [1.0, [22, 0, 0], 'snap'], [1.2, [20, 0, 0]], [2.2, zero])),
    rot('seg_4', poses([0, zero], [0.4, zero], [0.9, [-12, 0, 0]], [1.0, [20, 0, 0], 'snap'], [1.2, [18, 0, 0]], [2.2, zero])),
    rot('seg_5', poses([0, zero], [0.9, [-8, 0, 0]], [1.0, [10, 0, 0], 'snap'], [2.2, zero])),
    rot('head', poses([0, zero], [0.9, [-15, 0, 0]], [1.0, [15, 0, 0], 'snap'], [2.2, zero])),
    rot('jaw', poses([0, zero], [0.4, zero], [0.9, [32, 0, 0]], [1.0, zero, 'snap'], [2.2, zero])),
    scl('eyes', poses([0, 1], [0.9, 1.4], [2.2, 1])),
  ]);

  // Freezing breath: the head rises, the jaw opens and the cold glows in its
  // mouth (the tell, from 0.4 s); the breath bursts out at 0.95 s and sweeps.
  const breathe = animation('Attack_breath', 2.6, [
    rot('seg_5', poses([0, zero], [0.4, zero], [0.9, [-15, 0, 0]], [0.95, [5, 0, 0], 'snap'], [1.8, [5, 0, 0]], [2.6, zero])),
    rot('seg_4', poses([0, zero], [0.95, zero], [1.35, [0, 18, 0]], [1.8, [0, -18, 0]], [2.6, zero])),
    rot('jaw', poses([0, zero], [0.4, zero], [0.9, [35, 0, 0]], [1.8, [36, 0, 0]], [2.6, zero])),
    scl('breath', poses([0, 1], [0.4, 1], [0.9, 10], [0.95, 45, 'snap'], [1.8, 42], [2.0, 1], [2.6, 1])),
    scl('eyes', poses([0, 1], [0.9, 1.4], [2.6, 1])),
  ]);

  const hit = animation('Hit', 0.6, [
    rot('seg_3', poses([0, zero], [0.08, [-10, 8, 0], 'snap'], [0.6, zero])),
    rot('head', poses([0, zero], [0.08, [-18, -12, 0], 'snap'], [0.6, zero])),
    scl('weak_point', poses([0, 1], [0.05, 0.4, 'snap'], [0.15, 1.5], [0.6, 1])),
  ]);

  // It shrieks, then collapses forward over its coil and sinks.
  const die = animation('Die', 3.2, [
    rot('head', poses([0, zero], [0.5, [-30, 0, 0]], [2.2, [30, 0, 0]], [3.2, [35, 0, 0]])),
    rot('jaw', poses([0, zero], [0.5, [42, 0, 0]], [3.2, [25, 0, 0]])),
    ...['seg_2', 'seg_3', 'seg_4'].map((s) => rot(s, poses([0, zero], [0.6, zero], [2.2, [24, 0, 6], 'in'], [3.2, [26, 0, 6]]))),
    mov('seg_1', poses([0, zero], [1.4, zero], [3.2, [0, -1.4, 0], 'in'])),
    scl('weak_point', poses([0, 1], [0.5, 1.8], [0.8, 0.05, 'snap'], [3.2, 0.05])),
    scl('eyes', poses([0, 1], [0.6, 1.5], [2.4, 0.6], [3.2, 0.05])),
  ]);

  return model(root, [idle, wake, move, attack, breathe, hit, die], {
    attacks: {
      Attack: { warn: 0.4, hit: 1.0, end: 1.2 },
      Attack_breath: { warn: 0.4, hit: 0.95, end: 1.8 },
    },
  });
}

export const frostwyrm: ModelEntry = { id: 'subboss-frostwyrm', name: 'Frost Wyrm', type: 'guardian', create };
