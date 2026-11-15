// The weapons the protagonist shoots with, in the voxel look: sharp blocks of
// dark metal in close shades, lighter plates, vents drawn as dark pixels and
// strips of light. Each one fires a different kind of energy and has its own
// colour and outline, so they read apart from behind: plasma (cyan), gravity
// (violet), ion (yellow) and fusion (orange). Proposals for the team: what
// each one does in play (damage, rate, range) is not decided here. A
// reference image from another game gave the idea of the look only; the
// designs are the team's own.
//
// Every weapon is held by the foot of its grip, which is the origin of the
// model, and shoots along +Z. The shot leaves from the `muzzle` node, and
// `Fire` is one shot: a kick, a flash, and whatever moves inside. Node names
// start with `weapon_` or `muzzle` so they never clash with the names of
// whoever holds it. Nothing behind the grip sits lower than 16 cm: that is
// where the forearm goes.
//
// Each weapon has its shot: `weapon-x` fires `shot-x`. A shot has its origin
// at its centre and flies along +Z. `Fly` loops while it travels; `Burst` is
// what it does when it hits, and ends with nothing left to see, so the game
// can remove it when the clip is over. How fast and how far a shot flies is
// the game's call.

import type * as THREE from 'three';
import { TAU, animation, block, light, loop, model, node, pixels, poses, rig, speckle } from './kit.ts';
import type { Model, ModelEntry, Track, Vec3 } from './kit.ts';

const STEEL = '#3b4163';
const STEEL_HI = '#4c5480';
const STEEL_LO = '#2b2f4a';
const PLATE = '#6d75a0';
const PLATE_HI = '#8a92bb';
const GRIP = '#3c2a50';
const GRIP_LO = '#2b1d3a';
const BLACK = '#15172a';
const CYAN = '#4be3ff';
const VIOLET = '#b06bff';
const YELLOW = '#ffe04a';
const ORANGE = '#ff8a3d';
const WHITE = '#f4fbff';

const SIDES = [1, -1] as const;

/** The handle every weapon is held by. Its foot is the origin of the model. */
function grip(): THREE.Mesh[] {
  return [
    block(0.042, 0.008, 0.05, BLACK, { at: [0, 0.004, -0.012] }),
    block(0.04, 0.052, 0.046, GRIP, { at: [0, 0.034, -0.012] }),
    block(0.04, 0.054, 0.046, GRIP, { at: [0, 0.085, -0.002] }),
    ...[0.022, 0.046, 0.074, 0.098].map((y) => block(0.044, 0.006, 0.018, GRIP_LO, { at: [0, y, y > 0.06 ? -0.012 : -0.022] })),
    // Trigger and its guard.
    block(0.016, 0.01, 0.056, STEEL_LO, { at: [0, 0.062, 0.048] }),
    block(0.016, 0.046, 0.01, STEEL_LO, { at: [0, 0.085, 0.071] }),
    block(0.01, 0.026, 0.01, PLATE_HI, { at: [0, 0.094, 0.04] }),
  ];
}

/** The weapons are built a little small and then scaled up, to sit big in the hand. */
const SIZE = 1.45;

/**
 * A panel drawn in pixels on each side of a body `width` wide: p and h are
 * plate, d and k are dark, c glows in the weapon's colour, a dot is a gap.
 */
function panels(id: string, rows: readonly string[], accent: string, width: number, y: number, z: number): THREE.Group[] {
  const colours = { p: PLATE, h: PLATE_HI, d: STEEL_LO, k: BLACK, c: accent };
  return SIDES.map((s) => pixels(`weapon_${id}_${s > 0 ? 'l' : 'r'}`, rows, colours, {
    at: [(width / 2) * s, y, z], rot: [0, 90 * s, 0], size: 0.008, depth: 0.004, glow: 'c',
  }));
}

/** A thin bright line along both top edges of a body: it catches the eye like a worn edge. */
function edges(width: number, y: number, z: number, length: number): THREE.Mesh[] {
  return SIDES.map((s) => block(0.006, 0.006, length, PLATE_HI, { at: [(width / 2 - 0.002) * s, y, z] }));
}

