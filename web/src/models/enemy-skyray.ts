// Skyray: flying planet fauna, a manta with bat wings in two sections, a wide
// mouth of teeth under its front, glowing spots on its belly and a stinger on
// a long tail. It hovers about 1.9 m above its origin and dives at its prey.
// Wingspan about 3.2 m. It changes with the planet through the team's table
// (fauna.ts).

import { TAU, animation, block, light, loop, model, node, poses, rig, speckle, tint } from './kit.ts';
import type { Model, ModelEntry, Vec3 } from './kit.ts';
import type { PlanetLook } from './contract.ts';
import { angryEyes, shades, teeth } from './beasts.ts';
import { faunaLook } from './fauna.ts';

const HOVER = 1.9;

function create(planet?: PlanetLook): Model {
  const look = faunaLook(planet);
  const { skin, skinDark, growth, claw } = look.palette;
  const G = look.glow;
  const W = look.wide;
  const T = look.tall;

  const wing = (side: 'l' | 'r') => {
    const s = side === 'l' ? 1 : -1;
    return node(`wing_${side}`, { at: [0.45 * W * s, 0, 0.05] },
      block(0.8 * T, 0.06, 0.9, tint(skin, -0.04), { at: [0.4 * T * s, 0, 0] }),
      block(0.85 * T, 0.09, 0.07, skinDark, { at: [0.42 * T * s, 0.02, 0.43] }),
      block(0.06, 0.08, 0.8, skinDark, { at: [0.3 * T * s, 0.02, 0] }),
      block(0.06, 0.08, 0.75, skinDark, { at: [0.6 * T * s, 0.02, -0.03] }),
      ...[0.15, 0.4, 0.65].map((x) => block(0.05, 0.04, 0.12, claw, { at: [x * T * s, 0, -0.5] })),
      ...light(0.1, 0.03, 0.1, G, { at: [0.45 * T * s, -0.045, 0.1] }, 1.5),
      node(`wing_${side}_tip`, { at: [0.8 * T * s, 0, 0.02] },
        block(0.7 * T, 0.05, 0.6, tint(skin, -0.08), { at: [0.35 * T * s, 0, -0.05] }),
        block(0.75 * T, 0.08, 0.06, skinDark, { at: [0.37 * T * s, 0.02, 0.24] }),
        block(0.28, 0.06, 0.08, claw, { at: [0.78 * T * s, 0, 0.2], rot: [0, -20 * s, 0] }),
        ...light(0.08, 0.03, 0.08, G, { at: [0.35 * T * s, -0.04, -0.05] }, 1.5)),
    );
  };

  const body = node('body', { at: [0, HOVER, 0] },
    block(0.9 * W, 0.22, 1.1, skin),
    block(0.3, 0.14, 0.9, skinDark, { at: [0, 0.15, 0] }),
    ...[0.3, 0.05, -0.2, -0.42].map((z, i) => block(0.07, 0.18 - i * 0.03, 0.07, growth, { at: [0, 0.3 - i * 0.015, z], rot: [-30, 0, 0] })),
    ...speckle(shades(skin), { box: [0.9 * W, 0.22, 1.1], faces: 't', count: 12, size: 0.06, seed: 41 }),
    // Glowing spots under the belly.
    ...[[0.2, 0.3], [-0.2, 0.3], [0.28, -0.05], [-0.28, -0.05], [0.12, -0.35], [-0.12, -0.35]].flatMap(([x, z]) =>
      light(0.1, 0.03, 0.1, G, { at: [x * W, -0.12, z] }, 1.5)),
    // The front: head, eyes on top, a wide mouth of teeth underneath.
    block(0.6 * W, 0.26, 0.32, skin, { at: [0, 0, 0.66] }),
    angryEyes('eyes', { at: [0, 0.17, 0.83], gap: 0.26, size: [0.1, 0.05], glow: G, brow: skinDark, tilt: 28 }),
    ...teeth(-0.22 * W, 0.22 * W, 7, -0.13, 0.8, 0.035, claw),
    block(0.45 * W, 0.04, 0.25, '#5a1a1a', { at: [0, -0.12, 0.66] }),
    node('jaw', { at: [0, -0.13, 0.55] },
      block(0.5 * W, 0.06, 0.3, skinDark, { at: [0, -0.03, 0.12] }),
      ...teeth(-0.2 * W, 0.2 * W, 6, 0, 0.26, 0.03, claw, true)),
    wing('l'),
    wing('r'),
    node('tail', { at: [0, 0, -0.55], rot: [6, 0, 0] },
      block(0.14, 0.1, 0.8, skinDark, { at: [0, 0, -0.4] }),
      node('tail_tip', { at: [0, 0, -0.8] },
        block(0.09, 0.08, 0.4, skin, { at: [0, 0, -0.2] }),
        block(0.14, 0.06, 0.16, claw, { at: [0, 0, -0.42] }),
        ...light(0.05, 0.05, 0.12, G, { at: [0, 0, -0.53] }, 1.6))),
  );

  const root = node('skyray', { scale: look.size }, body);
  const { rot, mov, scl } = rig(root);
  const wave = (p: number, shift = 0) => Math.sin((p + shift) * TAU);
  const zero: Vec3 = [0, 0, 0];
  const flap = (amount: number, lag = 0) => ({
    left: loop((p) => [0, 0, amount * wave(p, lag)]),
    right: loop((p) => [0, 0, -amount * wave(p, lag)]),
  });

  const slow = flap(22);
  const slowTip = flap(16, -0.15);
  const idle = animation('Idle', 1.6, [
    rot('wing_l', slow.left),
    rot('wing_r', slow.right),
    rot('wing_l_tip', slowTip.left),
    rot('wing_r_tip', slowTip.right),
    mov('body', loop((p) => [0, 0.1 * wave(p, 0.25), 0])),
    rot('tail', loop((p) => [4 * wave(p, 0.4), 10 * wave(p), 0])),
    rot('jaw', loop((p) => [5 + 4 * wave(p * 2), 0, 0])),
    scl('eyes', loop((p) => 1 + 0.08 * wave(p))),
  ]);

  const fast = flap(34);
  const fastTip = flap(22, -0.15);
  const move = animation('Move', 0.8, [
    rot('wing_l', fast.left),
    rot('wing_r', fast.right),
    rot('wing_l_tip', fastTip.left),
    rot('wing_r_tip', fastTip.right),
    rot('body', loop(() => [10, 0, 0])),
    mov('body', loop((p) => [0, 0.08 * wave(p, 0.25), 0])),
    rot('tail', loop((p) => [6 * wave(p), 8 * wave(p, 0.2), 0])),
  ]);

  // The tell: it climbs, wings high, mouth open and stinger curled over its
  // back (0.25–0.7 s), then dives; the strike lands at 0.82 s.
  const attack = animation('Attack', 1.6, [
    mov('body', poses([0, zero], [0.25, zero], [0.7, [0, 0.55, -0.2]], [0.85, [0, -1.1, 1.1], 'snap'], [1.0, [0, -1.0, 1.15]], [1.6, zero])),
    rot('body', poses([0, zero], [0.25, zero], [0.7, [-15, 0, 0]], [0.85, [30, 0, 0], 'snap'], [1.0, [20, 0, 0]], [1.6, zero])),
    rot('wing_l', poses([0, zero], [0.7, [0, 0, 50]], [0.85, [0, -25, -15], 'snap'], [1.6, zero])),
    rot('wing_r', poses([0, zero], [0.7, [0, 0, -50]], [0.85, [0, 25, 15], 'snap'], [1.6, zero])),
    rot('tail', poses([0, zero], [0.25, zero], [0.7, [-45, 0, 0]], [0.85, [20, 0, 0], 'snap'], [1.6, zero])),
    rot('tail_tip', poses([0, zero], [0.7, [-40, 0, 0]], [0.85, [10, 0, 0], 'snap'], [1.6, zero])),
    rot('jaw', poses([0, zero], [0.25, zero], [0.7, [28, 0, 0]], [0.85, [30, 0, 0]], [1.6, zero])),
    scl('eyes', poses([0, 1], [0.7, 1.4], [1.6, 1])),
  ]);

  const hit = animation('Hit', 0.5, [
    mov('body', poses([0, zero], [0.08, [0, 0.15, -0.12], 'snap'], [0.5, zero])),
    rot('body', poses([0, zero], [0.08, [-10, 0, 15], 'snap'], [0.5, zero])),
    rot('wing_l', poses([0, zero], [0.1, [0, 0, 40], 'snap'], [0.5, zero])),
    rot('wing_r', poses([0, zero], [0.1, [0, 0, -10], 'snap'], [0.5, zero])),
  ]);

  // It loses the air, spins down and lies on the ground with folded wings.
  const die = animation('Die', 1.8, [
    mov('body', poses([0, zero], [0.2, [0, 0.15, 0]], [1.3, [0, -HOVER + 0.15, 0.2], 'in'], [1.8, [0, -HOVER + 0.15, 0.2]])),
    rot('body', poses([0, zero], [1.3, [20, 90, 60], 'in'], [1.45, [15, 90, 55], 'out'], [1.8, [15, 90, 58]])),
    rot('wing_l', poses([0, zero], [1.3, [0, 0, -35]], [1.8, [0, 0, -30]])),
    rot('wing_r', poses([0, zero], [1.3, [0, 0, 35]], [1.8, [0, 0, 30]])),
    rot('tail', poses([0, zero], [1.8, [10, 25, 0]])),
    scl('eyes', poses([0, 1], [1.2, 1], [1.8, 0.1])),
  ]);

  return model(root, [idle, move, attack, hit, die], {
    attacks: { Attack: { warn: 0.25, hit: 0.82, end: 1.0 } },
  });
}

export const skyray: ModelEntry = { id: 'skyray', name: 'Skyray', type: 'enemy', planetary: true, flies: true, create };
