// Ashen Bastion: the guardian of the ruins of TRAPPIST-1 b. A colossal
// sentinel the first colonists built to guard their archive, running on the
// planet's heat: an upright armoured knight about 5.5 m tall with a crest of
// blades, a T-shaped visor that burns, spiked pauldrons, a tattered crimson
// cape, a 2 m tower shield carved with the colonists' cyan runes and a great
// glaive with a glowing edge. Its weak point is the white-hot furnace grate
// in its belly. Its own palette: blackened bronze, dark iron and crimson,
// with seams that glow in the star's orange. Detailed voxel.

import { TAU, animation, block, light, loop, model, node, pixels, poses, rig, speckle } from './kit.ts';
import type { Model, ModelEntry, Vec3 } from './kit.ts';
import { TRAPPIST_1 } from './contract.ts';
import { CRACK_TALL, cracks, shades } from './beasts.ts';
import { faunaLook } from './fauna.ts';

const BRONZE = '#7a5230';
const BRONZE_LIGHT = '#9a6a3c';
const IRON = '#2b2a30';
const IRON_LIGHT = '#45434d';
const CLOTH = '#5a1622';
const CLOTH_DARK = '#3f0f18';
const HEAT = '#fff0b0';
const RUNE = '#63e9ff';

const SHIELD_RUNE = [
  '..rrr..',
  '.r...r.',
  'r..r..r',
  'r.rrr.r',
  'r..r..r',
  '.r...r.',
  '..rrr..',
];