interface Shot {
  /** Length of the clip, in seconds. */
  duration: number;
  /** How far the weapon jumps back, in metres, and how far its nose lifts, in degrees. */
  back: number;
  lift: number;
  /** How many times bigger the flash gets. */
  flash: number;
}

/** One shot: the weapon kicks around the hand and its light flashes. */
function fire(root: THREE.Group, shot: Shot, moving: (tracks: ReturnType<typeof rig>) => Track[] = () => []): THREE.AnimationClip {
  const tracks = rig(root);
  const { rot, mov, scl } = tracks;
  return animation('Fire', shot.duration, [
    mov('weapon_gun', poses([0, [0, 0, 0]], [0.04, [0, 0, -shot.back], 'snap'], [shot.duration, [0, 0, 0], 'back'])),
    rot('weapon_gun', poses([0, [0, 0, 0]], [0.05, [-shot.lift, 0, 0], 'snap'], [shot.duration, [0, 0, 0], 'back'])),
    scl('muzzle_flash', poses([0, 1], [0.03, [shot.flash, shot.flash, shot.flash * 1.5], 'snap'], [0.13, 1], [shot.duration, 1])),
    ...moving(tracks),
  ]);
}

// Plasma blaster: the small one. A cell of plasma under the barrel and a
// strip of light down each side.
function createPlasma(): Model {
  const y = 0.15;
  const root = node('weapon_plasma', {},
    node('weapon_gun', { scale: SIZE },
      ...grip(),
      block(0.07, 0.07, 0.2, STEEL, { at: [0, y, 0.06] }),
      ...speckle([STEEL_HI, STEEL_LO], { box: [0.07, 0.07, 0.2], at: [0, y, 0.06], faces: 'lrt', count: 22, size: 0.01, seed: 3 }),
      ...edges(0.07, y + 0.034, 0.06, 0.2),
      ...panels('plate', ['hhhhhhhh', 'pkkkkpcp', 'pppppppp', 'pkkkkpcp', 'pppppppp', 'pkkkkpdp', 'hhhhhhhh'], CYAN, 0.07, y - 0.006, 0.0),
      ...[0.0, 0.03, 0.06, 0.09].map((z) => block(0.02, 0.006, 0.01, STEEL_LO, { at: [0, y + 0.052, z] })),
      block(0.05, 0.016, 0.17, PLATE, { at: [0, y + 0.043, 0.06] }),
      block(0.026, 0.014, 0.026, PLATE_HI, { at: [0, y + 0.058, 0.13] }),
      block(0.034, 0.016, 0.018, PLATE_HI, { at: [0, y + 0.059, -0.02] }),
      block(0.074, 0.074, 0.012, STEEL_LO, { at: [0, y, -0.036] }),
      ...SIDES.flatMap((s) => [
        ...light(0.004, 0.012, 0.15, CYAN, { at: [0.036 * s, y + 0.014, 0.065] }),
        block(0.004, 0.024, 0.07, PLATE, { at: [0.036 * s, y - 0.016, 0.105] }),
        block(0.004, 0.008, 0.008, PLATE_HI, { at: [0.039 * s, y - 0.016, 0.13] }),
      ]),
      // The plasma cell, in its cradle.
      ...light(0.034, 0.034, 0.075, CYAN, { at: [0, y - 0.056, 0.125] }),
      block(0.046, 0.046, 0.012, STEEL_LO, { at: [0, y - 0.056, 0.082] }),
      block(0.046, 0.046, 0.012, STEEL_LO, { at: [0, y - 0.056, 0.168] }),
      block(0.012, 0.008, 0.098, PLATE, { at: [0, y - 0.078, 0.125] }),
      // Barrel.
      block(0.046, 0.046, 0.07, STEEL_LO, { at: [0, y, 0.195] }),
      block(0.052, 0.052, 0.008, PLATE, { at: [0, y, 0.178] }),
      ...light(0.05, 0.05, 0.006, CYAN, { at: [0, y, 0.196] }, 1.3),
      block(0.06, 0.06, 0.016, PLATE, { at: [0, y, 0.222] }),
      block(0.036, 0.036, 0.012, BLACK, { at: [0, y, 0.231] }),
      node('muzzle_flash', { at: [0, y, 0.236] }, ...light(0.026, 0.026, 0.01, CYAN, {}, 2)),
      node('muzzle', { at: [0, y, 0.245] }),
    ),
  );
  return model(root, [fire(root, { duration: 0.28, back: 0.02, lift: 7, flash: 2.4 })]);
}

