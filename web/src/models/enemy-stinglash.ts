// Stinglash: planet fauna, a scorpion-like hunter: six legs, two big pincers,
// a cluster of glowing eyes and a segmented tail that arches over its back
// to a glowing stinger. About 1.3 m tall with the tail up and 2 m long. It
// changes with the planet through the team's table (fauna.ts).

import { TAU, animation, block, light, loop, model, node, poses, rig, speckle } from './kit.ts';
import type { Model, ModelEntry, Vec3 } from './kit.ts';
import type { PlanetLook } from './contract.ts';
import { angryEyes, shades } from './beasts.ts';
import { faunaLook } from './fauna.ts';

function create(planet?: PlanetLook): Model {
  const look = faunaLook(planet);
  const { skin, skinDark, spine, claw } = look.palette;
  const G = look.glow;
  const W = look.wide;
  const bodyY = 0.42 * look.tall;
  const deg = 180 / Math.PI;

  // A leg: an upper segment out and up, a lower one down to the ground.
  const leg = (name: string, s: number, z: number, yaw: number) => {
    const base = bodyY - 0.04;
    const kx = 0.38;
    const ky = 0.16;
    const fx = 0.52;
    const fy = -base + 0.03;
    const lower = Math.hypot(fx - kx, fy - ky);
    return node(name, { at: [0.3 * W * s, -0.04, z], rot: [0, yaw * s, 0] },
      block(0.42, 0.06, 0.06, skinDark, { at: [0.19 * s, 0.08, 0], rot: [0, 0, 23 * s] }),
      block(lower, 0.05, 0.05, skin, { at: [((kx + fx) / 2) * s, (ky + fy) / 2, 0], rot: [0, 0, Math.atan2(fy - ky, fx - kx) * deg * s] }),
      block(0.04, 0.06, 0.04, claw, { at: [fx * s, fy, 0] }),
    );
  };

  const claw_ = (side: 'l' | 'r') => {
    const s = side === 'l' ? 1 : -1;
    return node(`claw_${side}`, { at: [0.33 * W * s, -0.02, 0.45], rot: [0, -20 * s, 0] },
      block(0.12, 0.12, 0.4, skinDark, { at: [0, 0, 0.2] }),
      node(`pincer_${side}`, { at: [0, 0, 0.42], rot: [0, 30 * s, 0] },
        block(0.22, 0.16, 0.26, skin, { at: [0, 0, 0.12] }),
        block(0.08, 0.09, 0.3, skinDark, { at: [0.06 * s, 0.02, 0.38] }),
        block(0.06, 0.06, 0.08, claw, { at: [0.06 * s, 0.02, 0.56] }),
        node(`pincer_${side}_jaw`, { at: [-0.06 * s, 0, 0.25] },
          block(0.07, 0.08, 0.28, skinDark, { at: [0, 0, 0.14] }),
          block(0.05, 0.05, 0.07, claw, { at: [0, 0, 0.31] }))),
    );
  };

  const tail = node('tail', { at: [0, 0.08, -0.85], rot: [40, 0, 0] },
    block(0.18, 0.18, 0.3, skin, { at: [0, 0, -0.15] }),
    block(0.05, 0.08, 0.05, spine, { at: [0, 0.12, -0.15] }),
    node('tail_2', { at: [0, 0, -0.3], rot: [40, 0, 0] },
      block(0.16, 0.16, 0.28, skinDark, { at: [0, 0, -0.14] }),
      block(0.05, 0.08, 0.05, spine, { at: [0, 0.11, -0.14] }),
      node('tail_3', { at: [0, 0, -0.28], rot: [40, 0, 0] },
        block(0.14, 0.14, 0.26, skin, { at: [0, 0, -0.13] }),
        node('tail_4', { at: [0, 0, -0.26], rot: [35, 0, 0] },
          block(0.12, 0.12, 0.24, skinDark, { at: [0, 0, -0.12] }),
          node('stinger', { at: [0, 0, -0.24], rot: [20, 0, 0] },
            block(0.2, 0.2, 0.22, skinDark, { at: [0, 0, -0.11] }),
            ...light(0.1, 0.05, 0.12, G, { at: [0, 0.1, -0.11] }, 1.6),
            ...light(0.05, 0.05, 0.22, G, { at: [0, -0.05, -0.3], rot: [30, 0, 0] }, 1.6))))),
  );

  const body = node('body', { at: [0, bodyY, 0] },
    block(0.62 * W, 0.28, 0.6, skin, { at: [0, 0, 0.25] }),
    block(0.5 * W, 0.08, 0.5, skinDark, { at: [0, 0.17, 0.25] }),
    block(0.58 * W, 0.26, 0.3, skin, { at: [0, 0, -0.18] }),
    block(0.52 * W, 0.24, 0.28, skinDark, { at: [0, 0.01, -0.46] }),
    block(0.44 * W, 0.22, 0.26, skin, { at: [0, 0.02, -0.72] }),
    ...[-0.18, -0.46, -0.72].map((z) => block(0.06, 0.1, 0.06, spine, { at: [0, 0.17, z], rot: [-30, 0, 0] })),
    ...speckle(shades(skin), { box: [0.62 * W, 0.28, 0.6], at: [0, 0, 0.25], faces: 'lrt', count: 8, size: 0.05, seed: 61 }),
    angryEyes('eyes', { at: [0, 0.12, 0.556], gap: 0.16, size: [0.07, 0.04], glow: G, brow: skinDark, tilt: 25 }),
    ...light(0.04, 0.03, 0.02, G, { at: [0.17, 0.08, 0.553] }, 1.5),
    ...light(0.04, 0.03, 0.02, G, { at: [-0.17, 0.08, 0.553] }, 1.5),
    block(0.05, 0.06, 0.12, claw, { at: [0.07, -0.08, 0.6], rot: [0, -15, 0] }),
    block(0.05, 0.06, 0.12, claw, { at: [-0.07, -0.08, 0.6], rot: [0, 15, 0] }),
    claw_('l'),
    claw_('r'),
    ...[1, -1].flatMap((s) => {
      const side = s > 0 ? 'l' : 'r';
      return [leg(`leg_${side}1`, s, 0.32, -25), leg(`leg_${side}2`, s, 0.12, 0), leg(`leg_${side}3`, s, -0.1, 25)];
    }),
    tail,
  );

  const root = node('stinglash', { scale: look.size }, body);
  const { rot, mov, scl } = rig(root);
  const wave = (p: number, shift = 0) => Math.sin((p + shift) * TAU);
  const zero: Vec3 = [0, 0, 0];

  const idle = animation('Idle', 2, [
    rot('pincer_l_jaw', loop((p) => [0, -14 * Math.abs(wave(p)), 0])),
    rot('pincer_r_jaw', loop((p) => [0, 14 * Math.abs(wave(p, 0.25)), 0])),
    rot('claw_l', loop((p) => [3 * wave(p), 5 * wave(p, 0.3), 0])),
    rot('claw_r', loop((p) => [3 * wave(p, 0.5), -5 * wave(p, 0.3), 0])),
    rot('tail', loop((p) => [3 * wave(p), 8 * wave(p, 0.2), 0])),
    rot('stinger', loop((p) => [6 * wave(p * 2), 0, 0])),
    scl('eyes', loop((p) => 1 + 0.08 * wave(p * 2))),
  ]);

  // Scuttling: alternate legs swing back and forth.
  const legSwing = (name: string, sign: number) => rot(name, loop((p) => [0, 16 * sign * wave(p), 0]));
  const move = animation('Move', 0.6, [
    legSwing('leg_l1', 1), legSwing('leg_l2', -1), legSwing('leg_l3', 1),
    legSwing('leg_r1', -1), legSwing('leg_r2', 1), legSwing('leg_r3', -1),
    mov('body', loop((p) => [0, 0.015 * wave(p * 2), 0])),
    rot('tail', loop((p) => [0, 6 * wave(p), 0])),
    rot('claw_l', loop((p) => [0, 6 * wave(p), 0])),
    rot('claw_r', loop((p) => [0, -6 * wave(p), 0])),
  ]);

  // The tell: pincers up, tail coils tighter and the stinger glows brighter
  // (0.3–0.65 s); the tail whips forward and strikes at 0.75 s.
  const attack = animation('Attack', 1.4, [
    rot('body', poses([0, zero], [0.3, zero], [0.65, [-6, 0, 0]], [0.75, [6, 0, 0], 'snap'], [1.4, zero])),
    rot('tail', poses([0, zero], [0.3, zero], [0.65, [12, 0, 0]], [0.75, [-35, 0, 0], 'snap'], [0.95, [-30, 0, 0]], [1.4, zero])),
    rot('tail_2', poses([0, zero], [0.65, [12, 0, 0]], [0.75, [-20, 0, 0], 'snap'], [0.95, [-18, 0, 0]], [1.4, zero])),
    rot('tail_3', poses([0, zero], [0.65, [12, 0, 0]], [0.75, [-12, 0, 0], 'snap'], [1.4, zero])),
    rot('stinger', poses([0, zero], [0.65, [15, 0, 0]], [0.75, [-10, 0, 0], 'snap'], [1.4, zero])),
    scl('stinger', poses([0, 1], [0.3, 1], [0.65, 1.4], [0.95, 1.2], [1.4, 1])),
    rot('claw_l', poses([0, zero], [0.65, [-25, 15, 0]], [0.75, [-10, 0, 0]], [1.4, zero])),
    rot('claw_r', poses([0, zero], [0.65, [-25, -15, 0]], [0.75, [-10, 0, 0]], [1.4, zero])),
    rot('pincer_l_jaw', poses([0, zero], [0.65, [0, -25, 0]], [0.75, zero, 'snap'], [1.4, zero])),
    rot('pincer_r_jaw', poses([0, zero], [0.65, [0, 25, 0]], [0.75, zero, 'snap'], [1.4, zero])),
    scl('eyes', poses([0, 1], [0.65, 1.4], [1.4, 1])),
  ]);

  const hit = animation('Hit', 0.5, [
    mov('body', poses([0, zero], [0.08, [0, 0.03, -0.12], 'snap'], [0.5, zero])),
    rot('body', poses([0, zero], [0.08, [-8, 6, 0], 'snap'], [0.5, zero])),
    rot('tail', poses([0, zero], [0.1, [-15, 10, 0], 'snap'], [0.5, zero])),
  ]);

  // Legs fold in, the body drops and the tail falls flat.
  const fold = (name: string, s: number) => rot(name, poses([0, zero], [0.8, [0, 0, 35 * s]], [1.6, [0, 0, 40 * s]]));
  const die = animation('Die', 1.6, [
    mov('body', poses([0, zero], [0.2, [0, 0.05, 0]], [0.8, [0, -bodyY + 0.14, 0], 'in'], [1.6, [0, -bodyY + 0.14, 0]])),
    rot('body', poses([0, zero], [0.8, [4, 0, 8]], [1.6, [4, 0, 10]])),
    fold('leg_l1', 1), fold('leg_l2', 1), fold('leg_l3', 1),
    fold('leg_r1', -1), fold('leg_r2', -1), fold('leg_r3', -1),
    rot('tail', poses([0, zero], [0.9, [-40, 10, 0], 'in'], [1.6, [-42, 10, 0]])),
    rot('tail_2', poses([0, zero], [0.9, [-35, 0, 0]], [1.6, [-35, 0, 0]])),
    rot('tail_3', poses([0, zero], [0.9, [-30, 0, 0]], [1.6, [-30, 0, 0]])),
    scl('eyes', poses([0, 1], [0.8, 1], [1.6, 0.1])),
    scl('stinger', poses([0, 1], [1.6, 0.7])),
  ]);

  return model(root, [idle, move, attack, hit, die], {
    attacks: { Attack: { warn: 0.3, hit: 0.75, end: 0.95 } },
  });
}

export const stinglash: ModelEntry = { id: 'stinglash', name: 'Stinglash', type: 'enemy', planetary: true, create };
