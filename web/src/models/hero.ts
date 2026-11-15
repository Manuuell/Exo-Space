// The protagonist: the last human of TRAPPIST-1 e in a heavy exosuit, in the
// team's voxel style. Built from sharp blocks in close shades, with specks in
// relief for texture, a face drawn in pixels behind the helmet glass, and
// lights with a halo. Colours from the team's concept art: royal blue armour
// with gold trim, white pauldrons and bracers, a black undersuit.
// A draft for the team to approve before the full set of clips.

import { TAU, animation, block, cube, glass, light, loop, model, node, part, pixels, rig, speckle } from './kit.ts';
import type { Model, ModelEntry } from './kit.ts';

const U = 0.04;
const BLUE = '#2f6fd6';
const BLUE_HI = '#3f86f0';
const BLUE_LO = '#2457b0';
const WHITE = '#e9edf3';
const WHITE_LO = '#cfd6e2';
const SILVER = '#b9c2cf';
const SILVER_LO = '#97a1b0';
const GOLD = '#f2a623';
const BLACK = '#26262e';
const BLACK_HI = '#383a45';
const BELT = '#3a3b44';
const GREY = '#7a828f';
const GREY_LO = '#5f6672';
const CYAN = '#62e8ff';
const YELLOW = '#ffd23f';

const FACE = [
  'hhHhhhhh',
  'hssssssh',
  'sBBssBBs',
  'sWpsspWs',
  'ssssssss',
  'sssnnsss',
  'ssmmmmss',
];
const FACE_COLOURS = {
  h: '#4a2f22', H: '#61402f', s: '#e0a77e', n: '#c98e66', B: '#33201a', W: '#ffffff', p: '#2b3a66', m: '#8c3f33',
};

const CHEST = [
  'BBBBBBBBBB',
  'BLLBSSBLLB',
  'BBBSCCSBBB',
  'BBBSCCSBBB',
  'bBBBSSBBBb',
  'bbBBBBBBbb',
  'GGGGGGGGGG',
];
const CHEST_COLOURS = { B: BLUE_HI, b: BLUE_LO, S: SILVER, C: CYAN, L: '#ffffff', G: GOLD };

function arm(side: 'l' | 'r'): ReturnType<typeof node> {
  const s = side === 'l' ? 1 : -1;
  const hand = node(`hand_${side}`, { at: [0, -0.22, 0] },
    block(0.16, 0.1, 0.17, BLACK, { at: [0, -0.04, 0] }),
    block(0.15, 0.09, 0.16, BLACK_HI, { at: [0, -0.13, 0] }),
    ...[-0.05, 0, 0.05].map((z) => block(0.025, 0.025, 0.03, GOLD, { at: [0.085 * s, -0.11, z] })),
    block(0.05, 0.08, 0.05, BLACK_HI, { at: [-0.06 * s, -0.09, 0.08] }),
  );
  const forearm = node(`forearm_${side}`, { at: [0, -0.31, 0] },
    block(0.15, 0.06, 0.16, BLACK),
    block(0.19, 0.17, 0.2, WHITE, { at: [0, -0.115, 0] }),
    block(0.2, 0.05, 0.21, BLUE, { at: [0, -0.12, 0] }),
    block(0.2, 0.02, 0.21, GOLD, { at: [0, -0.04, 0] }),
    ...speckle([WHITE_LO, SILVER], { box: [0.19, 0.17, 0.2], at: [0, -0.115, 0], faces: 'lrb', count: 4, size: U, seed: 50 + s }),
    ...light(0.03, 0.03, 0.02, GOLD, { at: [0.05 * s, -0.18, 0.105] }),
    hand,
  );
  return node(`arm_${side}`, { at: [0.33 * s, 0.47, 0], rot: [0, 0, 5 * s] },
    // Stepped pauldron: white block, a lighter step on top, gold edge, blue under.
    block(0.26, 0.12, 0.3, WHITE, { at: [0.03 * s, 0.04, 0] }),
    block(0.2, 0.06, 0.24, WHITE_LO, { at: [0.03 * s, 0.13, 0] }),
    block(0.27, 0.025, 0.31, GOLD, { at: [0.03 * s, -0.03, 0] }),
    block(0.2, 0.05, 0.27, BLUE, { at: [0.07 * s, -0.06, 0] }),
    ...speckle([WHITE_LO, SILVER], { box: [0.26, 0.12, 0.3], at: [0.03 * s, 0.04, 0], faces: s > 0 ? 'lf' : 'rf', count: 5, size: U, seed: 20 + s }),
    ...light(0.03, 0.03, 0.02, GOLD, { at: [0.12 * s, 0.05, 0.155] }),
    block(0.16, 0.26, 0.17, BLACK, { at: [0, -0.17, 0] }),
    block(0.18, 0.13, 0.19, BLUE, { at: [0, -0.15, 0] }),
    block(0.19, 0.025, 0.2, GOLD, { at: [0, -0.225, 0] }),
    forearm,
  );
}