// Gravity gun: three prongs around an open cage, and a dark core that hangs
// in it. When it fires, the core caves in and spins.
function createGravity(): Model {
  const y = 0.165;
  const prong = (x: number, dy: number) => [
    block(0.022, 0.022, 0.17, PLATE, { at: [x, y + dy, 0.2] }),
    block(0.022, 0.03, 0.022, PLATE_HI, { at: [x * 0.82, y + dy * 0.86, 0.288] }),
    block(0.026, 0.026, 0.014, STEEL_LO, { at: [x, y + dy, 0.15] }),
    ...light(0.008, 0.008, 0.11, VIOLET, { at: [x * 0.74, y + dy * 0.74, 0.21] }, 1.5),
  ];
  const root = node('weapon_gravity', {},
    node('weapon_gun', { scale: SIZE },
      ...grip(),
      block(0.036, 0.03, 0.05, STEEL_LO, { at: [0, 0.122, 0] }),
      block(0.08, 0.076, 0.13, STEEL, { at: [0, y, 0.02] }),
      ...speckle([STEEL_HI, STEEL_LO], { box: [0.08, 0.076, 0.13], at: [0, y, 0.02], faces: 'lrt', count: 16, size: 0.01, seed: 8 }),
      ...edges(0.08, y + 0.037, 0.03, 0.1),
      ...panels('plate', ['pppppppp', 'pccccccp', 'pc....cp', 'pc.cc.cp', 'pc....cp', 'pccccccp', 'pppppppp'], VIOLET, 0.08, y - 0.002, 0.04),
      // Bands at the back.
      ...[-0.036, -0.012].map((z) => block(0.088, 0.084, 0.012, PLATE, { at: [0, y, z] })),
      ...SIDES.flatMap((s) => light(0.004, 0.05, 0.008, VIOLET, { at: [0.046 * s, y, -0.024] }, 1.5)),
      block(0.05, 0.014, 0.07, PLATE, { at: [0, y + 0.045, 0.03] }),
      ...light(0.03, 0.006, 0.04, VIOLET, { at: [0, y + 0.054, 0.03] }, 1.4),
      // The collar the prongs grow from, and its lens.
      block(0.104, 0.104, 0.03, PLATE, { at: [0, y, 0.1] }),
      block(0.11, 0.03, 0.034, STEEL_LO, { at: [0, y, 0.1] }),
      block(0.072, 0.072, 0.012, BLACK, { at: [0, y, 0.118] }),
      ...light(0.04, 0.04, 0.006, VIOLET, { at: [0, y, 0.125] }, 1.5),
      ...prong(0, 0.052),
      ...prong(0.047, -0.036),
      ...prong(-0.047, -0.036),
      node('weapon_core', { at: [0, y, 0.225], rot: [45, 35, 0] }, block(0.04, 0.04, 0.04, BLACK)),
      node('muzzle_flash', { at: [0, y, 0.225] }, ...light(0.022, 0.022, 0.022, VIOLET, {}, 3.4)),
      node('muzzle', { at: [0, y, 0.3] }),
    ),
  );
  return model(root, [fire(root, { duration: 0.5, back: 0.03, lift: 9, flash: 1.7 }, ({ rot, scl }) => [
    rot('weapon_core', poses([0, [0, 0, 0]], [0.12, [0, 90, 60], 'in'], [0.3, [0, 180, 90], 'out'], [0.5, [0, 180, 90]])),
    scl('weapon_core', poses([0, 1], [0.05, 0.45, 'snap'], [0.16, 1.4, 'out'], [0.5, 1, 'back'])),
  ])]);
}

