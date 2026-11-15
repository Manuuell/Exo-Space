// Veilkeeper: the guardian of the deepest ruins, on TRAPPIST-1 h, where the
// colonists sealed their archive. A towering hooded keeper about 4.5 m tall
// that floats in h's low gravity (0.57 g): a tattered robe of midnight blue
// with frost-silver trim, an ivory mask with four eyes burning in the star's
// orange, four long bony arms with claws and a ring of magenta glyphs
// circling it. Its weak point is the archive core: a glowing magenta cube
// floating inside its open ribcage. Its own palette (midnight blue, ivory,
// magenta), unlike any other model. Detailed voxel.

import { TAU, animation, block, light, loop, model, node, poses, rig, speckle } from './kit.ts';
import type { Model, ModelEntry, Vec3 } from './kit.ts';
import { TRAPPIST_1 } from './contract.ts';
import { shades } from './beasts.ts';
import { faunaLook } from './fauna.ts';

const ROBE = '#1b1830';
const ROBE_DARK = '#110f1e';
const TRIM = '#cfd8e8';
const IVORY = '#efe6d2';
const IVORY_DARK = '#c9bfa8';
const CORE = '#ff5ad1';
const GLYPH = '#ff9be6';
const ICE = '#bfefff';

function create(): Model {
  const G = faunaLook(TRAPPIST_1.h).glow;

  const arm = (name: string, at: Vec3, tilt: number, length: number) => {
    const s = at[0] > 0 ? 1 : -1;
    return node(`arm_${name}`, { at, rot: [0, 0, tilt * s] },
      block(0.34, length, 0.34, ROBE, { at: [0, -length / 2 + 0.05, 0] }),
      block(0.4, 0.08, 0.4, TRIM, { at: [0, -length + 0.08, 0] }),
      ...speckle(shades(ROBE), { box: [0.34, length, 0.34], at: [0, -length / 2 + 0.05, 0], faces: 'lrb', count: 3, size: 0.06, seed: tilt }),
      node(`forearm_${name}`, { at: [0, -length + 0.05, 0] },
        block(0.13, 0.75, 0.13, IVORY, { at: [0, -0.37, 0] }),
        block(0.18, 0.1, 0.18, IVORY_DARK, { at: [0, -0.02, 0] }),
        block(0.24, 0.18, 0.12, IVORY, { at: [0, -0.82, 0] }),
        ...[-0.08, 0, 0.08].map((x) => block(0.05, 0.38, 0.05, IVORY_DARK, { at: [x, -1.08, 0.04], rot: [12, 0, x * 60] })),
        block(0.05, 0.22, 0.05, IVORY_DARK, { at: [-0.12 * s, -0.9, 0.06], rot: [20, 0, -20 * s] })),
    );
  };

  const head = node('head', { at: [0, 3.75, 0.05] },
    block(1.0, 1.05, 1.0, ROBE, { at: [0, 0.45, -0.05] }),
    block(0.5, 0.4, 0.6, ROBE_DARK, { at: [0, 1.0, -0.35], rot: [-30, 0, 0] }),
    block(1.06, 0.08, 0.2, TRIM, { at: [0, 0.98, 0.38], rot: [-10, 0, 0] }),
    block(0.86, 0.9, 0.2, ROBE_DARK, { at: [0, 0.4, 0.3] }),
    // The ivory mask with four burning eyes and a crack.
    block(0.62, 0.8, 0.12, IVORY, { at: [0, 0.4, 0.42] }),
    node('eyes', { at: [0, 0.48, 0.48] },
      ...light(0.13, 0.07, 0.03, G, { at: [0.14, 0.04, 0] }, 1.7),
      ...light(0.13, 0.07, 0.03, G, { at: [-0.14, 0.04, 0] }, 1.7),
      ...light(0.07, 0.05, 0.03, G, { at: [0.2, -0.12, 0] }, 1.6),
      ...light(0.07, 0.05, 0.03, G, { at: [-0.2, -0.12, 0] }, 1.6)),
    block(0.03, 0.3, 0.02, IVORY_DARK, { at: [0.06, 0.2, 0.485], rot: [0, 0, 15] }),
    block(0.03, 0.18, 0.02, IVORY_DARK, { at: [0.1, 0.02, 0.485], rot: [0, 0, -20] }),
    ...[-0.16, -0.05, 0.05, 0.16].map((x) => block(0.05, 0.1, 0.02, ROBE_DARK, { at: [x, 0.12, 0.485] })),
  );

  // The ring of glyphs circling the keeper.
  const orbit = node('orbit', { at: [0, 2.6, 0], rot: [12, 0, 0] },
    ...Array.from({ length: 16 }, (_, i) => {
      const a = (i / 16) * Math.PI * 2;
      return light(0.1, i % 3 ? 0.16 : 0.24, 0.04, i % 2 ? CORE : GLYPH, { at: [Math.sin(a) * 1.4, 0, Math.cos(a) * 1.4], rot: [0, (i / 16) * 360, 0] }, 1.5);
    }).flat(),
  );

  const body = node('body', {},
    // The robe in stepped tiers, floating above the ground.
    block(1.6, 0.6, 1.2, ROBE_DARK, { at: [0, 1.0, 0] }),
    block(1.5, 0.75, 1.15, ROBE, { at: [0, 1.65, 0] }),
    block(1.4, 0.8, 1.05, ROBE, { at: [0, 2.4, 0] }),
    block(1.65, 0.85, 1.0, ROBE, { at: [0, 3.22, 0] }),
    ...[1.32, 2.02, 2.8].map((y) => block(1.52, 0.06, 1.12, TRIM, { at: [0, y, 0.02] })),
    ...speckle(shades(ROBE), { box: [1.5, 0.75, 1.15], at: [0, 1.65, 0], faces: 'lrb', count: 10, size: 0.08, seed: 3 }),
    ...speckle([TRIM, ICE, '#9fb0c8'], { box: [1.65, 0.85, 1.0], at: [0, 3.22, 0], faces: 't', count: 12, size: 0.1, seed: 5 }),
    ...[[0.7, 3.7, 0.1], [-0.7, 3.7, 0.05], [0.55, 3.75, -0.3]].map(([x, y, z], i) =>
      block(0.12, 0.35 + i * 0.1, 0.12, ICE, { at: [x, y, z], rot: [0, 0, x > 0 ? -20 : 20] })),
    // A tattered hem hanging below the robe.
    node('hem', { at: [0, 0.7, 0] },
      ...[-0.6, -0.3, 0, 0.3, 0.6].flatMap((x, i) => [
        block(0.26, 0.25 + (i % 3) * 0.12, 0.06, ROBE_DARK, { at: [x, -0.12 - (i % 3) * 0.06, 0.58] }),
        block(0.26, 0.2 + ((i + 1) % 3) * 0.1, 0.06, ROBE_DARK, { at: [x, -0.1 - ((i + 1) % 3) * 0.05, -0.58] }),
      ])),
    // The open ribcage and the archive core inside it: the weak point.
    ...[3.45, 3.25, 3.05, 2.85].map((y, i) => block(0.95 - i * 0.08, 0.07, 0.08, IVORY, { at: [0, y, 0.52] })),
    block(0.08, 0.75, 0.08, IVORY_DARK, { at: [0, 3.15, 0.53] }),
    node('weak_point', { at: [0, 3.15, 0.38], rot: [0, 30, 0] }, ...light(0.42, 0.42, 0.42, CORE, {}, 1.8)),
    orbit,
    head,
    arm('ul', [0.92, 3.55, 0.05], 16, 1.1),
    arm('ur', [-0.92, 3.55, 0.05], 16, 1.1),
    arm('ll', [0.82, 2.75, 0.12], 26, 0.9),
    arm('lr', [-0.82, 2.75, 0.12], 26, 0.9),
  );

  const root = node('veilkeeper', {}, body);
  const { rot, mov, scl } = rig(root);
  const wave = (p: number, shift = 0) => Math.sin((p + shift) * TAU);
  const zero: Vec3 = [0, 0, 0];
  const arms = ['ul', 'ur', 'll', 'lr'];
  const side = (a: string) => (a.endsWith('l') ? 1 : -1);

  const idle = animation('Idle', 4, [
    mov('body', loop((p) => [0, 0.12 * wave(p), 0])),
    rot('orbit', loop((p) => [0, 360 * 2 * p, 0])),
    // Two full turns per loop, so the rotation closes on itself.
    rot('weak_point', loop((p) => [10 * wave(p), 720 * p, 0])),
    rot('head', loop((p) => [3 * wave(p, 0.3), 10 * wave(p, 0.1), 3 * wave(p)])),
    rot('hem', loop((p) => [5 * wave(p, 0.2), 0, 3 * wave(p)])),
    ...arms.map((a, i) => rot(`arm_${a}`, loop((p) => [6 * wave(p, i * 0.2), 0, 4 * side(a) * wave(p, i * 0.15)]))),
    ...arms.map((a, i) => rot(`forearm_${a}`, loop((p) => [-10 - 6 * wave(p, i * 0.2 + 0.1), 0, 0]))),
    scl('eyes', loop((p) => 1 + 0.08 * wave(p * 2))),
  ]);

  // Collapsed on the floor, a heap of robe with a dark mask; the eyes ignite
  // at 1.2 s, it rises into the air and spreads its four arms at 2.4 s.
  const heap: Vec3 = [0, -2.2, 0];
  const wake = animation('Wake', 3.6, [
    mov('body', poses([0, heap], [1.2, heap], [2.4, [0, 0.3, 0], 'out'], [3.0, [0, 0.25, 0]], [3.6, zero])),
    rot('head', poses([0, [40, 0, 0]], [1.2, [38, 0, 0]], [2.2, [-15, 0, 0]], [3.6, zero])),
    ...arms.map((a) => rot(`arm_${a}`, poses([0, [30, 0, -30 * side(a)]], [1.2, [30, 0, -30 * side(a)]], [2.4, [-40, 0, 55 * side(a)]], [3.0, [-40, 0, 58 * side(a)]], [3.6, zero]))),
    scl('orbit', poses([0, 0.05], [1.4, 0.05], [2.4, 1.2, 'out'], [3.6, 1])),
    scl('eyes', poses([0, 0.05], [1.15, 0.05], [1.25, 1.6, 'snap'], [2.4, 1.2], [3.6, 1])),
    scl('weak_point', poses([0, 0.3], [1.2, 0.3], [2.4, 1.3], [3.6, 1])),
  ]);

  // It glides: leaning in, the hem trailing, the arms reaching.
  const move = animation('Move', 2, [
    mov('body', loop((p) => [0, 0.15 * wave(p), 0])),
    rot('body', loop((p) => [8, 4 * wave(p), 2 * wave(p, 0.25)])),
    rot('hem', loop((p) => [-15 + 5 * wave(p * 2), 0, 4 * wave(p)])),
    rot('orbit', loop((p) => [0, 360 * 2 * p, 0])),
    ...arms.map((a, i) => rot(`arm_${a}`, loop((p) => [-15 + 8 * wave(p, i * 0.25), 0, 5 * side(a) * wave(p)]))),
  ]);

  // Four-armed grasp: all four arms rise and spread, the eyes flare (the
  // tell, from 0.4 s), then they clutch forward at 1.2 s.
  const attack = animation('Attack', 2.4, [
    ...arms.map((a) => rot(`arm_${a}`, poses([0, zero], [0.4, zero], [1.05, [-60, 0, 70 * side(a)]], [1.2, [-95, 0, 10 * side(a)], 'snap'], [1.45, [-90, 0, 12 * side(a)]], [2.4, zero]))),
    ...arms.map((a) => rot(`forearm_${a}`, poses([0, zero], [1.05, [-30, 0, 0]], [1.2, [20, 0, 0], 'snap'], [2.4, zero]))),
    mov('body', poses([0, zero], [1.05, [0, 0.4, -0.3]], [1.2, [0, -0.1, 0.8], 'snap'], [1.45, [0, -0.1, 0.75]], [2.4, zero])),
    rot('head', poses([0, zero], [1.05, [-15, 0, 0]], [1.2, [12, 0, 0], 'snap'], [2.4, zero])),
    scl('eyes', poses([0, 1], [0.4, 1], [1.05, 1.7], [2.4, 1])),
  ]);

  // Glyph burst: the ring spins faster and the core blazes (the tell, from
  // 0.5 s), then the ring blasts outwards at 1.4 s.
  const burst = animation('Attack_glyphs', 2.6, [
    rot('orbit', poses([0, zero], [1.4, [0, 900, 0], 'in'], [2.6, [0, 1260, 0], 'out'])),
    scl('orbit', poses([0, 1], [0.5, 1], [1.3, 0.7], [1.4, 3.2, 'snap'], [1.9, 3.4], [2.2, 1], [2.6, 1])),
    scl('weak_point', poses([0, 1], [0.5, 1], [1.3, 1.7], [1.9, 1.3], [2.6, 1])),
    ...arms.map((a) => rot(`arm_${a}`, poses([0, zero], [1.3, [-20, 0, 30 * side(a)]], [1.4, [-10, 0, 80 * side(a)], 'snap'], [1.9, [-10, 0, 75 * side(a)]], [2.6, zero]))),
    mov('body', poses([0, zero], [1.3, [0, 0.3, 0]], [1.9, [0, 0.4, 0]], [2.6, zero])),
  ]);

  const hit = animation('Hit', 0.7, [
    mov('body', poses([0, zero], [0.1, [0, 0.1, -0.3], 'snap'], [0.7, zero])),
    rot('body', poses([0, zero], [0.1, [-8, 10, 0], 'snap'], [0.7, zero])),
    rot('head', poses([0, zero], [0.1, [-18, -12, 0], 'snap'], [0.7, zero])),
    scl('weak_point', poses([0, 1], [0.05, 0.4, 'snap'], [0.15, 1.6], [0.7, 1])),
  ]);

  // The core shatters, the ring scatters and the robe sinks empty to the floor.
  const die = animation('Die', 3.4, [
    scl('weak_point', poses([0, 1], [0.5, 2.2], [0.8, 0.05, 'snap'], [3.4, 0.05])),
    scl('orbit', poses([0, 1], [0.8, 2.5], [1.4, 0.05], [3.4, 0.05])),
    rot('head', poses([0, zero], [0.5, [-30, 0, 0]], [2.6, [45, 0, 10]], [3.4, [50, 0, 10]])),
    mov('body', poses([0, zero], [0.8, [0, 0.4, 0]], [2.6, [0, -2.1, 0], 'in'], [3.4, [0, -2.15, 0]])),
    ...arms.map((a) => rot(`arm_${a}`, poses([0, zero], [0.8, [-30, 0, 60 * side(a)]], [2.6, [20, 0, -10 * side(a)]], [3.4, [25, 0, -12 * side(a)]]))),
    scl('eyes', poses([0, 1], [0.5, 1.8], [1.6, 0.6], [3.4, 0.05])),
  ]);

  return model(root, [idle, wake, move, attack, burst, hit, die], {
    attacks: {
      Attack: { warn: 0.4, hit: 1.2, end: 1.45 },
      Attack_glyphs: { warn: 0.5, hit: 1.4, end: 1.9 },
    },
  });
}

export const veilkeeper: ModelEntry = { id: 'guardian-veilkeeper', name: 'Veilkeeper', type: 'guardian', flies: true, create };
