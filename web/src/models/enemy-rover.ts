// Warden Rover: an abandoned machine of the planner AI, guarding its depots.
// Adapted from NASA's Mars 2020 Perseverance rover (NASA 3D Resources,
// reference-models/nasa/): six wheels on rocker-bogie legs, a mast with a
// camera head, a robotic arm at the front and the power unit at the back.
// Rebuilt in voxel and turned hostile: a single red eye under an angry brow
// plate, a drill on the arm, spikes on the bumper, rust and warning stripes.
// No insignia. About 2 m tall to the top of the mast.

import { TAU, animation, block, light, loop, model, node, poses, rig, speckle } from './kit.ts';
import type { Model, ModelEntry, Vec3 } from './kit.ts';

const WHITE = '#e4e0d6';
const GREY = '#8c919b';
const DARK = '#33363e';
const RUST = '#9a5a32';
const RED = '#ff3b2f';
const YELLOW = '#f2c230';

function wheel(name: string, x: number, z: number): ReturnType<typeof node> {
  return node(name, { at: [x, -0.54, z] },
    block(0.18, 0.48, 0.34, DARK),
    block(0.18, 0.34, 0.48, DARK),
    block(0.2, 0.335, 0.335, '#2a2c33', { rot: [45, 0, 0] }),
    block(0.22, 0.14, 0.14, GREY),
    ...[0, 90].map((a) => block(0.205, 0.04, 0.44, GREY, { rot: [a, 0, 0] })),
  );
}