// Ion rifle: the long one. Two rails with a bolt of lightning caught between
// them, a sight on top and a stock over the forearm.
function createIon(): Model {
  const y = 0.19;
  const bolt = [0, 1, 2, 3, 4, 5].flatMap((i) =>
    light(0.012, 0.012, 0.034, YELLOW, { at: [0, i % 2 ? 0.007 : -0.007, 0.19 + i * 0.048] }, 1.8));
  const root = node('weapon_ion', {},
    node('weapon_gun', { scale: SIZE },
      ...grip(),
      block(0.036, 0.05, 0.05, STEEL_LO, { at: [0, 0.136, 0] }),
      block(0.06, 0.07, 0.22, STEEL, { at: [0, y, 0.03] }),
      ...speckle([STEEL_HI, STEEL_LO], { box: [0.06, 0.07, 0.22], at: [0, y, 0.03], faces: 'lrt', count: 20, size: 0.01, seed: 12 }),
      ...edges(0.06, y + 0.034, 0.03, 0.22),
      ...panels('plate', ['pppppppp', 'pppcpppp', 'ppcppppp', 'pccccccp', 'pppppcpp', 'ppppcppp', 'pppppppp'], YELLOW, 0.06, y, 0.085),
      ...panels('vent', ['hhhhh', 'kkkkp', 'ppppp', 'kkkkp', 'ppppp', 'kkkkp', 'hhhhh'], YELLOW, 0.06, y, -0.035),
      // Stock.
      block(0.046, 0.046, 0.07, STEEL_LO, { at: [0, y + 0.004, -0.115] }),
      block(0.056, 0.07, 0.014, PLATE, { at: [0, y, -0.156] }),
      // Battery under the body.
      block(0.04, 0.05, 0.05, GRIP, { at: [0, y - 0.058, 0.09] }),
      ...light(0.012, 0.012, 0.004, YELLOW, { at: [0, y - 0.058, 0.116] }, 1.5),
      // Sight.
      block(0.016, 0.014, 0.02, STEEL_LO, { at: [0, y + 0.041, -0.02] }),
      block(0.016, 0.014, 0.02, STEEL_LO, { at: [0, y + 0.041, 0.05] }),
      block(0.03, 0.03, 0.11, PLATE, { at: [0, y + 0.062, 0.015] }),
      ...light(0.018, 0.018, 0.004, YELLOW, { at: [0, y + 0.062, 0.072] }, 1.5),
      // The rails, their braces, and the bolt between them.
      block(0.07, 0.07, 0.016, PLATE, { at: [0, y, 0.148] }),
      ...[0.026, -0.026].map((dy) => block(0.03, 0.016, 0.34, PLATE, { at: [0, y + dy, 0.31] })),
      ...[0.026, -0.026].flatMap((dy) => [0.2, 0.25, 0.35, 0.4].map((z) => block(0.034, 0.02, 0.01, STEEL_LO, { at: [0, y + dy, z] }))),
      ...[0.3, 0.468].map((z) => block(0.04, 0.074, 0.012, STEEL_LO, { at: [0, y, z] })),
      ...[0.026, -0.026].map((dy) => block(0.034, 0.02, 0.016, PLATE_HI, { at: [0, y + dy, 0.48] })),
      node('weapon_bolt', { at: [0, y, 0] }, ...bolt),
      node('muzzle_flash', { at: [0, y, 0.484] }, ...light(0.02, 0.02, 0.012, YELLOW, {}, 2.2)),
      node('muzzle', { at: [0, y, 0.495] }),
    ),
  );
  return model(root, [fire(root, { duration: 0.34, back: 0.018, lift: 5, flash: 2.8 }, ({ scl }) => [
    // The bolt thickens.
    scl('weapon_bolt', poses([0, 1], [0.03, [1.6, 1.9, 1], 'snap'], [0.14, 1], [0.34, 1])),
  ])]);
}