function create(): Model {
  const look = faunaLook(TRAPPIST_1.b);
  const G = look.glow;
  const W = look.wide;
  const legH = 2.0 * look.tall;

  const leg = (side: 'l' | 'r') => {
    const s = side === 'l' ? 1 : -1;
    return node(`leg_${side}`, { at: [0.45 * W * s, 0, 0] },
      block(0.6, 0.95, 0.65, IRON, { at: [0, -0.45, 0] }),
      block(0.66, 0.35, 0.3, BRONZE_LIGHT, { at: [0, -legH * 0.52, 0.27] }),
      block(0.56, legH - 1.25, 0.6, BRONZE, { at: [0, -0.95 - (legH - 1.25) / 2, 0.02] }),
      block(0.72, 0.3, 0.95, IRON, { at: [0, -legH + 0.15, 0.15] }),
      block(0.74, 0.06, 0.97, BRONZE_LIGHT, { at: [0, -legH + 0.31, 0.15] }),
      ...light(0.05, 0.4, 0.02, G, { at: [0.15 * s, -legH * 0.72, 0.325] }, 1.4),
      ...speckle(shades(BRONZE), { box: [0.56, legH - 1.25, 0.6], at: [0, -0.95 - (legH - 1.25) / 2, 0.02], faces: 'lrb', count: 4, size: 0.08, seed: 3 + s }),
    );
  };

  const shield = node('shield', { at: [0.18, -0.45, 0.48] },
    block(1.1, 2.0, 0.18, IRON),
    block(1.2, 0.1, 0.22, BRONZE_LIGHT, { at: [0, 1.0, 0] }),
    block(1.2, 0.1, 0.22, BRONZE_LIGHT, { at: [0, -1.0, 0] }),
    block(0.1, 2.0, 0.22, BRONZE_LIGHT, { at: [0.6, 0, 0] }),
    block(0.1, 2.0, 0.22, BRONZE_LIGHT, { at: [-0.6, 0, 0] }),
    pixels('shield_rune', SHIELD_RUNE, { r: RUNE }, { at: [0, 0.2, 0.1], size: 0.09, depth: 0.03, glow: 'r' }),
    ...[-0.35, 0, 0.35].map((x) => block(0.1, 0.24, 0.1, IRON_LIGHT, { at: [x, -1.15, 0.02] })),
    ...light(0.04, 0.5, 0.02, G, { at: [0.3, -0.55, 0.1] }, 1.4),
    ...speckle(shades(IRON), { box: [1.1, 2.0, 0.18], faces: 'f', count: 10, size: 0.08, seed: 9 }),
  );

  const glaive = node('glaive', { at: [0, -0.75, 0.2] },
    block(0.12, 3.1, 0.12, IRON, { at: [0, 0.55, 0] }),
    ...[-0.4, 0.4, 1.2].map((y) => block(0.16, 0.08, 0.16, BRONZE_LIGHT, { at: [0, y, 0] })),
    // The blade: a broad crescent with a glowing edge.
    block(0.1, 1.0, 0.5, BRONZE_LIGHT, { at: [0, 2.45, 0.22] }),
    block(0.1, 0.6, 0.32, BRONZE, { at: [0, 2.1, 0.5] }),
    block(0.1, 0.4, 0.2, BRONZE, { at: [0, 2.85, 0.38], rot: [-20, 0, 0] }),
    ...light(0.04, 1.0, 0.06, G, { at: [0, 2.45, 0.5] }, 1.5),
    ...light(0.04, 0.55, 0.06, G, { at: [0, 2.08, 0.69] }, 1.5),
    block(0.08, 0.3, 0.08, IRON_LIGHT, { at: [0, -1.1, 0] }),
  );

  const arm = (side: 'l' | 'r') => {
    const s = side === 'l' ? 1 : -1;
    return node(`arm_${side}`, { at: [1.25 * W * s, 1.4, 0.05], rot: [0, 0, 6 * s] },
      block(0.45, 0.9, 0.5, IRON, { at: [0, -0.45, 0] }),
      node(`forearm_${side}`, { at: [0, -0.9, 0] },
        block(0.5, 0.8, 0.55, BRONZE, { at: [0, -0.4, 0] }),
        block(0.56, 0.12, 0.6, BRONZE_LIGHT, { at: [0, -0.05, 0] }),
        block(0.42, 0.3, 0.45, IRON_LIGHT, { at: [0, -0.88, 0.05] }),
        ...(side === 'l' ? [shield] : [glaive])),
    );
  };

  const pauldron = (s: number) => [
    block(0.85, 0.45, 0.9, BRONZE, { at: [1.05 * W * s, 1.55, 0] }),
    block(0.7, 0.2, 0.75, BRONZE_LIGHT, { at: [1.05 * W * s, 1.82, 0] }),
    ...[-0.25, 0.05, 0.3].map((z, i) => block(0.12, 0.35 + (i % 2) * 0.15, 0.12, IRON, { at: [1.05 * W * s + 0.18 * s, 1.95 + (i % 2) * 0.07, z], rot: [0, 0, -20 * s] })),
  ];

  const head = node('head', { at: [0, 1.75, 0.05] },
    block(0.6, 0.75, 0.65, BRONZE, { at: [0, 0.35, 0] }),
    block(0.66, 0.12, 0.7, BRONZE_LIGHT, { at: [0, 0.68, 0] }),
    block(0.16, 0.45, 0.2, IRON, { at: [0.33, 0.2, 0.15] }),
    block(0.16, 0.45, 0.2, IRON, { at: [-0.33, 0.2, 0.15] }),
    // The burning T-shaped visor.
    node('eyes', { at: [0, 0.38, 0.33] },
      ...light(0.42, 0.07, 0.03, G, { at: [0, 0.07, 0] }, 1.7),
      ...light(0.07, 0.3, 0.03, G, { at: [0, -0.08, 0] }, 1.7)),
    // A crest of blades from the brow to the back.
    ...[0.25, 0.08, -0.1, -0.28].map((z, i) => block(0.07, 0.45 + [0.1, 0.4, 0.3, 0.05][i], 0.2, i % 2 ? IRON : IRON_LIGHT, {
      at: [0, 0.74 + (0.45 + [0.1, 0.4, 0.3, 0.05][i]) / 2, z], rot: [-12, 0, 0],
    })),
  );

  const torso = node('torso', { at: [0, 0.3, 0] },
    block(1.1 * W, 0.7, 0.8, IRON, { at: [0, 0.35, 0] }),
    block(1.6 * W, 1.0, 1.0, BRONZE, { at: [0, 1.15, 0] }),
    block(0.25, 0.9, 0.12, BRONZE_LIGHT, { at: [0, 1.15, 0.52] }),
    ...speckle(shades(BRONZE), { box: [1.6 * W, 1.0, 1.0], at: [0, 1.15, 0], faces: 'lrb', count: 16, size: 0.1, seed: 5 }),
    cracks('seam_l', CRACK_TALL, G, { at: [0.45, 1.15, 0.501] }, 0.08),
    cracks('seam_r', CRACK_TALL, G, { at: [-0.45, 1.1, 0.501] }, 0.08),
    // The furnace grate in the belly: the weak point.
    node('weak_point', { at: [0, 0.35, 0.41] },
      ...light(0.62, 0.38, 0.05, HEAT, {}, 1.8),
      ...[-0.2, 0, 0.2].map((x) => block(0.05, 0.42, 0.06, IRON, { at: [x, 0, 0.02] })),
      block(0.72, 0.06, 0.08, IRON, { at: [0, 0.22, 0.01] }),
      block(0.72, 0.06, 0.08, IRON, { at: [0, -0.22, 0.01] })),
    ...pauldron(1),
    ...pauldron(-1),
    // A tattered crimson cape.
    node('cape', { at: [0, 1.6, -0.55] },
      block(1.5, 2.2, 0.08, CLOTH, { at: [0, -1.1, 0] }),
      ...[-0.6, -0.3, 0, 0.3, 0.6].map((x, i) => block(0.28, 0.3 + (i % 3) * 0.15, 0.08, CLOTH_DARK, { at: [x, -2.3 - (i % 3) * 0.07, 0] }))),
    head,
    arm('l'),
    arm('r'),
  );

  const body = node('body', { at: [0, legH, 0] },
    block(1.2 * W, 0.4, 0.75, IRON, { at: [0, 0.15, 0] }),
    block(1.25 * W, 0.12, 0.8, BRONZE_LIGHT, { at: [0, 0.32, 0] }),
    ...[-0.4, 0, 0.4].map((x) => block(0.36, 0.55, 0.08, BRONZE, { at: [x * W, -0.15, 0.4], rot: [8, 0, 0] })),
    torso,
    leg('l'),
    leg('r'),
  );

  const root = node('bastion', {}, body);
  const { rot, mov, scl } = rig(root);
  const wave = (p: number, shift = 0) => Math.sin((p + shift) * TAU);
  const zero: Vec3 = [0, 0, 0];

  const idle = animation('Idle', 4, [
    scl('torso', loop((p) => [1 + 0.01 * wave(p), 1 + 0.012 * wave(p), 1])),
    rot('head', loop((p) => [2 * wave(p, 0.3), 9 * wave(p, 0.1), 0])),
    rot('cape', loop((p) => [4 + 3 * wave(p, 0.2), 0, 2 * wave(p)])),
    rot('forearm_r', loop((p) => [3 * wave(p, 0.25), 0, 0])),
    scl('weak_point', loop((p) => 1 + 0.1 * wave(p * 2))),
    scl('eyes', loop((p) => 1 + 0.08 * wave(p * 2, 0.3))),
  ]);

  // A kneeling statue with its glaive planted and a dark visor; the visor
  // ignites at 1.2 s, it stands at 2.4 s and lifts its glaive.
  const kneel: Vec3 = [0, -legH * 0.45, 0];
  const wake = animation('Wake', 3.6, [
    mov('body', poses([0, kneel], [1.2, kneel], [2.4, zero, 'out'], [3.6, zero])),
    rot('leg_l', poses([0, [-80, 0, 0]], [1.2, [-80, 0, 0]], [2.4, zero, 'out'], [3.6, zero])),
    rot('leg_r', poses([0, [10, 0, 0]], [1.2, [10, 0, 0]], [2.4, zero, 'out'], [3.6, zero])),
    rot('torso', poses([0, [22, 0, 0]], [1.2, [20, 0, 0]], [2.4, [-4, 0, 0]], [3.6, zero])),
    rot('head', poses([0, [30, 0, 0]], [1.2, [28, 0, 0]], [2.0, [-10, 0, 0]], [3.6, zero])),
    rot('arm_r', poses([0, [-40, 0, 0]], [1.2, [-40, 0, 0]], [2.4, [-10, 0, 0]], [2.9, [-70, 0, 0]], [3.6, zero])),
    scl('eyes', poses([0, 0.05], [1.15, 0.05], [1.25, 1.6, 'snap'], [2.4, 1.2], [3.6, 1])),
    scl('weak_point', poses([0, 0.3], [1.2, 0.3], [1.8, 1.4], [3.6, 1])),
  ]);

  // A heavy march; the cape swings and the shield stays up.
  const move = animation('Move', 1.8, [
    rot('leg_l', loop((p) => [16 * wave(p), 0, 0])),
    rot('leg_r', loop((p) => [-16 * wave(p), 0, 0])),
    mov('body', loop((p) => [0, 0.08 * Math.abs(wave(p)), 0])),
    rot('torso', loop((p) => [3, 5 * wave(p), 2 * wave(p)])),
    rot('cape', loop((p) => [10 + 6 * wave(p * 2), 0, 3 * wave(p)])),
    rot('arm_r', loop((p) => [8 * wave(p), 0, 0])),
  ]);

  // Overhead cleave: the glaive rises high and the visor flares (the tell,
  // from 0.4 s), then the blade comes down at 1.35 s.
  const attack = animation('Attack', 2.6, [
    rot('arm_r', poses([0, zero], [0.4, zero], [1.2, [-165, 0, 10]], [1.35, [-35, 0, 0], 'snap'], [1.6, [-32, 0, 0]], [2.6, zero])),
    rot('forearm_r', poses([0, zero], [1.2, [-20, 0, 0]], [1.35, [10, 0, 0], 'snap'], [2.6, zero])),
    rot('torso', poses([0, zero], [0.4, zero], [1.2, [-12, 15, 0]], [1.35, [22, -5, 0], 'snap'], [1.6, [20, -5, 0]], [2.6, zero])),
    mov('body', poses([0, zero], [1.2, [0, 0.05, -0.2]], [1.35, [0, -0.2, 0.4], 'snap'], [1.6, [0, -0.18, 0.38]], [2.6, zero])),
    scl('eyes', poses([0, 1], [0.4, 1], [1.2, 1.7], [2.6, 1])),
    rot('cape', poses([0, zero], [1.2, [-10, 0, 0]], [1.35, [25, 0, 0], 'snap'], [2.6, zero])),
  ]);

  // Shield charge: it crouches behind its shield and the furnace roars (the
  // tell, from 0.3 s), then rushes forward at 1.0 s.
  const charge = animation('Attack_charge', 2.4, [
    rot('arm_l', poses([0, zero], [0.3, zero], [0.9, [-30, -35, -10]], [1.3, [-30, -35, -10]], [2.4, zero])),
    rot('torso', poses([0, zero], [0.3, zero], [0.9, [14, -20, 0]], [1.3, [14, -20, 0]], [2.4, zero])),
    mov('body', poses([0, zero], [0.3, zero], [0.9, [0, -0.35, -0.2]], [1.0, [0, -0.25, 1.9], 'snap'], [1.3, [0, -0.2, 2.1]], [2.4, zero])),
    rot('leg_l', poses([0, zero], [0.9, [-25, 0, 0]], [1.0, [25, 0, 0], 'snap'], [1.3, [-15, 0, 0]], [2.4, zero])),
    rot('leg_r', poses([0, zero], [0.9, [15, 0, 0]], [1.0, [-25, 0, 0], 'snap'], [1.3, [15, 0, 0]], [2.4, zero])),
    scl('weak_point', poses([0, 1], [0.3, 1], [0.9, 1.7], [1.3, 1.4], [2.4, 1])),
    scl('eyes', poses([0, 1], [0.9, 1.6], [2.4, 1])),
  ]);

  const hit = animation('Hit', 0.7, [
    rot('torso', poses([0, zero], [0.1, [-10, 8, 0], 'snap'], [0.7, zero])),
    mov('body', poses([0, zero], [0.1, [0, 0, -0.22], 'snap'], [0.7, zero])),
    rot('head', poses([0, zero], [0.1, [-15, -10, 0], 'snap'], [0.7, zero])),
    scl('weak_point', poses([0, 1], [0.05, 0.4, 'snap'], [0.15, 1.6], [0.7, 1])),
  ]);

  // The furnace bursts and fails: it drops the glaive, sinks to one knee and
  // topples forward; the visor goes dark.
  const die = animation('Die', 3.6, [
    scl('weak_point', poses([0, 1], [0.5, 2], [0.8, 0.05, 'snap'], [3.6, 0.05])),
    rot('arm_r', poses([0, zero], [0.6, [-30, 0, 20]], [1.2, [20, 0, 30]], [3.6, [25, 0, 30]])),
    mov('body', poses([0, zero], [1.0, zero], [1.8, [0, -legH * 0.45, 0.1], 'in'], [2.8, [0, -legH * 0.75, 0.7], 'in'], [3.6, [0, -legH * 0.75, 0.7]])),
    rot('leg_l', poses([0, zero], [1.0, zero], [1.8, [-80, 0, 0]], [3.6, [-85, 0, 0]])),
    rot('leg_r', poses([0, zero], [1.8, [10, 0, 0]], [2.8, [-60, 0, 0]], [3.6, [-65, 0, 0]])),
    rot('torso', poses([0, zero], [1.0, [-10, 0, 0]], [1.8, [18, 0, 0]], [2.8, [65, 0, 8], 'in'], [3.0, [60, 0, 8], 'out'], [3.6, [62, 0, 8]])),
    rot('head', poses([0, zero], [0.6, [-20, 0, 0]], [2.8, [20, 0, 0]], [3.6, [22, 0, 0]])),
    rot('cape', poses([0, zero], [2.8, [-30, 0, 0]], [3.6, [-28, 0, 0]])),
    scl('eyes', poses([0, 1], [0.5, 1.8], [1.2, 0.8], [2.4, 0.4], [3.6, 0.05])),
  ]);

  return model(root, [idle, wake, move, attack, charge, hit, die], {
    attacks: {
      Attack: { warn: 0.4, hit: 1.35, end: 1.6 },
      Attack_charge: { warn: 0.3, hit: 1.0, end: 1.3 },
    },
  });
}

export const bastion: ModelEntry = { id: 'guardian-bastion', name: 'Ashen Bastion', type: 'guardian', create };