function leg(side: 'l' | 'r'): ReturnType<typeof node> {
  const s = side === 'l' ? 1 : -1;
  const shin = node(`shin_${side}`, { at: [0, -0.38, 0] },
    block(0.18, 0.08, 0.2, BLACK),
    block(0.2, 0.13, 0.06, WHITE, { at: [0, 0, 0.11] }),
    block(0.16, 0.04, 0.065, WHITE_LO, { at: [0, -0.075, 0.11] }),
    block(0.2, 0.24, 0.22, BLUE, { at: [0, -0.15, 0] }),
    block(0.16, 0.18, 0.04, BLUE_HI, { at: [0, -0.15, 0.12] }),
    block(0.16, 0.025, 0.05, GOLD, { at: [0, -0.05, 0.125] }),
    ...speckle([BLUE_HI, BLUE_LO], { box: [0.2, 0.24, 0.22], at: [0, -0.15, 0], faces: 'lrb', count: 6, size: U, seed: 3 + s }),
    // Boot: blue cuff, white boot with a stepped toe, black sole.
    block(0.23, 0.06, 0.25, BLUE_LO, { at: [0, -0.27, 0] }),
    block(0.24, 0.12, 0.3, WHITE, { at: [0, -0.35, 0.03] }),
    block(0.22, 0.06, 0.08, WHITE_LO, { at: [0, -0.355, 0.175] }),
    block(0.245, 0.03, 0.04, GOLD, { at: [0, -0.31, 0.165] }),
    block(0.26, 0.05, 0.33, BLACK, { at: [0, -0.415, 0.03] }),
  );
  return node(`leg_${side}`, { at: [0.12 * s, -0.02, 0] },
    block(0.2, 0.08, 0.22, BLACK, { at: [0, -0.02, 0] }),
    block(0.22, 0.3, 0.24, BLUE, { at: [0, -0.2, 0] }),
    block(0.16, 0.12, 0.03, BLUE_HI, { at: [-0.02 * s, -0.16, 0.13] }),
    block(0.03, 0.26, 0.02, GOLD, { at: [0.075 * s, -0.2, 0.128] }),
    block(0.06, 0.1, 0.1, BLACK_HI, { at: [0.135 * s, -0.24, 0] }),
    ...speckle([BLUE_HI, BLUE_LO], { box: [0.22, 0.3, 0.24], at: [0, -0.2, 0], faces: 'lrb', count: 8, size: U, seed: 7 + s }),
    shin,
  );
}

