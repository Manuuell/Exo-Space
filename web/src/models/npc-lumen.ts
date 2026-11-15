// Lumen: an NPC species of TRAPPIST-1 h, the archivist who keeps watch over
// the ruins. A tall moth-sage in detailed voxel (about 2.3 m with its
// antennae): a stepped lilac robe with gold trim and glowing runes, a ruff of
// white fluff, crystal wings with glowing veins, a big round head with kind
// eyes and a small beak, feathery antennae with glowing tips, and a glowing
// book. Never hostile: kind eyes, a smile, cyan and gold lights.

import { TAU, animation, block, cube, glass, light, loop, model, node, part, poses, rig, speckle } from './kit.ts';
import type { Model, ModelEntry, Vec3 } from './kit.ts';
import { shades } from './beasts.ts';
import { blink, pixelFace } from './folk.ts';

const ROBE = '#9b7cff';
const ROBE_DARK = '#6f52d6';
const ROBE_LIGHT = '#b39cff';
const FUR = '#f1eeff';
const GOLD = '#ffc533';
const LEG = '#3a3360';
const BEAK = '#ffb347';
const BOOK = '#5a3a8a';
const PAGE = '#fff1d6';
const CYAN = '#63e9ff';

function create(): Model {
  const leg = (side: 'l' | 'r') => {
    const s = side === 'l' ? 1 : -1;
    return node(`leg_${side}`, { at: [0.1 * s, 0.3, 0] },
      block(0.07, 0.3, 0.07, LEG, { at: [0, -0.15, 0] }),
      block(0.12, 0.05, 0.2, LEG, { at: [0, -0.275, 0.04] }));
  };

  const book = node('book', { at: [0, -0.06, 0.08] },
    block(0.24, 0.3, 0.06, BOOK),
    block(0.2, 0.26, 0.02, PAGE, { at: [0, 0, 0.035] }),
    ...light(0.08, 0.08, 0.01, CYAN, { at: [0, 0.02, 0.05] }, 1.6),
    block(0.25, 0.03, 0.065, GOLD, { at: [0, 0.12, 0] }),
  );

  const arm = (side: 'l' | 'r') => {
    const s = side === 'l' ? 1 : -1;
    return node(`arm_${side}`, { at: [0.27 * s, 0.85, 0], rot: [0, 0, 10 * s] },
      block(0.14, 0.48, 0.14, ROBE_DARK, { at: [0, -0.22, 0] }),
      block(0.16, 0.06, 0.16, GOLD, { at: [0, -0.43, 0] }),
      node(`hand_${side}`, { at: [0, -0.5, 0.02] },
        block(0.1, 0.1, 0.1, FUR),
        ...(side === 'l' ? [book] : [])),
    );
  };

  const wing = (side: 'l' | 'r') => {
    const s = side === 'l' ? 1 : -1;
    return node(`wing_${side}`, { at: [0.12 * s, 0.75, -0.22], rot: [0, -20 * s, -15 * s] },
      part(cube(0.5, 0.8, 0.04), glass('#c9b8ff', 0.35), { at: [0.25 * s, 0.1, 0] }),
      block(0.5, 0.04, 0.05, ROBE_LIGHT, { at: [0.25 * s, 0.5, 0] }),
      block(0.04, 0.8, 0.05, ROBE_LIGHT, { at: [0.5 * s, 0.1, 0] }),
      ...light(0.4, 0.02, 0.02, CYAN, { at: [0.25 * s, 0.25, 0.02] }, 1.3),
      ...light(0.02, 0.5, 0.02, CYAN, { at: [0.25 * s, 0.05, 0.02] }, 1.3),
      ...light(0.1, 0.1, 0.02, GOLD, { at: [0.32 * s, 0.32, 0.025] }, 1.5),
    );
  };

  // Feathery antennae: stacked blocks rising outwards, with a glowing tip.
  const antenna = (s: number) => [0, 1, 2, 3].flatMap((i) => [
    block(0.04, 0.1, 0.04, GOLD, { at: [(0.07 + i * 0.04) * s, 0.42 + i * 0.09, -0.02 - i * 0.02] }),
    block(0.1, 0.02, 0.05, FUR, { at: [(0.07 + i * 0.04 + 0.05) * s, 0.42 + i * 0.09, -0.02 - i * 0.02] }),
    ...(i === 3 ? light(0.05, 0.05, 0.05, CYAN, { at: [0.2 * s, 0.73, -0.08] }, 1.6) : []),
  ]);

  const head = node('head', { at: [0, 1.2, 0.02] },
    block(0.4, 0.36, 0.36, FUR, { at: [0, 0.18, 0] }),
    ...speckle(shades(FUR), { box: [0.4, 0.36, 0.36], at: [0, 0.18, 0], faces: 'lrbt', count: 8, size: 0.04, seed: 41 }),
    ...pixelFace({ at: [0, 0.22, 0.18], px: 0.045, gap: 4.4, eye: '#1b1f4a', brow: ROBE_DARK, mouthAt: [0, 0.07, 0.18] }),
    block(0.08, 0.06, 0.1, BEAK, { at: [0, 0.12, 0.22] }),
    ...antenna(1),
    ...antenna(-1),
    ...[-0.08, 0, 0.08].map((x) => block(0.07, 0.08, 0.07, FUR, { at: [x, 0.39, -0.06 + Math.abs(x)] })),
  );

  const body = node('body', { at: [0, 0.25, 0] },
    block(0.62, 0.3, 0.5, ROBE, { at: [0, 0.15, 0] }),
    block(0.54, 0.3, 0.44, ROBE, { at: [0, 0.45, 0] }),
    block(0.46, 0.3, 0.38, ROBE_LIGHT, { at: [0, 0.75, 0] }),
    block(0.64, 0.04, 0.52, GOLD, { at: [0, 0.02, 0] }),
    block(0.56, 0.03, 0.46, GOLD, { at: [0, 0.3, 0] }),
    block(0.04, 0.86, 0.02, GOLD, { at: [0, 0.45, 0.255] }),
    ...speckle(shades(ROBE), { box: [0.62, 0.3, 0.5], at: [0, 0.15, 0], faces: 'lrb', count: 8, size: 0.04, seed: 43 }),
    ...[[0.1, 0.16], [-0.1, 0.22], [0.1, 0.5], [-0.1, 0.44]].flatMap(([x, y]) =>
      light(0.05, 0.05, 0.02, CYAN, { at: [x, y, y < 0.3 ? 0.255 : 0.225] }, 1.4)),
    // The ruff of white fluff.
    ...[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
      const r = (a * Math.PI) / 180;
      return block(0.14, 0.12, 0.14, FUR, { at: [Math.sin(r) * 0.2, 0.95, Math.cos(r) * 0.17], rot: [0, a, 0] });
    }),
    block(0.1, 0.25, 0.1, FUR, { at: [0, 1.08, 0] }),
    wing('l'),
    wing('r'),
    arm('l'),
    arm('r'),
    head,
  );

  const root = node('lumen', {}, body, leg('l'), leg('r'));
  const { rot, mov, scl } = rig(root);
  const wave = (p: number, shift = 0) => Math.sin((p + shift) * TAU);
  const zero: Vec3 = [0, 0, 0];

  const idle = animation('Idle', 3.6, [
    rot('body', loop((p) => [0, 0, 1.2 * wave(p)])),
    rot('head', loop((p) => [4 * wave(p, 0.2), 12 * wave(p, 0.05), 3 * wave(p)])),
    scl('eyes', loop((p) => blink(p, 0.55))),
    rot('wing_l', loop((p) => [0, 6 * wave(p), 0])),
    rot('wing_r', loop((p) => [0, -6 * wave(p), 0])),
    rot('book', loop((p) => [5 * wave(p, 0.4), 0, 0])),
    mov('body', loop((p) => [0, 0.008 * wave(p * 2), 0])),
  ]);

  const talk = animation('Talk', 1.4, [
    rot('head', loop((p) => [7 * wave(p * 2), 8 * wave(p), 5 * wave(p, 0.25)])),
    rot('arm_r', loop((p) => [-50 - 15 * wave(p), 0, -15 - 10 * wave(p, 0.2)])),
    rot('wing_l', loop((p) => [0, 10 * wave(p * 2), 0])),
    rot('wing_r', loop((p) => [0, -10 * wave(p * 2), 0])),
    scl('eyes', loop((p) => blink(p, 0.4))),
  ]);

  // It waves with the hand that has no book; the wings open a little.
  const sway = (t: number, z: number): [number, Vec3] => [t, [0, 0, z]];
  const greet = animation('Wave', 1.6, [
    rot('arm_r', poses([0, zero], sway(0.3, -125), sway(0.5, -150), sway(0.7, -120), sway(0.9, -150), sway(1.1, -120), sway(1.3, -135), [1.6, zero])),
    rot('head', poses([0, zero], [0.3, [-6, -10, -8]], [1.3, [-6, -10, -8]], [1.6, zero])),
    rot('wing_l', poses([0, zero], [0.4, [0, 25, 0]], [1.3, [0, 25, 0]], [1.6, zero])),
    rot('wing_r', poses([0, zero], [0.4, [0, -25, 0]], [1.3, [0, -25, 0]], [1.6, zero])),
  ]);

  return model(root, [idle, talk, greet]);
}

export const lumen: ModelEntry = { id: 'npc-lumen', name: 'Lumen', type: 'npc', create };