// Fusion cannon: the heavy one. A reactor that glows in a band around the
// body, cooling fins on top and two barrels side by side.
function createFusion(): Model {
  const y = 0.175;
  const barrel = (s: number) => node(`weapon_barrel_${s > 0 ? 'l' : 'r'}`, { at: [0.027 * s, y, 0.2] },
    block(0.042, 0.042, 0.2, STEEL_LO),
    block(0.05, 0.05, 0.018, PLATE, { at: [0, 0, 0.094] }),
    block(0.05, 0.05, 0.012, PLATE, { at: [0, 0, 0.02] }),
    block(0.03, 0.03, 0.01, BLACK, { at: [0, 0, 0.101] }),
    ...light(0.02, 0.02, 0.008, ORANGE, { at: [0, 0, 0.104] }, 1.6));
  const root = node('weapon_fusion', {},
    node('weapon_gun', { scale: SIZE },
      ...grip(),
      block(0.04, 0.03, 0.06, STEEL_LO, { at: [0, 0.122, 0.004] }),
      // The body is two slabs, with the reactor showing between them.
      block(0.1, 0.034, 0.17, STEEL, { at: [0, y + 0.034, 0.035] }),
      block(0.1, 0.034, 0.17, STEEL, { at: [0, y - 0.034, 0.035] }),
      ...speckle([STEEL_HI, STEEL_LO], { box: [0.1, 0.102, 0.17], at: [0, y, 0.035], faces: 'lrt', count: 18, size: 0.01, seed: 21 }),
      ...edges(0.1, y + 0.049, 0.035, 0.17),
      ...panels('plate', ['hhhhhhhhhh', 'pcpkpcpkpc', 'pkpcpkpcpk', 'hhhhhhhhhh'], ORANGE, 0.1, y + 0.034, 0.035),
      ...panels('skirt', ['pppppppppp', 'pkkpkkpkkp', 'pppppppppp'], ORANGE, 0.1, y - 0.036, 0.035),
      block(0.086, 0.04, 0.16, BLACK, { at: [0, y, 0.035] }),
      node('weapon_reactor', { at: [0, y, 0.035] }, ...light(0.094, 0.018, 0.11, ORANGE, {}, 1.25)),
      ...[-0.045, 0.115].map((z) => block(0.106, 0.108, 0.014, PLATE, { at: [0, y, z] })),
      // Cooling fins.
      ...[0, 1, 2, 3, 4].map((i) => block(0.07, 0.026, 0.008, PLATE_HI, { at: [0, y + 0.064, -0.012 + i * 0.024] })),
      block(0.03, 0.01, 0.12, STEEL_LO, { at: [0, y + 0.056, 0.036] }),
      // Fuel drum under the front.
      block(0.06, 0.04, 0.07, GRIP, { at: [0, y - 0.07, 0.085] }),
      ...light(0.064, 0.008, 0.012, ORANGE, { at: [0, y - 0.07, 0.085] }, 1.4),
      // The shroud the barrels come out of.
      block(0.11, 0.07, 0.03, PLATE, { at: [0, y, 0.135] }),
      barrel(1),
      barrel(-1),
      node('muzzle_flash', { at: [0, y, 0.304] }, ...light(0.05, 0.022, 0.01, ORANGE, {}, 2)),
      node('muzzle', { at: [0, y, 0.312] }),
    ),
  );
  return model(root, [fire(root, { duration: 0.6, back: 0.05, lift: 15, flash: 2.2 }, ({ mov, scl }) => [
    // The barrels slide back one after the other; the reactor surges.
    mov('weapon_barrel_l', poses([0, [0, 0, 0]], [0.05, [0, 0, -0.045], 'snap'], [0.36, [0, 0, 0], 'out'], [0.6, [0, 0, 0]])),
    mov('weapon_barrel_r', poses([0, [0, 0, 0]], [0.1, [0, 0, 0]], [0.15, [0, 0, -0.045], 'snap'], [0.46, [0, 0, 0], 'out'], [0.6, [0, 0, 0]])),
    scl('weapon_reactor', poses([0, 1], [0.05, [1.04, 2.1, 1.1], 'snap'], [0.4, 1, 'out'], [0.6, 1])),
  ])]);
}