function create(): Model {
  const helmet = node('helmet', { at: [0, 0.25, 0] },
    block(0.46, 0.42, 0.44, WHITE),
    ...speckle([WHITE_LO, SILVER], { box: [0.46, 0.42, 0.44], faces: 'lrb', count: 12, size: U, seed: 31 }),
    block(0.48, 0.1, 0.46, BLUE, { at: [0, 0.18, 0] }),
    block(0.4, 0.05, 0.4, BLUE_HI, { at: [0, 0.25, -0.01] }),
    block(0.07, 0.03, 0.42, GOLD, { at: [0, 0.285, -0.01] }),
    // The face behind the glass, framed by the brow, the sides and the jaw.
    pixels('face', FACE, FACE_COLOURS, { at: [0, -0.014, 0.22], size: 0.038, depth: 0.012 }),
    part(cube(0.34, 0.27, 0.02), glass('#9fd8ff', 0.2), { at: [0, -0.014, 0.255] }),
    block(0.4, 0.045, 0.05, WHITE_LO, { at: [0, 0.14, 0.235] }),
    block(0.38, 0.015, 0.055, GOLD, { at: [0, 0.112, 0.24] }),
    block(0.04, 0.3, 0.05, WHITE_LO, { at: [0.19, -0.02, 0.235] }),
    block(0.04, 0.3, 0.05, WHITE_LO, { at: [-0.19, -0.02, 0.235] }),
    block(0.4, 0.07, 0.06, SILVER, { at: [0, -0.18, 0.235] }),
    ...[-0.06, 0, 0.06].map((x) => block(0.03, 0.03, 0.01, BLACK, { at: [x, -0.18, 0.268] })),
    // Ear unit on the right, lamp on the left, two antennas.
    block(0.04, 0.14, 0.14, SILVER, { at: [-0.25, 0, -0.02] }),
    block(0.03, 0.1, 0.1, GOLD, { at: [-0.27, 0, -0.02] }),
    block(0.1, 0.1, 0.15, SILVER, { at: [0.28, 0.02, 0.04] }),
    block(0.11, 0.025, 0.16, GOLD, { at: [0.28, 0.075, 0.04] }),
    ...light(0.07, 0.07, 0.02, YELLOW, { at: [0.28, 0.02, 0.125] }),
    block(0.02, 0.24, 0.02, BLACK, { at: [-0.12, 0.34, -0.15] }),
    block(0.02, 0.18, 0.02, BLACK, { at: [0.12, 0.31, -0.15] }),
    ...light(0.03, 0.03, 0.03, '#ff5a4a', { at: [-0.12, 0.47, -0.15] }),
  );

  const head = node('head', { at: [0, 0.56, 0] },
    block(0.18, 0.06, 0.18, BLACK, { at: [0, 0.02, 0] }),
    helmet,
  );

  const backpack = node('backpack', { at: [0, 0.33, -0.27] },
    block(0.4, 0.42, 0.12, GREY),
    ...speckle([GREY_LO, SILVER_LO], { box: [0.4, 0.42, 0.12], faces: 'lrt', count: 8, size: U, seed: 41 }),
    // Tanks: crossed blocks read as cylinders.
    ...[0.13, -0.13].flatMap((x) => [
      block(0.14, 0.46, 0.1, SILVER, { at: [x, 0, -0.1] }),
      block(0.1, 0.44, 0.14, SILVER_LO, { at: [x, 0, -0.1] }),
      block(0.12, 0.48, 0.12, SILVER, { at: [x, 0, -0.1] }),
      block(0.15, 0.03, 0.15, GOLD, { at: [x, 0.12, -0.1] }),
      block(0.15, 0.03, 0.15, GOLD, { at: [x, -0.1, -0.1] }),
    ]),
    block(0.1, 0.28, 0.03, BLACK, { at: [0, 0, -0.075] }),
    ...[0.07, 0.02, -0.03].flatMap((y) => light(0.05, 0.02, 0.01, GOLD, { at: [0, y, -0.093] }, 1)),
    node('jets', { at: [0, -0.26, -0.1] },
      block(0.12, 0.08, 0.12, BLACK, { at: [0.13, 0, 0] }),
      block(0.12, 0.08, 0.12, BLACK, { at: [-0.13, 0, 0] }),
      ...light(0.08, 0.02, 0.08, YELLOW, { at: [0.13, -0.05, 0] }),
      ...light(0.08, 0.02, 0.08, YELLOW, { at: [-0.13, -0.05, 0] })),
    block(0.36, 0.08, 0.1, GREY_LO, { at: [0, -0.33, 0.02] }),
    block(0.08, 0.04, 0.04, GREY, { at: [0.2, 0.2, 0.02] }),
    block(0.1, 0.1, 0.14, SILVER, { at: [0.25, 0.2, 0.08] }),
    ...light(0.07, 0.07, 0.02, YELLOW, { at: [0.25, 0.2, 0.16] }),
  );

  const chest = node('chest', { at: [0, 0.16, 0] },
    block(0.36, 0.14, 0.24, BLUE_LO, { at: [0, 0.07, 0] }),
    block(0.34, 0.02, 0.01, BLACK, { at: [0, 0.07, 0.122] }),
    block(0.52, 0.38, 0.3, BLUE, { at: [0, 0.33, 0] }),
    ...speckle([BLUE_HI, BLUE_LO], { box: [0.52, 0.38, 0.3], at: [0, 0.33, 0], faces: 'lrb', count: 14, size: U, seed: 11 }),
    pixels('chest_plate', CHEST, CHEST_COLOURS, { at: [0, 0.34, 0.15], size: 0.045, depth: 0.03, depths: { S: 0.015, C: 0.01 }, glow: 'CL' }),
    ...light(0.09, 0.09, 0.03, CYAN, { at: [0, 0.3625, 0.19] }, 1.8).slice(1),
    block(0.44, 0.06, 0.32, WHITE, { at: [0, 0.54, 0] }),
    block(0.46, 0.02, 0.33, GOLD, { at: [0, 0.505, 0] }),
    block(0.46, 0.3, 0.03, BLUE_LO, { at: [0, 0.33, -0.16] }),
    arm('l'),
    arm('r'),
    head,
    backpack,
  );

  const body = node('body', { at: [0, 0.84, 0] },
    block(0.46, 0.16, 0.27, BLACK, { at: [0, 0.03, 0] }),
    block(0.2, 0.14, 0.05, BLUE, { at: [0, -0.01, 0.14] }),
    block(0.48, 0.07, 0.29, BELT, { at: [0, 0.12, 0] }),
    block(0.1, 0.07, 0.03, SILVER, { at: [0, 0.12, 0.155] }),
    ...light(0.04, 0.03, 0.012, GOLD, { at: [0, 0.12, 0.172] }, 1),
    block(0.1, 0.12, 0.08, BLACK_HI, { at: [0.19, 0.06, 0.15] }),
    block(0.1, 0.12, 0.08, BLACK_HI, { at: [-0.19, 0.06, 0.15] }),
    block(0.04, 0.04, 0.01, GOLD, { at: [0.19, 0.08, 0.193] }),
    block(0.04, 0.04, 0.01, GOLD, { at: [-0.19, 0.08, 0.193] }),
    chest,
    leg('l'),
    leg('r'),
  );

  const root = node('hero', {}, body);
  const { rot, mov, scl } = rig(root);
  const wave = (p: number, shift = 0) => Math.sin((p + shift) * TAU);
  const idle = animation('Idle', 3.6, [
    mov('body', loop((p) => [0.01 * wave(p), -0.008 + 0.008 * wave(p * 2), 0])),
    rot('body', loop((p) => [0, 2 * wave(p, 0.1), -1.2 * wave(p)])),
    scl('chest', loop((p) => [1 + 0.012 * wave(p * 2), 1 + 0.016 * wave(p * 2), 1 + 0.012 * wave(p * 2)])),
    rot('head', loop((p) => [2.5 * wave(p, 0.3), -9 * wave(p, 0.12), 1.5 * wave(p)])),
    rot('arm_l', loop((p) => [3 * wave(p, 0.2), 0, 1.5 * wave(p)])),
    rot('arm_r', loop((p) => [-3 * wave(p, 0.2), 0, -1.5 * wave(p)])),
    rot('forearm_l', loop((p) => [-10 - 2 * wave(p, 0.25), 0, 0])),
    rot('forearm_r', loop((p) => [-10 + 2 * wave(p, 0.25), 0, 0])),
    rot('shin_l', loop((p) => [2 + 1.5 * wave(p), 0, 0])),
    rot('shin_r', loop((p) => [2 - 1.5 * wave(p), 0, 0])),
    scl('jets', loop((p) => [1, 1 + 0.03 * wave(p * 4), 1])),
  ]);
  return model(root, [idle]);
}

export const hero: ModelEntry = { id: 'hero', name: 'Hero', type: 'player', draft: true, create };