function create(): Model {
  const head = node('head', { at: [0, 0.95, 0] },
    block(0.45, 0.2, 0.22, WHITE),
    block(0.5, 0.05, 0.12, GREY, { at: [0, 0.12, 0.06], rot: [0, 0, -8] }),
    block(0.08, 0.08, 0.04, DARK, { at: [-0.14, 0, 0.115] }),
    node('eye', { at: [0.06, 0, 0.115] }, ...light(0.13, 0.05, 0.03, RED, {}, 1.9)),
    block(0.02, 0.2, 0.02, DARK, { at: [0.2, 0.18, -0.05] }),
    ...light(0.03, 0.03, 0.03, RED, { at: [0.2, 0.29, -0.05] }, 1.5),
  );

  const drillBit = node('bit', { at: [0, 0, 0.16] },
    block(0.12, 0.12, 0.1, GREY, { at: [0, 0, 0.05] }),
    block(0.09, 0.09, 0.1, GREY, { at: [0, 0, 0.15], rot: [0, 0, 45] }),
    block(0.06, 0.06, 0.1, GREY, { at: [0, 0, 0.25] }),
    ...light(0.03, 0.03, 0.08, RED, { at: [0, 0, 0.33] }, 1.5),
  );

  const body = node('body', { at: [0, 0.78, 0] },
    block(1.0, 0.3, 1.4, WHITE),
    block(0.9, 0.06, 1.3, GREY, { at: [0, 0.18, 0] }),
    block(0.3, 0.16, 0.3, DARK, { at: [-0.25, 0.27, -0.2] }),
    block(0.25, 0.1, 0.4, GREY, { at: [0.25, 0.24, -0.25] }),
    ...speckle([RUST, '#b06a3c', '#c9c3b6'], { box: [1.0, 0.3, 1.4], faces: 'lrbt', count: 22, size: 0.06, seed: 81 }),
    // Warning stripes and spikes on the front bumper.
    ...[-0.4, -0.24, -0.08, 0.08, 0.24, 0.4].map((x, i) => block(0.15, 0.08, 0.03, i % 2 ? DARK : YELLOW, { at: [x, -0.08, 0.715] })),
    ...[-0.36, -0.12, 0.12, 0.36].map((x) => block(0.06, 0.06, 0.18, DARK, { at: [x, -0.08, 0.8] })),
    // The power unit at the back, tilted, with fins.
    block(0.24, 0.24, 0.52, DARK, { at: [0, 0.16, -0.78], rot: [-30, 0, 0] }),
    ...[0, 45, 90, 135].map((a) => block(0.34, 0.03, 0.4, GREY, { at: [0, 0.16, -0.78], rot: [-30, 0, a] })),
    ...light(0.06, 0.06, 0.03, RED, { at: [0, 0.32, -0.98] }, 1.6),
    // Rocker-bogie legs.
    block(0.06, 0.06, 1.2, WHITE, { at: [0.55, -0.3, 0] }),
    block(0.06, 0.06, 1.2, WHITE, { at: [-0.55, -0.3, 0] }),
    ...[0.55, 0, -0.55].flatMap((z) => [
      block(0.06, 0.26, 0.06, WHITE, { at: [0.55, -0.42, z] }),
      block(0.06, 0.26, 0.06, WHITE, { at: [-0.55, -0.42, z] }),
    ]),
    wheel('wheel_l1', 0.62, 0.55), wheel('wheel_l2', 0.62, 0), wheel('wheel_l3', 0.62, -0.55),
    wheel('wheel_r1', -0.62, 0.55), wheel('wheel_r2', -0.62, 0), wheel('wheel_r3', -0.62, -0.55),
    node('mast', { at: [0.32, 0.18, 0.5] },
      block(0.07, 0.9, 0.07, WHITE, { at: [0, 0.45, 0] }),
      head),
    node('arm', { at: [-0.28, 0, 0.72] },
      block(0.14, 0.14, 0.14, GREY),
      block(0.08, 0.08, 0.45, WHITE, { at: [0, 0, 0.22] }),
      node('drill', { at: [0, 0, 0.45] },
        block(0.18, 0.18, 0.16, DARK, { at: [0, 0, 0.08] }),
        drillBit)),
  );

  const root = node('rover', {}, body);
  const { rot, mov, scl } = rig(root);
  const wave = (p: number, shift = 0) => Math.sin((p + shift) * TAU);
  const zero: Vec3 = [0, 0, 0];
  const wheels = ['wheel_l1', 'wheel_l2', 'wheel_l3', 'wheel_r1', 'wheel_r2', 'wheel_r3'];

  const idle = animation('Idle', 2.4, [
    rot('head', loop((p) => [4 * wave(p * 2, 0.2), 35 * wave(p), 0])),
    scl('eye', loop((p) => 1 + 0.15 * wave(p * 4))),
    rot('arm', loop((p) => [3 * wave(p), 4 * wave(p, 0.3), 0])),
    mov('body', loop((p) => [0, 0.005 * wave(p * 2), 0])),
  ]);

  // Rolling forward: two full turns of the wheels per loop.
  const move = animation('Move', 1.2, [
    ...wheels.map((name) => rot(name, loop((p) => [720 * p, 0, 0]))),
    mov('body', loop((p) => [0, 0.012 * wave(p * 4), 0])),
    rot('body', loop((p) => [1.5 * wave(p * 2), 0, 1 * wave(p * 2, 0.25)])),
    rot('head', loop((p) => [6, 8 * wave(p), 0])),
  ]);

  // The tell: the eye flares and locks on, the arm pulls back and the drill
  // spins up (0.3–0.65 s); the arm thrusts at 0.7 s.
  const attack = animation('Attack', 1.4, [
    rot('head', poses([0, zero], [0.3, [10, 0, 0]], [1.0, [10, 0, 0]], [1.4, zero])),
    scl('eye', poses([0, 1], [0.3, 1], [0.65, 1.9], [1.0, 1.6], [1.4, 1])),
    mov('arm', poses([0, zero], [0.3, zero], [0.65, [0, 0.05, -0.15]], [0.7, [0, 0, 0.45], 'snap'], [1.0, [0, 0, 0.4]], [1.4, zero])),
    rot('arm', poses([0, zero], [0.65, [-10, 0, 0]], [0.7, [5, 0, 0], 'snap'], [1.4, zero])),
    rot('bit', poses([0, zero], [0.3, zero], [0.7, [0, 0, 720], 'in'], [1.0, [0, 0, 1440], 'linear'], [1.4, [0, 0, 1800], 'out'])),
    rot('body', poses([0, zero], [0.65, [-3, 0, 0]], [0.7, [3, 0, 0], 'snap'], [1.4, zero])),
  ]);

  const hit = animation('Hit', 0.5, [
    rot('body', poses([0, zero], [0.08, [-6, 0, 5], 'snap'], [0.5, zero])),
    scl('eye', poses([0, 1], [0.06, 0.3, 'snap'], [0.14, 1.4], [0.5, 1])),
    rot('head', poses([0, zero], [0.08, [-12, 20, 0], 'snap'], [0.5, zero])),
  ]);

  // It lurches onto one side, the mast slumps and the eye goes out.
  const die = animation('Die', 2, [
    rot('body', poses([0, zero], [0.3, [-6, 0, -4]], [1.2, [8, 0, 24], 'in'], [1.35, [6, 0, 21], 'out'], [2, [7, 0, 22]])),
    mov('body', poses([0, zero], [1.2, [0, -0.08, 0]], [2, [0, -0.1, 0]])),
    rot('mast', poses([0, zero], [1.3, [40, 0, -10]], [2, [55, 0, -10]])),
    rot('arm', poses([0, zero], [1.3, [25, -20, 0]], [2, [30, -20, 0]])),
    scl('eye', poses([0, 1], [0.4, 1.6], [0.5, 0.4], [0.7, 1.2], [1.4, 0.8], [2, 0.05])),
  ]);

  return model(root, [idle, move, attack, hit, die], {
    attacks: { Attack: { warn: 0.3, hit: 0.7, end: 1.0 } },
  });
}

export const rover: ModelEntry = { id: 'rover', name: 'Warden Rover', type: 'enemy', create };