// ---------------------------------------------------------------------------
// Shots
// ---------------------------------------------------------------------------

type Rig = ReturnType<typeof rig>;

/** The scale of a piece that is there but not to be seen yet. */
const HIDDEN = 0.02;
const wave = (phase: number, shift = 0) => Math.sin((phase + shift) * TAU);

/** Small lights waiting at the centre of a shot: they fly out when it bursts. */
function sparks(colour: string, count: number, size: number): THREE.Group[] {
  return Array.from({ length: count }, (_, i) =>
    // No halo: a spark is small and brief, and a shot should cost few draw calls.
    node(`shot_spark_${i}`, { scale: HIDDEN }, ...light(size * 1.3, size * 1.3, size * 1.3, colour, {}, 1)));
}

/** Where spark i of `count` ends up: out to the sides, some of them back. */
function sparkAim(i: number, count: number, reach: number): Vec3 {
  const angle = (i / count) * TAU + 0.4;
  return [Math.cos(angle) * reach, Math.sin(angle) * reach, (i % 2 ? -0.5 : 0.15) * reach];
}

function sparkTracks({ mov, scl }: Rig, count: number, reach: number, duration: number): Track[] {
  return Array.from({ length: count }, (_, i) => [
    mov(`shot_spark_${i}`, poses([0, [0, 0, 0]], [duration * 0.85, sparkAim(i, count, reach), 'out'], [duration, sparkAim(i, count, reach)])),
    scl(`shot_spark_${i}`, poses([0, 1], [0.04, 1 / HIDDEN, 'snap'], [duration * 0.5, 0.7 / HIDDEN], [duration, 1, 'in'])),
  ]).flat();
}

// Plasma bolt: a bright bar with a tail that thins out behind it.
function createPlasmaShot(): Model {
  const tail = [[-0.092, 0.026, 0.034], [-0.138, 0.018, 0.026], [-0.172, 0.011, 0.02]] as const;
  const root = node('shot_plasma', {},
    node('shot_body', {},
      node('shot_core', {},
        ...light(0.036, 0.036, 0.13, CYAN, {}, 1.9),
        ...light(0.02, 0.02, 0.06, WHITE, { at: [0, 0, 0.045] }, 1)),
      ...tail.map(([z, width, depth], i) => node(`shot_tail_${i}`, { at: [0, 0, z] }, ...light(width, width, depth, CYAN, {}, 1.7))),
      ...sparks(CYAN, 6, 0.02),
    ),
  );
  const tracks = rig(root);
  const { rot, scl } = tracks;
  return model(root, [
    animation('Fly', 0.3, [
      scl('shot_core', loop((p) => [1 + 0.12 * wave(p), 1 + 0.12 * wave(p), 1 - 0.06 * wave(p)])),
      rot('shot_body', loop((p) => [0, 0, 14 * wave(p)])),
      ...tail.map((_, i) => scl(`shot_tail_${i}`, loop((p) => 0.75 + 0.35 * wave(p * 2, i * 0.3)))),
    ]),
    animation('Burst', 0.32, [
      scl('shot_core', poses([0, 1], [0.05, [3, 3, 0.5], 'snap'], [0.32, HIDDEN, 'in'])),
      ...tail.map((_, i) => scl(`shot_tail_${i}`, poses([0, 1], [0.04, HIDDEN, 'snap'], [0.32, HIDDEN]))),
      ...sparkTracks(tracks, 6, 0.2, 0.32),
    ]),
  ]);
}

