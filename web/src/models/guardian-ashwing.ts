// Ashwing: the dragon of the dying world. It nests on a peak of the last
// valley and raids it from the air. About 4.5 m tall standing, 12 m across
// its wings. A heavy dusk-indigo body with a golden belly split by glowing
// ember cracks; wide coral wings with bone fingers; a long neck and a long
// tail with a burning spade at its tip; bone horns sweeping back. Its weak
// point is the cyan gem on its brow. Soft cartoon, the game's style.
//
// Its fight follows the flying boss of the team's earlier game, Meta Space,
// rewritten here from scratch: it circles above, bombs, breathes and dives,
// and lands now and then, which is when it can be hurt the most.
//
// It stands with its feet on the ground at its origin and faces +Z. In the
// air the game lifts it and plays `Move`, its wingbeat.

import { TAU, animation, bar, glow, halo, lathe, loop, model, node, part, poses, rig, slab, soft, sphere, tube, box } from './kit.ts';
import type { Model, ModelEntry, Vec3 } from './kit.ts';

const SKIN = soft('#3f4a94', 0.45);
const SKIN_DARK = soft('#2b3170', 0.4);
const BELLY = soft('#ffcf7a', 0.35);
const MEMBRANE = soft('#e0567a', 0.5);
const MEMBRANE_DARK = soft('#b03a62', 0.45);
const BONE = soft('#f3e6c8', 0.3);
const EMBER = '#ff8a2a';
const EYE = '#ffe46b';
const GEM = '#63f3ff';
/** Height of the hips. */
const HIPS = 1.6;

