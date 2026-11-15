// Bloomkin: an NPC species of TRAPPIST-1 e, the elder of the settlement who
// gives quests. An old tree-folk about 1.9 m tall in detailed voxel: a bark
// trunk mottled with moss, a kind face with a moss beard, a crown of mushroom
// cap in three tiers with glowing spots and a sprout, branch arms with leaf
// clusters, glowing mushrooms on its shoulders and a staff with a lantern.
// Never hostile: kind eyes, a smile, warm and teal lights.

import { TAU, animation, block, light, loop, model, node, poses, rig, speckle, tint } from './kit.ts';
import type { Model, ModelEntry, Vec3 } from './kit.ts';
import { shades } from './beasts.ts';
import { blink, pixelFace } from './folk.ts';

const WOOD = '#8a5a34';
const WOOD_DARK = '#6e4428';
const WOOD_LIGHT = '#b07a4a';
const MOSS = '#5fae4a';
const MOSS_DARK = '#3f7f33';
const CAP = '#2fb67f';
const CAP_DARK = '#1f8a5f';
const CAP_LIGHT = '#4fd39a';
const SPOT = '#ffe9a0';
const WARM = '#ffd45a';
const TEAL = '#63e9c0';

function create(): Model {
  const leg = (side: 'l' | 'r') => {
    const s = side === 'l' ? 1 : -1;
    return node(`leg_${side}`, { at: [0.17 * s, 0.28, 0] },
      block(0.22, 0.3, 0.24, WOOD_DARK, { at: [0, -0.13, 0] }),
      block(0.3, 0.1, 0.34, WOOD_DARK, { at: [0, -0.23, 0.03] }),
      ...[-0.1, 0, 0.1].map((x) => block(0.06, 0.05, 0.12, WOOD, { at: [x + 0.04 * s, -0.255, 0.22], rot: [0, x * 120, 0] })),
    );
  };

  // A tiny glowing mushroom.
  const shroom = (at: Vec3, size: number, colour: string) => [
    block(size * 0.35, size * 0.6, size * 0.35, '#f4e6c8', { at: [at[0], at[1] + size * 0.3, at[2]] }),
    ...light(size, size * 0.35, size, colour, { at: [at[0], at[1] + size * 0.7, at[2]] }, 1.5),
  ];

  const crown = node('crown', { at: [0, 0.4, 0] },
    block(0.92, 0.04, 0.82, CAP_DARK, { at: [0, 0.005, 0] }),
    block(0.95, 0.14, 0.85, CAP, { at: [0, 0.08, 0] }),
    block(0.75, 0.12, 0.68, CAP, { at: [0, 0.21, 0] }),
    block(0.45, 0.1, 0.42, CAP_LIGHT, { at: [0, 0.32, 0] }),
    ...speckle(shades(CAP), { box: [0.95, 0.14, 0.85], at: [0, 0.08, 0], faces: 'lrfb', count: 10, size: 0.05, seed: 3 }),
    ...[[0.3, 0.16, 0.2], [-0.28, 0.16, 0.18], [0.2, 0.28, -0.2], [-0.15, 0.28, 0.22], [0.05, 0.37, 0.05], [-0.35, 0.16, -0.25], [0.38, 0.16, -0.1]].flatMap(([x, y, z]) =>
      light(0.07, 0.03, 0.07, SPOT, { at: [x, y, z] }, 1.5)),
    node('sprout', { at: [0, 0.37, 0] },
      block(0.04, 0.16, 0.04, MOSS_DARK, { at: [0, 0.08, 0] }),
      block(0.14, 0.03, 0.08, MOSS, { at: [0.07, 0.15, 0], rot: [0, 0, 20] }),
      block(0.12, 0.03, 0.07, MOSS, { at: [-0.06, 0.13, 0], rot: [0, 0, -25] })),
  );

  const head = node('head', { at: [0, 0.72, 0] },
    block(0.56, 0.42, 0.48, WOOD_LIGHT, { at: [0, 0.2, 0] }),
    ...speckle(shades(WOOD_LIGHT), { box: [0.56, 0.42, 0.48], at: [0, 0.2, 0], faces: 'lrb', count: 8, size: 0.04, seed: 5 }),
    ...pixelFace({ at: [0, 0.25, 0.24], px: 0.045, gap: 4.4, brow: MOSS_DARK }),
    block(0.08, 0.06, 0.05, WOOD, { at: [0, 0.16, 0.265] }),
    // A moss beard hanging from the chin.
    ...[-0.18, -0.1, -0.02, 0.06, 0.14, 0.2].map((x, i) => block(0.08, 0.1 + (i % 3) * 0.06, 0.06, i % 2 ? MOSS : MOSS_DARK, { at: [x, -0.02 - (i % 3) * 0.03, 0.235] })),
    crown,
  );

  const staff = node('staff', { at: [0, 0, 0.04] },
    block(0.05, 0.98, 0.05, WOOD_DARK, { at: [0, 0.06, 0] }),
    block(0.12, 0.03, 0.12, WOOD, { at: [0, 0.56, 0] }),
    ...[[0.05, 0.05], [-0.05, 0.05], [0.05, -0.05], [-0.05, -0.05]].map(([x, z]) => block(0.02, 0.14, 0.02, WOOD, { at: [x, 0.64, z] })),
    block(0.12, 0.03, 0.12, WOOD, { at: [0, 0.72, 0] }),
    node('lantern', { at: [0, 0.64, 0] }, ...light(0.08, 0.1, 0.08, WARM, {}, 1.9)),
  );

  const arm = (side: 'l' | 'r') => {
    const s = side === 'l' ? 1 : -1;
    return node(`arm_${side}`, { at: [0.36 * s, 0.6, side === 'l' ? 0 : 0.05], rot: side === 'l' ? [0, 0, 20] : [-15, 0, -15] },
      block(0.16, 0.42, 0.18, WOOD, { at: [0, -0.2, 0] }),
      block(0.06, 0.16, 0.06, WOOD_DARK, { at: [0.1 * s, -0.12, 0.02], rot: [0, 0, -40 * s] }),
      ...[[0.08, -0.06, 0.06], [0.14, 0.0, -0.02], [0.03, 0.02, -0.08]].map(([x, y, z], i) => block(0.12, 0.1, 0.12, i % 2 ? MOSS : MOSS_DARK, { at: [x * s, y, z] })),
      node(`hand_${side}`, { at: [0, -0.42, 0] },
        block(0.18, 0.14, 0.18, WOOD_DARK),
        ...[-0.05, 0, 0.05].map((z) => block(0.04, 0.1, 0.04, WOOD, { at: [0.05 * s, -0.1, z] })),
        ...(side === 'r' ? [staff] : [])),
    );
  };

  const body = node('body', { at: [0, 0.3, 0] },
    block(0.62, 0.7, 0.5, WOOD, { at: [0, 0.35, 0] }),
    ...speckle(shades(WOOD), { box: [0.62, 0.7, 0.5], at: [0, 0.35, 0], faces: 'lrb', count: 16, size: 0.05, seed: 7 }),
    ...speckle([MOSS, MOSS_DARK, tint(MOSS, 0.08)], { box: [0.62, 0.7, 0.5], at: [0, 0.35, 0], faces: 'lrf', count: 12, size: 0.06, seed: 9 }),
    ...[-0.2, 0.05, 0.22].map((x) => block(0.03, 0.5, 0.02, WOOD_DARK, { at: [x, 0.38, 0.255] })),
    block(0.64, 0.05, 0.52, MOSS_DARK, { at: [0, 0.18, 0] }),
    block(0.14, 0.14, 0.08, '#c9a46a', { at: [0.25, 0.12, 0.27] }),
    ...light(0.04, 0.04, 0.02, TEAL, { at: [0.25, 0.14, 0.315] }, 1.5),
    ...shroom([0.24, 0.7, 0.05], 0.12, TEAL),
    ...shroom([-0.26, 0.7, -0.08], 0.09, SPOT),
    ...shroom([0.16, 0.7, -0.15], 0.07, TEAL),
    arm('l'),
    arm('r'),
    head,
  );

  const root = node('bloomkin', {}, body, leg('l'), leg('r'));
  const { rot, mov, scl } = rig(root);
  const wave = (p: number, shift = 0) => Math.sin((p + shift) * TAU);
  const zero: Vec3 = [0, 0, 0];

  const idle = animation('Idle', 3.2, [
    scl('body', loop((p) => [1 + 0.012 * wave(p), 1 - 0.01 * wave(p), 1])),
    rot('head', loop((p) => [3 * wave(p, 0.3), 10 * wave(p, 0.1), 2 * wave(p)])),
    scl('eyes', loop((p) => blink(p))),
    rot('sprout', loop((p) => [0, 0, 10 * wave(p, 0.2)])),
    rot('arm_l', loop((p) => [0, 0, 4 * wave(p)])),
    scl('lantern', loop((p) => 1 + 0.1 * wave(p * 2))),
  ]);

  const talk = animation('Talk', 1.4, [
    rot('head', loop((p) => [6 * wave(p * 2), 6 * wave(p), 0])),
    rot('arm_l', loop((p) => [-35 - 15 * wave(p), 0, 15 + 10 * wave(p, 0.2)])),
    mov('body', loop((p) => [0, 0.015 * Math.abs(wave(p * 2)), 0])),
    rot('sprout', loop((p) => [0, 0, 14 * wave(p * 2, 0.2)])),
    scl('eyes', loop((p) => blink(p, 0.5))),
  ]);

  const sway = (t: number, z: number): [number, Vec3] => [t, [0, 0, z]];
  const greet = animation('Wave', 1.6, [
    rot('arm_l', poses([0, zero], sway(0.3, 125), sway(0.5, 150), sway(0.7, 120), sway(0.9, 150), sway(1.1, 120), sway(1.3, 135), [1.6, zero])),
    rot('head', poses([0, zero], [0.3, [-4, 10, 8]], [1.3, [-4, 10, 8]], [1.6, zero])),
    mov('body', poses([0, zero], [0.25, [0, 0.03, 0]], [0.45, zero], [1.6, zero])),
  ]);

  return model(root, [idle, talk, greet]);
}

export const bloomkin: ModelEntry = { id: 'npc-bloomkin', name: 'Bloomkin', type: 'npc', create };
