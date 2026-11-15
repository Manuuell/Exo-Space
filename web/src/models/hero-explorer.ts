// The protagonist as a deep-space explorer, in a smooth, sculpted look: a
// proposal for the team to compare with the voxel hero. Not a classic
// astronaut: an exosuit in royal blue cloth with navy armour, dark ribbed
// joints and gold trim (the colours of the team's concept art), a helmet
// with a wrap-around amber visor and a breather, a scarf, and a pack with a
// glowing reactor, hoses, a bedroll and a whip antenna. Key art from other
// games gave the general idea of the look only; the suit is the team's own.
// The design comes first: it has no clips yet.

import type * as THREE from 'three';
import { bar, barrel, box, capsule, cone, cube, fabric, glow, halo, lacquer, lathe, metal, model, node, part, patch, pbr, plate, rubber, satin, sphere, strap, torus, tube, visor } from './kit.ts';
import type { Model, ModelEntry, Place } from './kit.ts';

const SUIT = satin('#2458d2');
const PLATE = lacquer('#2f6fe8');
const NAVY = lacquer('#17378a');
const NAVY_MATT = pbr('#17378a', 0, 0.6);
const SHELL = lacquer('#e6eaf1');
const UNDER = rubber('#1f222b');
const UNDER_HI = rubber('#363b48');
const CANVAS = fabric('#c9a777');
const CANVAS_DARK = fabric('#9a7a4f');
const SCARF = fabric('#f0812a');
const GOLD = pbr('#f3a51e', 0.65, 0.24);
const STEEL = metal('#b4bcc9');
const AMBER = visor('#ff9d1f');
const LENS = visor('#0a2038');
const CYAN = '#63e9ff';
const ICE = '#e8fbff';
const WARM = '#ffd45a';
const RED = '#ff5a4a';

type Side = 'l' | 'r';
type Profile = readonly (readonly [number, number])[];

// Armour that follows the legs: [radius, height] profiles, from the bottom up.
const THIGH_GUARD: Profile = [[0.112, -0.325], [0.131, -0.2], [0.135, -0.075]];
const SHIN_GUARD: Profile = [[0.099, -0.288], [0.111, -0.2], [0.1105, -0.085]];

/** The same profile, that much further out. */
function lift(profile: Profile, by: number): Profile {
  return profile.map(([r, y]) => [r + by, y] as const);
}
const SIDES = [1, -1] as const;

/** A part that gives off light. */
function lit(geometry: THREE.BufferGeometry, colour: string, place: Place = {}): THREE.Mesh {
  return part(geometry, glow(colour), { ...place, outline: false });
}

/**
 * A strip of light with a soft glow around it. `aura` is the same shape, a
 * little bigger.
 */
function beam(core: THREE.BufferGeometry, aura: THREE.BufferGeometry, colour: string, place: Place = {}): THREE.Mesh[] {
  return [lit(core, colour, place), part(aura, halo(colour, 0.28), place)];
}

/** The profile of a ribbed sleeve: the joints of the undersuit. */
function ribs(radius: number, from: number, to: number, count: number, depth = 0.008): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 0; i <= count * 2; i++) {
    points.push([i % 2 ? radius : radius - depth, from + ((to - from) * i) / (count * 2)]);
  }
  return points;
}