// Gravity orb: a dark core in a violet glow, with three moons going round
// it. When it bursts it caves in first, then blows out.
function createGravityShot(): Model {
  const MOONS = 3;
  const ORBIT = 0.11;
  const moonAt = (i: number, turn = 0, scale = 1): Vec3 => {
    const angle = (i / MOONS + turn) * TAU;
    return [Math.cos(angle) * ORBIT * scale, Math.sin(angle) * ORBIT * scale, 0];
  };
  const moons = Array.from({ length: MOONS }, (_, i) => i);
  const root = node('shot_gravity', {},
    node('shot_body', {},
      node('shot_core', { rot: [45, 35, 0] }, block(0.07, 0.07, 0.07, BLACK)),
      node('shot_aura', {}, ...light(0.04, 0.04, 0.04, VIOLET, {}, 3.8)),
      ...moons.map((i) => node(`shot_moon_${i}`, { at: moonAt(i) }, ...light(0.024, 0.024, 0.024, VIOLET, {}, 1.8))),
      ...sparks(VIOLET, 6, 0.018),
    ),
  );
  const tracks = rig(root);
  const { rot, mov, scl } = tracks;
  return model(root, [
    animation('Fly', 0.9, [
      // Offsets from where each moon rests: together they draw the orbit.
      ...moons.map((i) => mov(`shot_moon_${i}`, loop((p) => {
        const [x, y] = moonAt(i, p);
        const [x0, y0] = moonAt(i);
        return [x - x0, y - y0, 0];
      }))),
      rot('shot_core', loop((p) => [18 * wave(p), 25 * wave(p, 0.25), 0])),
      scl('shot_aura', loop((p) => 1 + 0.14 * wave(p * 2))),
    ]),
    animation('Burst', 0.5, [
      scl('shot_core', poses([0, 1], [0.09, 0.35, 'in'], [0.2, 1.5, 'out'], [0.5, HIDDEN, 'in'])),
      scl('shot_aura', poses([0, 1], [0.09, 0.5, 'in'], [0.24, 2.6, 'out'], [0.5, HIDDEN, 'in'])),
      ...moons.flatMap((i) => [
        mov(`shot_moon_${i}`, poses([0, [0, 0, 0]], [0.09, moonAt(i, 0, -0.7), 'in'], [0.3, moonAt(i, 0, 2.4), 'out'], [0.5, moonAt(i, 0, 2.4)])),
        scl(`shot_moon_${i}`, poses([0, 1], [0.3, 1.3], [0.5, HIDDEN, 'in'])),
      ]),
      ...sparkTracks(tracks, 6, 0.26, 0.5),
    ]),
  ]);
}

// Ion bolt: a zigzag of lightning that flickers between two shapes.
function createIonShot(): Model {
  const zigzag = (flip: number) => [0, 1, 2, 3, 4].flatMap((i) =>
    light(0.016, 0.016, 0.05, YELLOW, { at: [0, (i % 2 ? 0.016 : -0.016) * flip, -0.1 + i * 0.05] }, 1.8));
  const root = node('shot_ion', {},
    node('shot_body', {},
      node('shot_arc_a', {}, ...zigzag(1)),
      node('shot_arc_b', {}, ...zigzag(-1)),
      node('shot_head', { at: [0, 0, 0.145] },
        ...light(0.028, 0.028, 0.034, YELLOW, {}, 2.2),
        ...light(0.014, 0.014, 0.01, WHITE, { at: [0, 0, 0.018] }, 1)),
      ...light(0.01, 0.01, 0.03, YELLOW, { at: [0.03, 0.022, -0.02] }, 1.6),
      ...light(0.01, 0.01, 0.03, YELLOW, { at: [-0.03, -0.026, 0.05] }, 1.6),
      ...sparks(YELLOW, 6, 0.016),
    ),
  );
  const tracks = rig(root);
  const { scl } = tracks;
  return model(root, [
    animation('Fly', 0.2, [
      scl('shot_arc_a', loop((p) => [1, p < 0.5 ? 1 : HIDDEN, 1])),
      scl('shot_arc_b', loop((p) => [1, p < 0.5 ? HIDDEN : 1, 1])),
      scl('shot_head', loop((p) => 1 + 0.2 * wave(p))),
    ]),
    animation('Burst', 0.28, [
      scl('shot_arc_a', poses([0, 1], [0.04, [3, 3, 0.4], 'snap'], [0.28, HIDDEN, 'in'])),
      scl('shot_arc_b', poses([0, 1], [0.04, [2.4, 3.4, 0.4], 'snap'], [0.28, HIDDEN, 'in'])),
      scl('shot_head', poses([0, 1], [0.04, 2.5, 'snap'], [0.28, HIDDEN, 'in'])),
      ...sparkTracks(tracks, 6, 0.22, 0.28),
    ]),
  ]);
}

