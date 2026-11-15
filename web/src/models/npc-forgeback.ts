// Forgeback: an NPC species of TRAPPIST-1 b, the smith who works near the
// depots. A big, broad shell-folk in detailed voxel (about 1.6 m, 1.3 m
// wide): a stepped stone shell with warm glowing seams and a little forge
// chimney, a leather apron with tools, welding goggles with cyan lenses pushed
// up on its forehead, a snout and a hammer held over its shoulder.
// Never hostile: kind eyes, a smile, gold and cyan lights.

import { TAU, animation, block, light, loop, model, node, poses, rig, speckle } from './kit.ts';
import type { Model, ModelEntry, Vec3 } from './kit.ts';
import { cracks, shades } from './beasts.ts';
import { blink, pixelFace } from './folk.ts';

const SHELL = '#7a5a48';
const SHELL_DARK = '#5a4034';
const SHELL_LIGHT = '#94705a';
const SKIN = '#d8b070';
const SKIN_LIGHT = '#ecd09a';
const SKIN_DARK = '#b88f55';
const LEATHER = '#6e4428';
const DARK = '#2a2c33';
const GOLD = '#ffc533';
const METAL = '#9aa3b5';
const EMBER = '#ffc04a';
const CYAN = '#63e9ff';

const SEAMS = [
  'c...c..',
  '.c.c..c',
  '..c..c.',
  '.c.c..c',
  'c...cc.',
];