function arm(side: Side): THREE.Group {
  const s = side === 'l' ? 1 : -1;
  const fingers = [-0.035, -0.012, 0.012, 0.035].map((z, i) => {
    const reach = i === 0 || i === 3 ? 0.86 : 1;
    return bar([-0.002 * s, -0.09, z], [-0.034 * s, -0.09 - 0.07 * reach, z * 0.92], 0.0175, UNDER);
  });
  const hand = node(`hand_${side}`, { at: [0, -0.285, 0], rot: [0, -38 * s, 0] },
    part(box(0.056, 0.1, 0.096, 0.024), UNDER_HI, { at: [0, -0.048, 0] }),
    // Armour over the back of the hand, on the outside.
    part(box(0.024, 0.066, 0.08, 0.01), PLATE, { at: [0.026 * s, -0.042, 0] }),
    part(box(0.014, 0.02, 0.084, 0.005), GOLD, { at: [0.029 * s, -0.082, 0] }),
    ...fingers,
    bar([-0.008 * s, -0.03, 0.046], [-0.034 * s, -0.092, 0.07], 0.019, UNDER),
  );
  const forearm = node(`forearm_${side}`, { at: [0, -0.3, 0], rot: [-9, 0, 0] },
    part(lathe(ribs(0.08, -0.045, 0.045, 3), 14), UNDER),
    // Elbow pad, behind.
    part(sphere(0.05, 0.6), UNDER_HI, { at: [0, 0, -0.066], scale: [1, 1.15, 0.55] }),
    part(lathe([[0.07, -0.13], [0.08, -0.08], [0.0835, -0.04]], 14, 5), SUIT),
    // The bracer: navy armour with gold rings and a blue band.
    part(lathe([[0.066, -0.264], [0.08, -0.25], [0.088, -0.19], [0.083, -0.12], [0.07, -0.105]], 16, 9), NAVY),
    part(lathe([[0.085, -0.218], [0.0905, -0.212], [0.0905, -0.178], [0.085, -0.172]], 16), PLATE),
    ...beam(
      lathe([[0.0905, -0.201], [0.0925, -0.199], [0.0925, -0.191], [0.0905, -0.189]], 16),
      lathe([[0.091, -0.213], [0.0965, -0.206], [0.0965, -0.184], [0.091, -0.177]], 16), CYAN),
    part(torus(0.08, 0.007, 0.7), GOLD, { at: [0, -0.115, 0] }),
    part(torus(0.073, 0.007, 0.7), GOLD, { at: [0, -0.252, 0] }),
    part(lathe(ribs(0.06, -0.3, -0.25, 2, 0.006), 12), UNDER),
    hand,
  );
  if (side === 'l') {
    // Wrist computer on the left bracer.
    forearm.add(
      part(box(0.07, 0.09, 0.024, 0.008), UNDER, { at: [0.087, -0.19, 0.012], rot: [0, 82, 0] }),
      lit(cube(0.05, 0.062, 0.006), CYAN, { at: [0.0995, -0.19, 0.0105], rot: [0, 82, 0] }),
    );
    // The big pauldron: navy armour with a gold edge, a blue plate and a light.
    const shoulder = [0.9, 0.42, 0.03] as const;
    return node('arm_l', { at: [0.275, 0.385, 0], rot: [0, 0, 7] },
      part(sphere(0.1, 0.6), SUIT),
      part(patch(0.127, 74, [-74, 74], { round: 1, depth: 0.01, steps: [7, 7] }), GOLD, { face: shoulder }),
      part(patch(0.13, 68, [-68, 68], { round: 1, depth: 0.014, steps: [9, 9] }), NAVY, { face: shoulder }),
      part(patch(0.136, 38, [-38, 38], { round: 1, depth: 0.008, steps: [6, 6] }), PLATE, { face: [0.75, 0.66, 0.03] }),
      ...beam(
        patch(0.1385, 3.5, [-28, 28], { round: 0.5, steps: [1, 6] }),
        patch(0.14, 10, [-32, 32], { round: 0.6, steps: [2, 6] }), CYAN, { face: [0.75, 0.66, 0.03], rot: [0, 0, 40] }),
      ...sleeve(),
      forearm,
    );
  }
  // A torch clipped to the right bracer.
  forearm.add(
    part(capsule(0.015, 0.1), UNDER_HI, { at: [-0.098, -0.19, 0] }),
    part(torus(0.016, 0.004, 0.6), GOLD, { at: [-0.098, -0.225, 0] }),
    lit(sphere(0.011, 0.6), ICE, { at: [-0.098, -0.243, 0] }),
  );
  // The right shoulder carries a lighter cap.
  const shoulder = [-0.85, 0.52, 0.03] as const;
  return node('arm_r', { at: [-0.275, 0.385, 0], rot: [0, 0, -7] },
    part(sphere(0.1, 0.6), SUIT),
    part(patch(0.116, 62, [-62, 62], { round: 1, depth: 0.01, steps: [6, 6] }), GOLD, { face: shoulder }),
    part(patch(0.119, 55, [-55, 55], { round: 1, depth: 0.014, steps: [8, 8] }), NAVY, { face: shoulder }),
    ...sleeve(),
    forearm,
  );
}