// Fusion shell: a white-hot core held by four bars, with embers behind it.
// It bursts into the biggest flash of the four.
function createFusionShot(): Model {
  const bars = [[0.058, 0], [-0.058, 0], [0, 0.058], [0, -0.058]] as const;
  const embers = [[0.02, 0.015, -0.085, 0.03], [-0.025, -0.01, -0.125, 0.022], [0.01, -0.02, -0.16, 0.016]] as const;
  const root = node('shot_fusion', {},
    node('shot_body', {},
      node('shot_core', {},
        ...light(0.08, 0.08, 0.08, ORANGE, {}, 2),
        ...light(0.046, 0.046, 0.01, '#fff3c4', { at: [0, 0, 0.041] }, 1)),
      ...bars.map(([x, y], i) => node(`shot_bar_${i}`, { at: [x, y, 0] },
        block(0.018, 0.018, 0.11, PLATE),
        block(0.022, 0.022, 0.02, STEEL_LO, { at: [0, 0, 0.05] }))),
      ...embers.map(([x, y, z, size], i) => node(`shot_ember_${i}`, { at: [x, y, z] }, ...light(size, size, size, ORANGE, {}, 1.7))),
      ...sparks(ORANGE, 8, 0.028),
    ),
  );
  const tracks = rig(root);
  const { rot, mov, scl } = tracks;
  return model(root, [
    animation('Fly', 0.5, [
      scl('shot_core', loop((p) => 1 + 0.1 * wave(p * 2))),
      rot('shot_body', loop((p) => [0, 0, 10 * wave(p)])),
      ...embers.map((_, i) => scl(`shot_ember_${i}`, loop((p) => 0.7 + 0.4 * wave(p * 2, i * 0.35)))),
    ]),
    animation('Burst', 0.55, [
      scl('shot_core', poses([0, 1], [0.1, 4.2, 'out'], [0.3, 3.2], [0.55, HIDDEN, 'in'])),
      ...bars.flatMap(([x, y], i) => [
        mov(`shot_bar_${i}`, poses([0, [0, 0, 0]], [0.4, [x * 5, y * 5, -0.08], 'out'], [0.55, [x * 5, y * 5, -0.08]])),
        scl(`shot_bar_${i}`, poses([0, 1], [0.3, 1], [0.55, HIDDEN, 'in'])),
      ]),
      ...embers.map((_, i) => scl(`shot_ember_${i}`, poses([0, 1], [0.05, HIDDEN, 'snap'], [0.55, HIDDEN]))),
      ...sparkTracks(tracks, 8, 0.4, 0.55),
    ]),
  ]);
}

export const weapons: readonly ModelEntry[] = [
  { id: 'weapon-plasma', name: 'Plasma blaster', type: 'weapon', create: createPlasma },
  { id: 'weapon-gravity', name: 'Gravity gun', type: 'weapon', create: createGravity },
  { id: 'weapon-ion', name: 'Ion rifle', type: 'weapon', create: createIon },
  { id: 'weapon-fusion', name: 'Fusion cannon', type: 'weapon', create: createFusion },
  { id: 'shot-plasma', name: 'Plasma bolt', type: 'shot', create: createPlasmaShot },
  { id: 'shot-gravity', name: 'Gravity orb', type: 'shot', create: createGravityShot },
  { id: 'shot-ion', name: 'Ion bolt', type: 'shot', create: createIonShot },
  { id: 'shot-fusion', name: 'Fusion shell', type: 'shot', create: createFusionShot },
];

/** The shot a weapon fires: `weapon-x` fires `shot-x`. */
export function shotFor(weaponId: string): ModelEntry | undefined {
  const id = weaponId.replace(/^weapon-/, 'shot-');
  return weapons.find((entry) => entry.type === 'shot' && entry.id === id);
}
