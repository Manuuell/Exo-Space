// Hornet Drone: a flying machine of the planner AI, guarding its depots.
// Adapted from NASA's Ingenuity Mars helicopter (NASA 3D Resources,
// reference-models/nasa/): a small box body on four splayed legs, two
// counter-rotating rotors on a mast and a solar panel on top. Rebuilt in voxel
// and turned hostile: a red eye, a gun under the body, red blade tips and
// spiked feet. No insignia. It hovers about 1.7 m above its origin.

import { TAU, animation, block, light, loop, model, node, poses, rig } from './kit.ts';
import type { Model, ModelEntry, Vec3 } from './kit.ts';

const HOVER = 1.7;
const GREY = '#a7acb6';
const FOIL = '#c9a24a';
const DARK = '#2f3239';
const PANEL = '#1d2a55';
const RED = '#ff3b2f';

function rotor(name: string, y: number, turn: number): ReturnType<typeof node> {
  return node(name, { at: [0, y, 0], rot: [0, turn, 0] },
    block(1.3, 0.02, 0.11, DARK),
    block(0.12, 0.05, 0.12, GREY),
    ...[0.62, -0.62].map((x) => block(0.08, 0.025, 0.12, RED, { at: [x, 0, 0] })),
  );
}

function create(): Model {
  const body = node('body', { at: [0, HOVER, 0] },
    block(0.42, 0.34, 0.42, GREY),
    block(0.44, 0.16, 0.44, FOIL, { at: [0, -0.06, 0] }),
    block(0.3, 0.04, 0.3, DARK, { at: [0, 0.19, 0] }),
    block(0.18, 0.18, 0.04, DARK, { at: [0, 0.02, 0.215] }),
    node('eye', { at: [0, 0.02, 0.24] }, ...light(0.11, 0.11, 0.03, RED, {}, 1.9)),
    block(0.26, 0.04, 0.05, GREY, { at: [0, 0.14, 0.22], rot: [0, 0, 0] }),
    node('gun', { at: [0, -0.22, 0.12] },
      block(0.1, 0.08, 0.14, DARK),
      block(0.05, 0.05, 0.3, DARK, { at: [0, 0, 0.18] }),
      node('flash', { at: [0, 0, 0.36], scale: 0.05 }, ...light(0.12, 0.12, 0.16, RED, {}, 1.8))),
    // Four splayed legs with spiked feet.
    ...[[1, 1], [1, -1], [-1, 1], [-1, -1]].flatMap(([sx, sz]) => [
      block(0.035, 0.55, 0.035, GREY, { at: [0.25 * sx, -0.38, 0.25 * sz], rot: [20 * sz, 0, -20 * sx] }),
      block(0.05, 0.08, 0.05, RED, { at: [0.34 * sx, -0.64, 0.34 * sz], rot: [20 * sz, 0, -20 * sx] }),
    ]),
    block(0.05, 0.5, 0.05, GREY, { at: [0, 0.42, 0] }),
    rotor('rotor_low', 0.32, 0),
    rotor('rotor_high', 0.48, 90),
    block(0.36, 0.03, 0.26, PANEL, { at: [0, 0.69, 0] }),
    block(0.38, 0.02, 0.28, GREY, { at: [0, 0.675, 0] }),
  );

  const root = node('drone', {}, body);
  const { rot, mov, scl } = rig(root);
  const wave = (p: number, shift = 0) => Math.sin((p + shift) * TAU);
  const zero: Vec3 = [0, 0, 0];
  const spin = (turns: number) => [
    rot('rotor_low', loop((p) => [0, 360 * turns * p, 0])),
    rot('rotor_high', loop((p) => [0, -360 * turns * p, 0])),
  ];

  const idle = animation('Idle', 1, [
    ...spin(4),
    mov('body', loop((p) => [0, 0.05 * wave(p), 0])),
    rot('body', loop((p) => [2 * wave(p, 0.25), 0, 3 * wave(p)])),
    scl('eye', loop((p) => 1 + 0.12 * wave(p * 2))),
  ]);

  const move = animation('Move', 0.8, [
    ...spin(6),
    rot('body', loop((p) => [15, 0, 3 * wave(p)])),
    mov('body', loop((p) => [0, 0.04 * wave(p), 0])),
  ]);

  // The tell: the eye flares and the drone noses down to aim (0.25–0.55 s);
  // it fires at 0.6 s.
  const spinPoses = (degrees: number, sign: number) => poses([0, zero], [1.2, [0, sign * degrees, 0], 'linear']);
  const attack = animation('Attack', 1.2, [
    rot('rotor_low', spinPoses(1800, 1)),
    rot('rotor_high', spinPoses(1800, -1)),
    rot('body', poses([0, zero], [0.25, zero], [0.55, [14, 0, 0]], [0.6, [8, 0, 0], 'snap'], [1.2, zero])),
    scl('eye', poses([0, 1], [0.25, 1], [0.55, 1.9], [0.8, 1.5], [1.2, 1])),
    mov('gun', poses([0, zero], [0.58, zero], [0.6, [0, 0, -0.08], 'snap'], [0.8, zero])),
    scl('flash', poses([0, 1], [0.58, 1], [0.6, 7, 'snap'], [0.7, 4], [0.75, 1, 'snap'], [1.2, 1])),
  ]);

  const hit = animation('Hit', 0.5, [
    ...spin(2).map((track) => track),
    mov('body', poses([0, zero], [0.08, [0, 0.1, -0.15], 'snap'], [0.5, zero])),
    rot('body', poses([0, zero], [0.08, [-15, 0, 20], 'snap'], [0.5, zero])),
    scl('eye', poses([0, 1], [0.06, 0.3, 'snap'], [0.5, 1])),
  ]);

  // It sputters, spins round and drops.
  const die = animation('Die', 1.8, [
    rot('rotor_low', poses([0, zero], [1.8, [0, 900, 0], 'out'])),
    rot('rotor_high', poses([0, zero], [1.8, [0, -900, 0], 'out'])),
    mov('body', poses([0, zero], [0.3, [0, 0.12, 0]], [1.3, [0, -HOVER + 0.7, 0.2], 'in'], [1.8, [0, -HOVER + 0.7, 0.2]])),
    rot('body', poses([0, zero], [1.3, [25, 300, 35], 'in'], [1.8, [25, 300, 35]])),
    scl('eye', poses([0, 1], [0.4, 1.6], [0.5, 0.4], [1.0, 1.0], [1.8, 0.05])),
  ]);

  return model(root, [idle, move, attack, hit, die], {
    attacks: { Attack: { warn: 0.25, hit: 0.6, end: 0.7 } },
  });
}

export const drone: ModelEntry = { id: 'drone', name: 'Hornet Drone', type: 'enemy', flies: true, create };