/** The upper sleeve with its armband. */
function sleeve(): THREE.Mesh[] {
  return [
    part(lathe([[0.0835, -0.262], [0.084, -0.2], [0.088, -0.11], [0.091, -0.03], [0.07, 0.03]], 16, 8), SUIT),
    part(lathe([[0.079, -0.205], [0.0865, -0.2], [0.0875, -0.165], [0.082, -0.16]], 16), NAVY),
    part(lathe([[0.08, -0.224], [0.0885, -0.22], [0.0885, -0.208], [0.08, -0.204]], 16), GOLD),
  ];
}

function leg(side: Side): THREE.Group {
  const s = side === 'l' ? 1 : -1;
  const foot = node(`foot_${side}`, { at: [0, -0.385, 0] },
    part(lathe([[0.09, -0.03], [0.102, 0.02], [0.105, 0.07], [0.094, 0.092]], 16, 6), NAVY),
    part(torus(0.099, 0.008, 0.7), GOLD, { at: [0, 0.084, 0] }),
    // Navy upper, rubber toe cap and heel, a thick oval sole, a ring of light.
    part(sphere(0.1, 0.7), NAVY, { at: [0, -0.016, 0.05], scale: [0.82, 0.62, 1.5] }),
    part(sphere(0.084, 0.7), UNDER_HI, { at: [0, -0.02, 0.15], scale: [1, 0.74, 1] }),
    part(sphere(0.07, 0.6), UNDER_HI, { at: [0, -0.02, -0.055], scale: [1.05, 0.8, 0.8] }),
    ...beam(
      lathe([[0.107, 0.025], [0.109, 0.027], [0.109, 0.035], [0.107, 0.037]], 16),
      lathe([[0.107, 0.012], [0.113, 0.02], [0.113, 0.042], [0.107, 0.05]], 16), CYAN),
    part(barrel(0.088, 0.092, 0.042, 0.012), UNDER, { at: [0, -0.064, 0.066], scale: [1, 1, 1.9] }),
  );
  const shin = node(`shin_${side}`, { at: [0, -0.43, 0] },
    part(lathe(ribs(0.096, -0.06, 0.06, 3), 14), UNDER),
    // Knee pad: rubber over a gold backing.
    part(plate([[0.108, -0.1], [0.108, 0], [0.11, 0.1]], 54, { round: 1, depth: 0.012, steps: [6, 6] }), GOLD),
    part(plate([[0.11, -0.078], [0.122, 0], [0.11, 0.078]], 45, { round: 1, depth: 0.016, steps: [6, 6] }), UNDER_HI),
    part(lathe([[0.078, -0.37], [0.088, -0.29], [0.104, -0.17], [0.102, -0.09], [0.099, -0.05]], 16, 8), SUIT),
    // Shin guard: gold edge, navy plate, a stripe of light.
    part(plate([[0.0985, -0.296], [0.108, -0.2], [0.1075, -0.07]], 54, { round: 0.6, depth: 0.01, steps: [6, 6] }), GOLD),
    part(plate(SHIN_GUARD, 46, { round: 0.6, depth: 0.012, steps: [7, 6] }), NAVY),
    ...beam(
      plate(lift(SHIN_GUARD, 0.0015), 3.8, { round: 0.5, span: [0.1, 0.9], steps: [1, 6] }),
      plate(lift(SHIN_GUARD, 0.003), 11, { round: 0.6, span: [0.06, 0.94], steps: [2, 6] }), CYAN),
    // A line of light down the back of the calf, for the camera behind.
    ...beam(
      strap([[0, -0.085, -0.103], [0, -0.17, -0.1075], [0, -0.275, -0.092]], 0.012, 0.006, [1, 0, 0], 0.4),
      strap([[0, -0.07, -0.103], [0, -0.17, -0.109], [0, -0.29, -0.092]], 0.036, 0.01, [1, 0, 0], 0.4), CYAN),
    foot,
  );
  const thigh = node(`leg_${side}`, { at: [0.115 * s, 0, 0], rot: [0, 7 * s, 0] },
    part(lathe([[0.099, -0.39], [0.104, -0.33], [0.122, -0.2], [0.126, -0.07], [0.105, 0.02], [0.065, 0.06]], 18, 10), SUIT),
    // Thigh guard: a navy plate with a gold edge and a stripe of light.
    part(plate([[0.107, -0.342], [0.128, -0.2], [0.132, -0.06]], 53, { turn: 24 * s, round: 0.7, depth: 0.01, steps: [6, 6] }), GOLD),
    part(plate(THIGH_GUARD, 45, { turn: 24 * s, round: 0.7, depth: 0.012, steps: [7, 6] }), NAVY),
    ...beam(
      plate(lift(THIGH_GUARD, 0.0015), 2.8, { turn: 24 * s, round: 0.5, span: [0.12, 0.88], steps: [1, 6] }),
      plate(lift(THIGH_GUARD, 0.003), 8.5, { turn: 24 * s, round: 0.6, span: [0.08, 0.92], steps: [2, 6] }), CYAN),
    part(lathe([[0.108, -0.352], [0.117, -0.346], [0.117, -0.314], [0.108, -0.308]], 18), UNDER),
    shin,
  );
  if (side === 'r') {
    // Holster on the right thigh, with the grip of the multitool showing.
    thigh.add(
      part(box(0.05, 0.13, 0.085, 0.016), UNDER_HI, { at: [-0.134, -0.255, 0.008] }),
      part(box(0.03, 0.075, 0.046, 0.01), STEEL, { at: [-0.137, -0.168, -0.002], rot: [-12, 0, 0] }),
      part(box(0.034, 0.022, 0.052, 0.007), GOLD, { at: [-0.137, -0.13, -0.01], rot: [-12, 0, 0] }),
      lit(cube(0.008, 0.012, 0.02), CYAN, { at: [-0.154, -0.16, -0.004], rot: [-12, 0, 0] }),
    );
  } else {
    // A canvas pouch on the left thigh.
    thigh.add(
      part(box(0.05, 0.09, 0.085, 0.016), CANVAS, { at: [0.134, -0.235, 0.004] }),
      part(box(0.054, 0.034, 0.089, 0.01), CANVAS_DARK, { at: [0.135, -0.2, 0.004] }),
      part(sphere(0.008, 0.6), GOLD, { at: [0.162, -0.214, 0.004] }),
    );
  }
  return thigh;
}