function create(): Model {
  const spike = (at: Vec3, height: number, lean = -15) =>
    part(lathe([[0, 0], [height * 0.32, 0.02], [height * 0.18, height * 0.55], [0, height]], 8), BONE, { at, rot: [lean, 0, 0] });

  // A wing, spread flat along +X for the left (s = 1) and -X for the right.
  const wing = (s: number) => {
    const side = s > 0 ? 'l' : 'r';
    const p = (x: number, y: number, z: number): Vec3 => [s * x, y, z];
    const membrane: [number, number][] = [[0.2, 0.4], [1.6, 0.5], [3.4, 0.4], [5.8, -0.5], [4.4, -1.2], [3.3, -1.9], [2.2, -1.6], [1.0, -1.5], [0.2, -0.9]];
    return node(`wing_${side}`, { at: p(0.75, 0.6, 0.45) },
      part(slab(membrane.map(([x, z]) => [s * x, z] as [number, number]), 0.08, 0.03), MEMBRANE, {}),
      part(slab([[1.2, -0.2], [3.2, 0.1], [4.6, -0.6], [3.4, -1.5], [2.2, -1.2], [1.3, -1.1]].map(([x, z]) => [s * x, z] as [number, number]), 0.1, 0.03), MEMBRANE_DARK, { at: [0, 0.01, 0] }),
      bar(p(0, 0, 0.3), p(1.6, 0.12, 0.5), 0.17, SKIN),
      bar(p(1.6, 0.12, 0.5), p(3.4, 0.18, 0.4), 0.13, SKIN),
      bar(p(3.4, 0.18, 0.4), p(5.8, 0.05, -0.5), 0.08, BONE),
      bar(p(3.4, 0.18, 0.4), p(4.4, 0.05, -1.2), 0.06, BONE),
      bar(p(3.4, 0.18, 0.4), p(3.3, 0.05, -1.9), 0.06, BONE),
      bar(p(3.4, 0.18, 0.4), p(2.2, 0.05, -1.6), 0.06, BONE),
      part(lathe([[0, 0], [0.09, 0.02], [0, 0.35]], 6), BONE, { at: p(3.45, 0.24, 0.42), rot: [0, 0, s * -30] }));
  };

  const leg = (s: number) => node(`leg_${s > 0 ? 'l' : 'r'}`, { at: [s * 0.72, -0.35, -0.55] },
    part(sphere(0.55, 1), SKIN, { scale: [0.8, 1, 1.1] }),
    bar([s * 0.05, -0.3, 0.1], [s * 0.05, -0.95, -0.15], 0.2, SKIN_DARK),
    part(sphere(0.35, 1), SKIN_DARK, { at: [s * 0.05, -1.1, 0.15], scale: [1, 0.4, 1.4] }),
    ...[-0.14, 0, 0.14].map((x) => part(lathe([[0, 0], [0.06, 0.02], [0, 0.22]], 6), BONE, { at: [s * 0.05 + x, -1.12, 0.6], rot: [80, 0, 0] })));

  const arm = (s: number) => node(`arm_${s > 0 ? 'l' : 'r'}`, { at: [s * 0.6, -0.35, 0.95] },
    bar([0, 0, 0], [s * 0.1, -0.85, 0.3], 0.14, SKIN),
    part(sphere(0.22, 1), SKIN_DARK, { at: [s * 0.1, -0.98, 0.4], scale: [1, 0.6, 1.2] }),
    ...[-0.08, 0.08].map((x) => part(lathe([[0, 0], [0.04, 0.02], [0, 0.15]], 6), BONE, { at: [s * 0.1 + x, -1.0, 0.62], rot: [80, 0, 0] })));

  const jaw = node('jaw', { at: [0, -0.28, 0.35] },
    part(box(0.6, 0.16, 0.85, 0.07), SKIN_DARK, { at: [0, 0, 0.38] }),
    part(box(0.48, 0.08, 0.7, 0.03), BELLY, { at: [0, 0.06, 0.4] }),
    ...[-0.2, 0.2].map((x) => part(lathe([[0, 0], [0.04, 0.01], [0, 0.14]], 6), BONE, { at: [x, 0.08, 0.72] })));

  const head = node('head', { at: [0, 1.35, 0.85] },
    part(sphere(0.55, 2), SKIN, { scale: [0.95, 0.8, 1.15] }),
    part(box(0.7, 0.42, 0.9, 0.16), SKIN, { at: [0, -0.1, 0.62] }),
    part(box(0.56, 0.12, 0.7, 0.05), SKIN_DARK, { at: [0, 0.12, 0.66] }),
    ...[-0.16, 0.16].map((x) => part(sphere(0.05, 0), glow(EMBER), { at: [x, 0.02, 1.07], outline: false })),
    ...[-0.3, 0.3].flatMap((x) => [
      part(sphere(0.12, 1), glow(EYE), { at: [x, 0.16, 0.42], scale: [1, 0.75, 0.6] }),
      part(sphere(0.05, 0), soft('#1b1726', 0.2), { at: [x * 1.05, 0.16, 0.5], outline: false }),
      part(box(0.26, 0.07, 0.18, 0.03), SKIN_DARK, { at: [x, 0.3, 0.42], rot: [0, 0, x > 0 ? -18 : 18] }),
    ]),
    ...[-1, 1].map((s) => part(tube([[s * 0.3, 0.32, 0], [s * 0.46, 0.72, -0.4], [s * 0.52, 0.85, -0.9], [s * 0.48, 0.8, -1.2]], 0.1, 1), BONE)),
    ...[-1, 1].map((s) => part(tube([[s * 0.42, 0.05, -0.1], [s * 0.7, 0.1, -0.35], [s * 0.85, 0.08, -0.55]], 0.05, 1), BONE)),
    jaw,
    node('weak_point', { at: [0, 0.42, 0.28] },
      part(sphere(0.14, 0), glow(GEM), { scale: [1, 1.3, 0.7] }),
      part(sphere(0.3, 1), halo(GEM, 0.35), { outline: false })),
    node('breath', { at: [0, -0.15, 1.2] }));

  const neck = node('neck', { at: [0, 0.45, 1.0] },
    part(tube([[0, 0, 0], [0, 0.6, 0.45], [0, 1.2, 0.75], [0, 1.4, 0.85]], 0.4, 2), SKIN),
    part(tube([[0, -0.12, 0.2], [0, 0.5, 0.62], [0, 1.1, 0.95]], 0.24, 1), BELLY),
    spike([0, 0.75, 0.2], 0.4), spike([0, 1.25, 0.45], 0.32),
    head);

  const tail = node('tail', { at: [0, -0.1, -1.35] },
    part(tube([[0, 0, 0], [0, -0.3, -1.1]], 0.4, 1), SKIN),
    part(tube([[0, -0.3, -1.1], [0.25, -0.75, -2.3]], 0.3, 1), SKIN),
    part(tube([[0.25, -0.75, -2.3], [0.55, -1.05, -3.3]], 0.2, 1), SKIN_DARK),
    spike([0, 0.35, -0.5], 0.35, -35), spike([0.12, -0.05, -1.6], 0.3, -40),
    node('tail_tip', { at: [0.6, -1.0, -3.4] },
      part(slab([[0, 0.1], [0.45, -0.3], [0, -0.75], [-0.45, -0.3]], 0.1, 0.03), soft('#ff9a3c', 0.6), { rot: [0, 0, 0] }),
      part(sphere(0.22, 1), glow(EMBER), { at: [0, 0.06, -0.3], scale: [1, 0.4, 1], outline: false }),
      part(sphere(0.5, 1), halo(EMBER, 0.3), { at: [0, 0.06, -0.3], outline: false })));

  const body = node('body', { at: [0, HIPS, 0] },
    part(sphere(1, 2), SKIN, { scale: [1.0, 0.85, 1.45] }),
    part(sphere(0.85, 2), BELLY, { at: [0, -0.25, 0.18], scale: [0.85, 0.66, 1.28] }),
    // Ember cracks across the golden belly.
    ...[[0.25, -0.55, 0.9], [-0.3, -0.62, 0.3], [0.15, -0.68, -0.35], [-0.1, -0.6, -0.9]].map(([x, y, z], i) =>
      part(box(0.42, 0.04, 0.06, 0.02), glow(EMBER), { at: [x, y, z], rot: [0, 25 - i * 20, 0], outline: false })),
    ...[1.0, 0.55, 0.1, -0.35, -0.8, -1.2].map((z, i) => spike([0, 0.8 - Math.abs(z) * 0.18, z], 0.5 - i * 0.04)),
    neck, tail, wing(1), wing(-1), leg(1), leg(-1), arm(1), arm(-1));

  const root = node('ashwing', {}, body);
  const { rot, mov, scl } = rig(root);
  const wave = (p: number, shift = 0) => Math.sin((p + shift) * TAU);
  const zero: Vec3 = [0, 0, 0];
  const raised = (s: number): Vec3 => [0, s * 30, s * 55];

  // Perched: wings raised and half open, slow breaths, the tail swaying.
  const idle = animation('Idle', 2.4, [
    rot('wing_l', loop((p) => [0, 30, 55 + 4 * wave(p)])),
    rot('wing_r', loop((p) => [0, -30, -55 - 4 * wave(p)])),
    mov('body', loop((p) => [0, 0.05 * wave(p), 0])),
    rot('neck', loop((p) => [3 * wave(p, 0.2), 8 * wave(p * 1), 0])),
    rot('head', loop((p) => [4 * wave(p, 0.3), -6 * wave(p), 0])),
    rot('tail', loop((p) => [0, 12 * wave(p, 0.1), 0])),
    scl('weak_point', loop((p) => 1 + 0.12 * wave(p * 2))),
  ]);

  // In the air: deep wingbeats, legs and arms tucked, neck stretched forward.
  const move = animation('Move', 1.0, [
    rot('wing_l', loop((p) => [0, 8 * Math.cos(p * TAU), 10 + 42 * wave(p)])),
    rot('wing_r', loop((p) => [0, -8 * Math.cos(p * TAU), -10 - 42 * wave(p)])),
    mov('body', loop((p) => [0, -0.25 * wave(p, 0.1), 0])),
    rot('body', loop((p) => [-4 + 3 * wave(p, 0.25), 0, 0])),
    rot('neck', loop((p) => [-28 + 4 * wave(p, 0.3), 0, 0])),
    rot('head', loop((p) => [22 + 3 * wave(p, 0.4), 0, 0])),
    rot('leg_l', loop(() => [-60, 0, 0])),
    rot('leg_r', loop(() => [-60, 0, 0])),
    rot('arm_l', loop(() => [-50, 0, 0])),
    rot('arm_r', loop(() => [-50, 0, 0])),
    rot('tail', loop((p) => [10 + 6 * wave(p, 0.5), 8 * wave(p), 0])),
  ]);

  // Woken in its nest: it rears up, throws its wings wide and roars.
  const wake = animation('Wake', 2.2, [
    rot('body', poses([0, zero], [0.7, [-24, 0, 0]], [1.7, [-20, 0, 0]], [2.2, zero])),
    rot('wing_l', poses([0, raised(1)], [0.9, [0, 0, 35]], [1.7, [0, 5, 40]], [2.2, raised(1)])),
    rot('wing_r', poses([0, raised(-1)], [0.9, [0, 0, -35]], [1.7, [0, -5, -40]], [2.2, raised(-1)])),
    rot('neck', poses([0, zero], [0.7, [-20, 0, 0]], [1.7, [-15, 0, 0]], [2.2, zero])),
    rot('head', poses([0, zero], [0.7, [-25, 0, 0]], [1.0, [-10, 0, 0]], [2.2, zero])),
    rot('jaw', poses([0, zero], [0.8, zero], [1.0, [38, 0, 0], 'snap'], [1.7, [32, 0, 0]], [2.2, zero])),
    scl('weak_point', poses([0, 1], [0.9, 1.7], [1.7, 1.5], [2.2, 1])),
  ]);

  // Breath: it rears its head back, then lunges down and pours out fire.
  const breath = animation('Attack', 2.0, [
    rot('neck', poses([0, zero], [0.5, [-25, 0, 0]], [0.9, [18, 0, 0], 'snap'], [1.8, [14, 0, 0]], [2.0, zero])),
    rot('head', poses([0, zero], [0.5, [-30, 0, 0]], [0.9, [20, 0, 0], 'snap'], [1.8, [16, 0, 0]], [2.0, zero])),
    rot('jaw', poses([0, zero], [0.8, [10, 0, 0]], [0.95, [40, 0, 0], 'snap'], [1.8, [36, 0, 0]], [2.0, zero])),
    rot('wing_l', poses([0, raised(1)], [0.5, [0, 15, 75]], [0.9, [0, 30, 50]], [2.0, raised(1)])),
    rot('wing_r', poses([0, raised(-1)], [0.5, [0, -15, -75]], [0.9, [0, -30, -50]], [2.0, raised(-1)])),
    scl('weak_point', poses([0, 1], [0.5, 1.6], [0.9, 1.2], [2.0, 1])),
  ]);

  // Landing slam: wings up, it lifts, then drops on the ground with all its weight.
  const slam = animation('Attack_slam', 1.6, [
    rot('wing_l', poses([0, raised(1)], [0.6, [0, 0, 80]], [0.9, [0, 0, -12], 'snap'], [1.6, raised(1)])),
    rot('wing_r', poses([0, raised(-1)], [0.6, [0, 0, -80]], [0.9, [0, 0, 12], 'snap'], [1.6, raised(-1)])),
    mov('body', poses([0, zero], [0.6, [0, 0.6, 0]], [0.9, [0, -0.2, 0], 'in'], [1.6, zero])),
    rot('body', poses([0, zero], [0.6, [-12, 0, 0]], [0.9, [8, 0, 0], 'snap'], [1.6, zero])),
    rot('neck', poses([0, zero], [0.6, [-18, 0, 0]], [0.9, [12, 0, 0]], [1.6, zero])),
    rot('jaw', poses([0, zero], [0.85, [30, 0, 0]], [1.2, [10, 0, 0]], [1.6, zero])),
  ]);

  // Hit: it flinches back, the gem flickering.
  const hit = animation('Hit', 0.6, [
    rot('neck', poses([0, zero], [0.1, [-14, 10, 0], 'snap'], [0.6, zero])),
    rot('head', poses([0, zero], [0.1, [-16, -8, 0], 'snap'], [0.6, zero])),
    mov('body', poses([0, zero], [0.1, [0, 0, -0.2], 'snap'], [0.6, zero])),
    scl('weak_point', poses([0, 1], [0.05, 0.5, 'snap'], [0.2, 1.5], [0.6, 1])),
  ]);

  // It falls: the wings drop, it slumps onto its side and the gem goes out.
  const die = animation('Die', 3.6, [
    rot('wing_l', poses([0, raised(1)], [0.8, [0, 20, 70]], [2.4, [0, 10, -20]], [3.6, [0, 10, -25]])),
    rot('wing_r', poses([0, raised(-1)], [0.8, [0, -20, -70]], [2.4, [0, -10, 20]], [3.6, [0, -10, 25]])),
    rot('neck', poses([0, zero], [0.8, [-30, 0, 0]], [2.2, [40, 10, 0]], [3.6, [45, 12, 0]])),
    rot('head', poses([0, zero], [0.8, [-25, 0, 0]], [2.2, [25, 0, 10]], [3.6, [28, 0, 12]])),
    rot('jaw', poses([0, zero], [0.8, [40, 0, 0]], [2.4, [15, 0, 0]], [3.6, [12, 0, 0]])),
    mov('body', poses([0, zero], [1.0, zero], [2.2, [0, -0.85, 0], 'in'], [3.6, [0, -0.9, 0]])),
    rot('body', poses([0, zero], [1.0, [-10, 0, 0]], [2.2, [0, 0, 22], 'in'], [3.6, [0, 0, 24]])),
    rot('tail', poses([0, zero], [2.2, [0, 25, 0]], [3.6, [0, 28, 0]])),
    scl('weak_point', poses([0, 1], [0.8, 1.8], [1.2, 0.05, 'snap'], [3.6, 0.05])),
  ]);

  return model(root, [idle, move, wake, breath, slam, hit, die], {
    outline: 0.05,
    attacks: {
      Attack: { warn: 0.2, hit: 0.9, end: 1.8 },
      Attack_slam: { warn: 0.15, hit: 0.9, end: 1.2 },
    },
  });
}

export const ashwing: ModelEntry = { id: 'guardian-ashwing', name: 'Ashwing', type: 'guardian', create };