function create(): Model {
  const leg = (side: 'l' | 'r') => {
    const s = side === 'l' ? 1 : -1;
    return node(`leg_${side}`, { at: [0.22 * s, 0.3, 0] },
      block(0.26, 0.34, 0.3, SKIN_DARK, { at: [0, -0.12, 0] }),
      block(0.32, 0.14, 0.38, DARK, { at: [0, -0.23, 0.03] }),
      block(0.33, 0.03, 0.39, LEATHER, { at: [0, -0.17, 0.03] }),
    );
  };

  const hammer = node('hammer', { at: [0, 0.02, 0.03] },
    block(0.05, 0.5, 0.05, LEATHER, { at: [0, 0.2, 0] }),
    block(0.16, 0.16, 0.3, METAL, { at: [0, 0.5, 0] }),
    block(0.17, 0.04, 0.31, GOLD, { at: [0, 0.5, 0] }),
    ...light(0.04, 0.04, 0.02, CYAN, { at: [0.085, 0.5, 0.08] }, 1.4),
  );

  const arm = (side: 'l' | 'r') => {
    const s = side === 'l' ? 1 : -1;
    return node(`arm_${side}`, { at: [0.48 * s, 0.55, 0.02], rot: [0, 0, 12 * s] },
      block(0.24, 0.42, 0.26, SKIN, { at: [0, -0.18, 0] }),
      block(0.28, 0.14, 0.3, LEATHER, { at: [0, -0.32, 0] }),
      block(0.29, 0.03, 0.31, GOLD, { at: [0, -0.26, 0] }),
      ...speckle(shades(SKIN), { box: [0.24, 0.42, 0.26], at: [0, -0.18, 0], faces: 'lrb', count: 4, size: 0.04, seed: 21 + s }),
      node(`hand_${side}`, { at: [0, -0.48, 0.02] },
        block(0.26, 0.2, 0.26, SKIN_LIGHT),
        ...(side === 'r' ? [hammer] : [])),
    );
  };

  const head = node('head', { at: [0, 0.7, 0.16] },
    block(0.46, 0.38, 0.42, SKIN, { at: [0, 0.16, 0.04] }),
    block(0.3, 0.16, 0.18, SKIN_LIGHT, { at: [0, 0.05, 0.3] }),
    block(0.08, 0.05, 0.04, DARK, { at: [0, 0.12, 0.4] }),
    ...pixelFace({ at: [0, 0.2, 0.25], px: 0.04, gap: 5, brow: SKIN_DARK, mouthAt: [0, -0.005, 0.39] }),
    block(0.08, 0.1, 0.1, SKIN_DARK, { at: [0.25, 0.22, 0.0] }),
    block(0.08, 0.1, 0.1, SKIN_DARK, { at: [-0.25, 0.22, 0.0] }),
    // Welding goggles pushed up, on a strap.
    block(0.48, 0.05, 0.44, DARK, { at: [0, 0.31, 0.04] }),
    ...[1, -1].flatMap((s) => [
      block(0.15, 0.11, 0.06, GOLD, { at: [0.1 * s, 0.33, 0.26] }),
      ...light(0.1, 0.07, 0.02, CYAN, { at: [0.1 * s, 0.33, 0.295] }, 1.3),
    ]),
  );

  const body = node('body', { at: [0, 0.32, 0] },
    block(0.72, 0.62, 0.56, SKIN, { at: [0, 0.33, 0.02] }),
    block(0.56, 0.5, 0.06, SKIN_LIGHT, { at: [0, 0.32, 0.31] }),
    ...[0.2, 0.32, 0.44].map((y) => block(0.5, 0.02, 0.02, SKIN_DARK, { at: [0, y, 0.345] })),
    // A leather apron with a pocket and a wrench.
    block(0.5, 0.42, 0.04, LEATHER, { at: [0, 0.18, 0.36] }),
    block(0.16, 0.1, 0.03, '#5a3620', { at: [0.1, 0.16, 0.39] }),
    block(0.03, 0.16, 0.02, METAL, { at: [-0.12, 0.2, 0.39], rot: [0, 0, 20] }),
    block(0.06, 0.04, 0.02, METAL, { at: [-0.15, 0.28, 0.39], rot: [0, 0, 20] }),
    block(0.04, 0.3, 0.03, LEATHER, { at: [0.2, 0.5, 0.34], rot: [0, 0, -15] }),
    block(0.04, 0.3, 0.03, LEATHER, { at: [-0.2, 0.5, 0.34], rot: [0, 0, 15] }),
    // The stepped shell, with warm glowing seams and a forge chimney.
    block(0.9, 0.8, 0.32, SHELL, { at: [0, 0.42, -0.3] }),
    block(0.78, 0.66, 0.14, SHELL_DARK, { at: [0, 0.42, -0.5] }),
    block(0.56, 0.46, 0.1, SHELL_LIGHT, { at: [0, 0.42, -0.6] }),
    ...speckle(shades(SHELL), { box: [0.9, 0.8, 0.32], at: [0, 0.42, -0.3], faces: 'lrt', count: 14, size: 0.06, seed: 31 }),
    cracks('seams', SEAMS, EMBER, { at: [0, 0.42, -0.651], rot: [0, 180, 0] }, 0.06),
    node('chimney', { at: [0.24, 0.82, -0.36] },
      block(0.14, 0.3, 0.14, SHELL_DARK, { at: [0, 0.15, 0] }),
      block(0.18, 0.04, 0.18, DARK, { at: [0, 0.3, 0] }),
      ...light(0.1, 0.05, 0.1, EMBER, { at: [0, 0.33, 0] }, 1.8)),
    arm('l'),
    arm('r'),
    head,
  );

  const root = node('forgeback', {}, body, leg('l'), leg('r'));
  const { rot, mov, scl } = rig(root);
  const wave = (p: number, shift = 0) => Math.sin((p + shift) * TAU);
  const zero: Vec3 = [0, 0, 0];

  const idle = animation('Idle', 3.2, [
    scl('body', loop((p) => [1 + 0.012 * wave(p), 1 - 0.01 * wave(p), 1])),
    rot('head', loop((p) => [3 * wave(p, 0.25), 10 * wave(p, 0.05), 0])),
    scl('eyes', loop((p) => blink(p, 0.7))),
    rot('arm_r', loop((p) => [-4 * wave(p), 0, 3 * wave(p, 0.3)])),
    rot('arm_l', loop((p) => [3 * wave(p, 0.5), 0, 2 * wave(p)])),
    scl('chimney', loop((p) => [1, 1 + 0.06 * wave(p * 2), 1])),
  ]);

  const talk = animation('Talk', 1.4, [
    rot('head', loop((p) => [7 * wave(p * 2), 5 * wave(p), 0])),
    rot('arm_l', loop((p) => [-40 - 15 * wave(p), 0, 8 * wave(p, 0.2)])),
    rot('arm_r', loop((p) => [-8 * wave(p * 2), 0, 0])),
    mov('body', loop((p) => [0, 0.012 * Math.abs(wave(p * 2)), 0])),
    scl('eyes', loop((p) => blink(p, 0.5))),
  ]);

  const sway = (t: number, z: number): [number, Vec3] => [t, [0, 0, z]];
  const greet = animation('Wave', 1.6, [
    rot('arm_l', poses([0, zero], sway(0.3, 125), sway(0.5, 150), sway(0.7, 120), sway(0.9, 150), sway(1.1, 120), sway(1.3, 135), [1.6, zero])),
    rot('head', poses([0, zero], [0.3, [-5, 8, 6]], [1.3, [-5, 8, 6]], [1.6, zero])),
    rot('body', poses([0, zero], [0.3, [0, 0, -3]], [1.3, [0, 0, -3]], [1.6, zero])),
  ]);

  return model(root, [idle, talk, greet]);
}

export const forgeback: ModelEntry = { id: 'npc-forgeback', name: 'Forgeback', type: 'npc', create };