function create(): Model {
  // Helmet: a blue shell, a wrap-around amber visor in a dark frame under a
  // heavy brow, a breather with two filters, and a crest with a line of light.
  const R = 0.178;
  const over = { rot: [-116, 0, 90] } as const;
  const helmet = node('helmet', { at: [0, 0.15, 0.008] },
    part(sphere(R, 1.2), PLATE),
    part(patch(R + 0.004, 86, [-27, 30], { round: 0.6 }), UNDER),
    part(patch(R + 0.008, 76, [-17, 22], { round: 0.75 }), AMBER),
    part(patch(R + 0.015, 72, [22, 40], { round: 0.5, depth: 0.014 }), NAVY),
    lit(patch(R + 0.0165, 14, [28.5, 32], { round: 0.3, steps: [3, 1] }), CYAN),
    part(patch(R + 0.011, 56, [-64, -27], { round: 0.5, depth: 0.012 }), NAVY),
    part(box(0.1, 0.066, 0.058, 0.02), UNDER_HI, { at: [0, -0.098, 0.159], rot: [28, 0, 0] }),
    ...[-0.022, 0, 0.022].map((x) => part(cube(0.01, 0.036, 0.006), UNDER, { at: [x, -0.1125, 0.1855], rot: [28, 0, 0] })),
    ...SIDES.flatMap((s) => [
      part(barrel(0.03, 0.036, 0.045, 0.008), UNDER_HI, { at: [0.078 * s, -0.105, 0.135], up: [0.5 * s, -0.45, 0.74] }),
      part(torus(0.031, 0.006, 0.7), GOLD, { at: [0.088 * s, -0.114, 0.15], up: [0.5 * s, -0.45, 0.74] }),
    ]),
    part(patch(R + 0.007, 76, [-10, 10], { round: 0.4, depth: 0.009 }), NAVY, over),
    part(patch(R + 0.008, 76, [11, 13.5], { round: 0, steps: [13, 1] }), GOLD, over),
    part(patch(R + 0.008, 76, [-13.5, -11], { round: 0, steps: [13, 1] }), GOLD, over),
    ...beam(
      patch(R + 0.0085, 72, [-1.6, 1.6], { round: 0, steps: [12, 1] }),
      patch(R + 0.0095, 74, [-5.5, 5.5], { round: 0.3, steps: [12, 1] }), CYAN, over),
    // Vents at the back, a rim at the neck.
    part(patch(R + 0.011, 30, [-34, 0], { round: 0.5, depth: 0.012 }), NAVY, { rot: [0, 180, 0] }),
    ...[-26, -18, -10].map((pitch) => part(patch(R + 0.013, 15, [pitch, pitch + 3.5], { round: 0.2, steps: [3, 1] }), UNDER, { rot: [0, 180, 0] })),
    part(torus(0.122, 0.016, 0.8), UNDER_HI, { at: [0, -0.135, 0] }),
    // Ear units with a status light.
    ...SIDES.flatMap((s) => [
      part(barrel(0.058, 0.066, 0.05, 0.012, 1.34), UNDER_HI, { at: [s * (R - 0.004), -0.005, -0.012], up: [s, 0, 0] }),
      part(torus(0.04, 0.007, 0.7), GOLD, { at: [s * (R + 0.021), -0.005, -0.012], up: [s, 0, 0] }),
      lit(sphere(0.02, 0.6), CYAN, { at: [s * (R + 0.014), -0.005, -0.012] }),
    ]),
    // Lamp on the right.
    part(barrel(0.034, 0.03, 0.075, 0.008, 0.8), UNDER_HI, { at: [-0.16, 0.104, 0.056], up: [0, 0, 1] }),
    part(torus(0.034, 0.006, 0.7), GOLD, { at: [-0.16, 0.104, 0.086], up: [0, 0, 1] }),
    lit(sphere(0.027), WARM, { at: [-0.16, 0.104, 0.09], scale: [1, 1, 0.4] }),
    part(sphere(0.046, 0.5), halo(WARM, 0.22), { at: [-0.16, 0.104, 0.096], scale: [1, 1, 0.45] }),
  );

  const head = node('head', { at: [0, 0.49, 0] },
    part(lathe(ribs(0.09, -0.05, 0.04, 3), 14), UNDER),
    helmet,
  );

  // The pack: a rounded shell with a glowing reactor, two hoses, thrusters,
  // a bedroll on top, a whip antenna with a pennant, and a sensor orb on an
  // arm over the left shoulder.
  const reactor = { up: [0, 0, -1] } as const;
  const orb = [0.265, 0.47, 0] as const;
  const backpack = node('backpack', { at: [0, 0.26, -0.17] },
    part(sphere(0.2), PLATE, { at: [0, 0.02, -0.055], scale: [0.9, 1.1, 0.58] }),
    ...SIDES.flatMap((s) => beam(
      patch(0.2015, 2, [-38, 30], { turn: 50 * s, round: 0.3, steps: [1, 8] }),
      patch(0.203, 6, [-42, 34], { turn: 50 * s, round: 0.5, steps: [2, 8] }), CYAN, { at: [0, 0.02, -0.055], scale: [0.9, 1.1, 0.58], rot: [0, 180, 0] })),
    part(torus(0.2, 0.012, 0.8), UNDER_HI, { at: [0, 0.02, -0.06], scale: [0.905, 1, 1.105], up: [0, 0, 1] }),
    part(barrel(0.1, 0.112, 0.03, 0.01, 1.34), NAVY, { at: [0, 0.04, -0.166], ...reactor }),
    part(sphere(0.085, 0.5), halo(CYAN, 0.2), { at: [0, 0.04, -0.192], scale: [1, 1, 0.12] }),
    part(torus(0.092, 0.008, 0.8), GOLD, { at: [0, 0.04, -0.182], ...reactor }),
    part(barrel(0.076, 0.082, 0.016, 0.005), UNDER, { at: [0, 0.04, -0.184], ...reactor }),
    lit(torus(0.052, 0.01), CYAN, { at: [0, 0.04, -0.193], ...reactor }),
    part(barrel(0.03, 0.036, 0.02, 0.006, 0.67), STEEL, { at: [0, 0.04, -0.196], ...reactor }),
    lit(sphere(0.012, 0.6), ICE, { at: [0, 0.04, -0.207] }),
    ...SIDES.flatMap((s) => [
      part(tube([[0.08 * s, -0.17, -0.09], [0.18 * s, -0.14, -0.1], [0.226 * s, -0.04, -0.105], [0.2 * s, 0.06, -0.1], [0.12 * s, 0.1, -0.09]], 0.018, 0.6), UNDER),
      part(barrel(0.024, 0.024, 0.03, 0.006, 0.5), GOLD, { at: [0.128 * s, 0.098, -0.091], up: [1, -0.3, 0.1] }),
      part(barrel(0.034, 0.05, 0.075, 0.008, 0.8), UNDER_HI, { at: [0.075 * s, -0.215, -0.075], up: [0.12 * s, 1, 0] }),
      lit(sphere(0.038, 0.5), WARM, { at: [0.071 * s, -0.25, -0.075], scale: [1, 0.3, 1] }),
      // Straps of the bedroll, and its rolled ends.
      part(torus(0.054, 0.008, 0.7), UNDER, { at: [0.085 * s, 0.262, -0.075], up: [1, 0, 0] }),
      part(sphere(0.028, 0.6), CANVAS_DARK, { at: [0.168 * s, 0.262, -0.075], scale: [0.5, 1, 1] }),
    ]),
    part(capsule(0.052, 0.36), CANVAS, { at: [0, 0.262, -0.075], up: [1, 0, 0] }),
    // Whip antenna: a beacon on top, a pennant under it.
    part(barrel(0.014, 0.018, 0.03, 0.004, 0.67), UNDER_HI, { at: [-0.13, 0.2, -0.09] }),
    bar([-0.13, 0.2, -0.09], [-0.165, 0.62, -0.13], 0.005, UNDER),
    lit(sphere(0.012, 0.6), RED, { at: [-0.166, 0.63, -0.131] }),
    part(sphere(0.024, 0.6), halo(RED, 0.3), { at: [-0.166, 0.63, -0.131] }),
    part(cone(0.03, 0.09), SCARF, { at: [-0.1587, 0.545, -0.1228], up: [0, 0.1, -1], scale: [0.12, 1, 1] }),
    // Sensor orb.
    part(tube([[0.14, 0.17, -0.07], [0.21, 0.24, -0.07], [0.25, 0.33, -0.05], [0.262, 0.41, -0.02]], 0.011, 0.6), UNDER),
    part(sphere(0.018, 0.6), STEEL, { at: [0.21, 0.24, -0.07] }),
    part(sphere(0.058, 0.7), SHELL, { at: orb }),
    part(torus(0.058, 0.009, 0.7), PLATE, { at: orb, up: [0.15, 1, -0.2] }),
    part(torus(0.029, 0.008, 0.7), STEEL, { at: [orb[0], orb[1], orb[2] + 0.052], up: [0, 0, 1] }),
    part(sphere(0.026), LENS, { at: [orb[0], orb[1], orb[2] + 0.048], scale: [1, 1, 0.5] }),
    lit(sphere(0.013, 0.6), CYAN, { at: [orb[0], orb[1], orb[2] + 0.06] }),
  );

  // The chest rig: an armoured plate around a glowing lens, with pouches.
  const eye = [0, -0.004] as const;
  const chestUnit = node('chest_unit', { at: [0, 0.275, 0.152], rot: [-8, 0, 0] },
    part(box(0.27, 0.17, 0.058, 0.026), NAVY_MATT, { at: [0, 0, 0.004] }),
    part(box(0.274, 0.014, 0.07, 0.006), GOLD, { at: [0, 0.052, 0] }),
    part(barrel(0.076, 0.084, 0.036, 0.012), UNDER_HI, { at: [eye[0], eye[1], 0.04], up: [0, 0, 1] }),
    part(torus(0.066, 0.013), STEEL, { at: [eye[0], eye[1], 0.06], up: [0, 0, 1] }),
    part(sphere(0.06, 0.7), LENS, { at: [eye[0], eye[1], 0.05], scale: [1, 1, 0.4] }),
    lit(torus(0.037, 0.009), CYAN, { at: [eye[0], eye[1], 0.071], up: [0, 0, 1] }),
    lit(sphere(0.015, 0.6), ICE, { at: [eye[0], eye[1], 0.073] }),
    ...[0, 1, 2].map((i) => lit(cube(0.022, 0.01, 0.006), i === 0 ? WARM : CYAN, { at: [0.108, 0.005 - i * 0.022, 0.034] })),
    ...[0, 1].map((i) => part(sphere(0.009, 0.6), GOLD, { at: [-0.108, -0.005 - i * 0.03, 0.033] })),
    ...SIDES.flatMap((s) => [
      // Lugs for the harness, and a canvas pouch under the plate.
      part(box(0.07, 0.04, 0.056, 0.014), UNDER_HI, { at: [0.1 * s, 0.098, -0.006] }),
      part(box(0.05, 0.016, 0.06, 0.006), GOLD, { at: [0.1 * s, 0.104, -0.004] }),
      part(box(0.085, 0.075, 0.048, 0.014), CANVAS, { at: [0.068 * s, -0.125, -0.012] }),
      part(box(0.089, 0.03, 0.052, 0.01), CANVAS_DARK, { at: [0.068 * s, -0.1, -0.012] }),
      part(sphere(0.008, 0.6), GOLD, { at: [0.068 * s, -0.114, 0.015] }),
    ]),
  );

  const chest = node('chest', { at: [0, 0.12, 0] },
    part(lathe(ribs(0.168, -0.04, 0.12, 4), 18), UNDER, { scale: [1, 1, 0.8] }),
    // The jacket, with a gold hem over the ribbed undersuit.
    part(lathe([[0.173, 0.1], [0.195, 0.15], [0.215, 0.25], [0.212, 0.35], [0.172, 0.42], [0.115, 0.462], [0.08, 0.48]], 20, 12), SUIT, { scale: [1, 1, 0.8] }),
    part(lathe([[0.17, 0.092], [0.179, 0.097], [0.18, 0.112], [0.174, 0.117]], 20), GOLD, { scale: [1, 1, 0.8] }),
    // Collar, wrapped in a scarf knotted at the front.
    part(lathe([[0.1, 0.425], [0.15, 0.432], [0.158, 0.45], [0.13, 0.47]], 18, 6), NAVY),
    part(lathe([[0.1, -0.03], [0.15, -0.026], [0.166, -0.002], [0.156, 0.024], [0.118, 0.036]], 18, 9), SCARF, { at: [0, 0.472, 0], rot: [8, 0, 0] }),
    part(sphere(0.03, 0.6), SCARF, { at: [-0.06, 0.452, 0.156], scale: [1.2, 0.9, 0.9] }),
    part(strap([[-0.066, 0.448, 0.158], [-0.088, 0.4, 0.182], [-0.098, 0.335, 0.2]], 0.05, 0.01, [1, 0, 0], 0.6), SCARF),
    part(strap([[-0.054, 0.448, 0.158], [-0.04, 0.405, 0.186], [-0.034, 0.36, 0.2]], 0.044, 0.01, [1, 0, 0], 0.6), SCARF),
    // Harness: over the shoulders to the pack, and down to the belt.
    ...SIDES.flatMap((s) => [
      part(strap([[0.1 * s, 0.385, 0.146], [0.114 * s, 0.452, 0.07], [0.118 * s, 0.467, -0.01], [0.114 * s, 0.44, -0.09], [0.105 * s, 0.37, -0.15]], 0.05, 0.016, [1, 0, 0], 0.6), UNDER_HI),
      part(strap([[0.118 * s, 0.2, 0.168], [0.132 * s, 0.1, 0.143], [0.138 * s, 0.005, 0.12]], 0.034, 0.012, [1, 0, 0], 0.6), UNDER_HI),
    ]),
    // Radio on the left strap.
    part(box(0.044, 0.066, 0.028, 0.008), UNDER, { at: [0.111, 0.44, 0.12], rot: [-52, 0, 0] }),
    bar([0.124, 0.462, 0.1], [0.128, 0.52, 0.062], 0.004, UNDER),
    lit(sphere(0.007, 0.6), RED, { at: [0.1, 0.462, 0.118] }),
    chestUnit,
    arm('l'),
    arm('r'),
    head,
    backpack,
  );

  const body = node('body', { at: [0, 0.9, 0] },
    part(sphere(0.17, 0.8), SUIT, { at: [0, 0.01, 0], scale: [1.26, 0.8, 0.88] }),
    // A plate hanging from the belt over each thigh.
    ...SIDES.flatMap((s) => [
      part(plate([[0.132, -0.2], [0.136, -0.1], [0.13, -0.01], [0.116, 0.045]], 46, { turn: 68 * s, round: 0.7, depth: 0.01, steps: [5, 6] }), GOLD, { at: [0.115 * s, 0, 0] }),
      part(plate([[0.137, -0.185], [0.14, -0.1], [0.134, -0.015], [0.121, 0.035]], 39, { turn: 68 * s, round: 0.7, depth: 0.014, steps: [6, 6] }), NAVY, { at: [0.115 * s, 0, 0] }),
    ]),
    // Belt: buckle in front, a canvas pouch on each side.
    part(lathe([[0.176, -0.035], [0.19, -0.028], [0.19, 0.028], [0.176, 0.035]], 20), UNDER_HI, { at: [0, 0.105, 0], scale: [1, 1, 0.8] }),
    part(box(0.078, 0.064, 0.03, 0.01), GOLD, { at: [0, 0.105, 0.148] }),
    lit(cube(0.04, 0.03, 0.034), CYAN, { at: [0, 0.105, 0.15] }),
    ...SIDES.flatMap((s) => [
      part(box(0.085, 0.1, 0.055, 0.016), CANVAS, { at: [0.126 * s, 0.075, 0.124], rot: [0, 32 * s, 0] }),
      part(box(0.09, 0.04, 0.06, 0.012), CANVAS_DARK, { at: [0.126 * s, 0.108, 0.124], rot: [0, 32 * s, 0] }),
      part(sphere(0.009, 0.6), GOLD, { at: [0.143 * s, 0.092, 0.151] }),
    ]),
    // Behind: a canister, a coil of rope on the left and a lantern on the right.
    part(capsule(0.045, 0.2), NAVY, { at: [0, 0.08, -0.176], up: [1, 0, 0] }),
    part(torus(0.05, 0.013, 0.8), CANVAS, { at: [0.15, 0.03, -0.118], up: [0.6, 0.1, -0.8] }),
    part(box(0.028, 0.05, 0.03, 0.006), UNDER, { at: [0.143, 0.078, -0.108], rot: [0, -37, 0] }),
    part(barrel(0.026, 0.03, 0.014, 0.004, 0.6), UNDER_HI, { at: [-0.15, 0.047, -0.125] }),
    lit(capsule(0.021, 0.074), WARM, { at: [-0.15, 0.002, -0.125] }),
    part(barrel(0.03, 0.026, 0.014, 0.004, 0.6), UNDER_HI, { at: [-0.15, -0.043, -0.125] }),
    part(sphere(0.046, 0.5), halo(WARM, 0.2), { at: [-0.15, 0.002, -0.125] }),
    chest,
    leg('l'),
    leg('r'),
  );

  return model(node('hero_explorer', {}, body), []);
}

export const heroExplorer: ModelEntry = { id: 'hero-explorer', name: 'Hero · explorer', type: 'player', draft: true, create };
