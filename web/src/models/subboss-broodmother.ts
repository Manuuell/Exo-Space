// Broodmother: a sub-boss of the ruins of TRAPPIST-1 e, guarding a room
// halfway in. A giant spider about 3.2 m tall: eight arched legs spanning
// some 5 m, a swollen abdomen ridged with spikes and moss, six glowing eyes
// and two great fangs. Its weak point is the glowing venom sac on the front
// of its abdomen, above its head. Its own colours, so it does not repeat the
// green of the other e creatures: a near-black violet hide with patches of
// e's moss on its back, the star's orange in its eyes and a venom that glows
// a sickly green. Detailed voxel.

import { TAU, animation, block, light, loop, model, node, poses, rig, speckle } from './kit.ts';
import type { Model, ModelEntry, Vec3 } from './kit.ts';
import { TRAPPIST_1 } from './contract.ts';
import { shades } from './beasts.ts';
import { faunaLook } from './fauna.ts';

const BODY_Y = 1.9;
const VENOM = '#9dff6a';
const DEG = 180 / Math.PI;

function create(): Model {
  const look = faunaLook(TRAPPIST_1.e);
  const { growth } = look.palette;
  const G = look.glow;
  const skin = '#3a2d52';
  const skinDark = '#241c35';
  const spine = '#5a4580';
  const claw = '#e9d8ff';

  // A leg: up and out to a high knee, then a long segment down to the ground.
  const leg = (name: string, s: number, z: number, yaw: number) => {
    const kx = 1.0;
    const ky = 1.1;
    const fx = 1.7;
    const fy = -BODY_Y + 0.05;
    const upper = Math.hypot(kx, ky);
    const lower = Math.hypot(fx - kx, fy - ky);
    return node(name, { at: [0.45 * s, 0, z], rot: [0, yaw * s, 0] },
      block(upper, 0.18, 0.18, skinDark, { at: [(kx / 2) * s, ky / 2, 0], rot: [0, 0, Math.atan2(ky, kx) * DEG * s] }),
      block(0.26, 0.26, 0.26, spine, { at: [kx * s, ky, 0] }),
      block(0.07, 0.24, 0.07, claw, { at: [kx * s, ky + 0.2, 0] }),
      block(lower, 0.13, 0.13, skin, { at: [((kx + fx) / 2) * s, (ky + fy) / 2, 0], rot: [0, 0, Math.atan2(fy - ky, fx - kx) * DEG * s] }),
      block(0.09, 0.14, 0.09, claw, { at: [fx * s, fy + 0.02, 0] }),
    );
  };

  const fangs = node('fangs', { at: [0, -0.18, 1.0] },
    ...[1, -1].flatMap((s) => [
      block(0.16, 0.22, 0.16, skinDark, { at: [0.15 * s, -0.05, 0.02] }),
      block(0.11, 0.36, 0.11, claw, { at: [0.15 * s, -0.3, 0.08], rot: [18, 0, 0] }),
      block(0.07, 0.14, 0.07, claw, { at: [0.15 * s, -0.5, 0.16], rot: [35, 0, 0] }),
    ]),
  );

  const eyes = node('eyes', { at: [0, 0.12, 1.01] },
    ...[[0.12, 0.08, 0.13], [0.28, 0.0, 0.09], [0.08, 0.24, 0.07]].flatMap(([x, y, size]) => [
      ...light(size, size, 0.03, G, { at: [x, y, 0] }, 1.6),
      ...light(size, size, 0.03, G, { at: [-x, y, 0] }, 1.6),
    ]),
  );

  const abdomen = node('abdomen', { at: [0, 0.35, -0.75] },
    block(1.5, 1.2, 1.6, skinDark),
    ...[-0.4, 0, 0.4].map((z) => block(1.3, 0.06, 0.12, spine, { at: [0, 0.6, z] })),
    ...speckle(shades(growth), { box: [1.5, 1.2, 1.6], faces: 't', count: 20, size: 0.12, seed: 3 }),
    ...speckle(shades(skinDark), { box: [1.5, 1.2, 1.6], faces: 'lrb', count: 16, size: 0.1, seed: 5 }),
    ...[[-0.4, -0.3], [0, -0.5], [0.4, -0.3], [-0.25, 0.25], [0.25, 0.25]].flatMap(([x, z], i) => [
      block(0.16, 0.3 + (i % 2) * 0.1, 0.16, spine, { at: [x, 0.75 + (i % 2) * 0.05, z], rot: [-15, 0, x * 30] }),
    ]),
    // The venom sac: the weak point, on the front of the abdomen.
    node('weak_point', { at: [0, 0.33, 0.81] },
      ...light(0.55, 0.38, 0.06, VENOM, {}, 1.7),
      ...[[-0.18, 0.12], [0.16, 0.1], [0.02, -0.12]].flatMap(([x, y]) => light(0.12, 0.12, 0.08, VENOM, { at: [x, y, 0.05] }, 1)),
      block(0.65, 0.06, 0.08, spine, { at: [0, 0.22, -0.01] }),
      block(0.65, 0.06, 0.08, spine, { at: [0, -0.22, -0.01] })),
  );

  const body = node('body', { at: [0, BODY_Y, 0] },
    block(1.0, 0.7, 1.0, skin, { at: [0, 0, 0.5] }),
    block(0.8, 0.15, 0.8, skinDark, { at: [0, 0.4, 0.5] }),
    ...speckle(shades(skin), { box: [1.0, 0.7, 1.0], at: [0, 0, 0.5], faces: 'lr', count: 8, size: 0.08, seed: 7 }),
    eyes,
    fangs,
    abdomen,
    ...[[1, 'l'], [-1, 'r']].flatMap(([s, side]) => [
      leg(`leg_${side}1`, s as number, 0.85, -35),
      leg(`leg_${side}2`, s as number, 0.6, -12),
      leg(`leg_${side}3`, s as number, 0.35, 12),
      leg(`leg_${side}4`, s as number, 0.12, 35),
    ]),
  );

  const root = node('broodmother', {}, body);
  const { rot, mov, scl } = rig(root);
  const wave = (p: number, shift = 0) => Math.sin((p + shift) * TAU);
  const zero: Vec3 = [0, 0, 0];
  const legs = ['l1', 'l2', 'l3', 'l4', 'r1', 'r2', 'r3', 'r4'];

  const idle = animation('Idle', 3, [
    mov('body', loop((p) => [0, 0.04 * wave(p), 0])),
    ...legs.map((l, i) => rot(`leg_${l}`, loop((p) => [0, 3 * wave(p, i * 0.13), 2 * wave(p, i * 0.11)]))),
    rot('fangs', loop((p) => [6 * wave(p * 2), 0, 0])),
    rot('abdomen', loop((p) => [3 * wave(p, 0.2), 0, 0])),
    scl('weak_point', loop((p) => 1 + 0.12 * wave(p * 2))),
    scl('eyes', loop((p) => 1 + 0.08 * wave(p * 3))),
  ]);

  // It lies flat with its legs folded and eyes dark, the eyes light up at
  // 1.0 s, it rises on its legs and rears at 2.2 s.
  const low: Vec3 = [0, -BODY_Y + 0.6, 0];
  const wake = animation('Wake', 3.2, [
    mov('body', poses([0, low], [1.0, low], [2.0, zero, 'out'], [3.2, zero])),
    rot('body', poses([0, zero], [2.0, zero], [2.4, [-22, 0, 0]], [2.9, [-20, 0, 0]], [3.2, zero])),
    ...legs.map((l) => rot(`leg_${l}`, poses([0, [0, 0, (l[0] === 'l' ? 1 : -1) * 55]], [1.0, [0, 0, (l[0] === 'l' ? 1 : -1) * 55]], [2.0, zero, 'out'], [3.2, zero]))),
    rot('fangs', poses([0, zero], [2.2, zero], [2.4, [-30, 0, 0], 'snap'], [3.2, zero])),
    scl('eyes', poses([0, 0.05], [0.95, 0.05], [1.05, 1.5, 'snap'], [2.0, 1.1], [3.2, 1])),
    scl('weak_point', poses([0, 0.3], [1.0, 0.3], [2.0, 1.2], [3.2, 1])),
  ]);

  // Scuttling: the legs move in two alternating groups.
  const move = animation('Move', 1, [
    ...legs.map((l, i) => rot(`leg_${l}`, loop((p) => [0, 16 * (i % 2 ? 1 : -1) * wave(p), 8 * Math.max(0, wave(p, i % 2 ? 0 : 0.5))]))),
    mov('body', loop((p) => [0, 0.05 * wave(p * 2), 0])),
    rot('abdomen', loop((p) => [0, 5 * wave(p), 0])),
  ]);

  // Pounce: it rears up with its front legs raised and fangs spread (the
  // tell, from 0.4 s), then slams down and bites at 1.0 s.
  const attack = animation('Attack', 2.2, [
    rot('body', poses([0, zero], [0.4, zero], [0.9, [-30, 0, 0]], [1.0, [14, 0, 0], 'snap'], [1.2, [12, 0, 0]], [2.2, zero])),
    mov('body', poses([0, zero], [0.9, [0, 0.2, -0.3]], [1.0, [0, -0.2, 0.7], 'snap'], [1.2, [0, -0.18, 0.65]], [2.2, zero])),
    rot('leg_l1', poses([0, zero], [0.4, zero], [0.9, [0, 0, 45]], [1.0, [0, 0, -10], 'snap'], [2.2, zero])),
    rot('leg_r1', poses([0, zero], [0.4, zero], [0.9, [0, 0, -45]], [1.0, [0, 0, 10], 'snap'], [2.2, zero])),
    rot('leg_l2', poses([0, zero], [0.9, [0, 0, 25]], [1.0, zero, 'snap'], [2.2, zero])),
    rot('leg_r2', poses([0, zero], [0.9, [0, 0, -25]], [1.0, zero, 'snap'], [2.2, zero])),
    rot('fangs', poses([0, zero], [0.4, zero], [0.9, [-35, 0, 0]], [1.0, [20, 0, 0], 'snap'], [2.2, zero])),
    scl('eyes', poses([0, 1], [0.9, 1.5], [2.2, 1])),
  ]);

  // Spit: the abdomen swings forward over its back and the venom sac swells
  // (the tell, from 0.3 s); the spray bursts out at 1.0 s.
  const spit = animation('Attack_spit', 2, [
    rot('abdomen', poses([0, zero], [0.3, zero], [0.9, [-55, 0, 0]], [1.0, [-62, 0, 0], 'snap'], [1.4, [-58, 0, 0]], [2, zero])),
    rot('body', poses([0, zero], [0.9, [8, 0, 0]], [1.4, [8, 0, 0]], [2, zero])),
    scl('weak_point', poses([0, 1], [0.3, 1], [0.9, 1.6], [1.0, 1.9, 'snap'], [1.4, 1.2], [2, 1])),
  ]);

  const hit = animation('Hit', 0.6, [
    mov('body', poses([0, zero], [0.08, [0, 0.1, -0.25], 'snap'], [0.6, zero])),
    rot('body', poses([0, zero], [0.08, [-12, 8, 0], 'snap'], [0.6, zero])),
    scl('weak_point', poses([0, 1], [0.05, 0.4, 'snap'], [0.15, 1.5], [0.6, 1])),
  ]);

  // The legs curl in and it drops, belly up.
  const die = animation('Die', 3, [
    mov('body', poses([0, zero], [0.5, [0, 0.2, 0]], [1.6, [0, -BODY_Y + 0.9, 0], 'in'], [3, [0, -BODY_Y + 0.9, 0]])),
    rot('body', poses([0, zero], [0.5, [-15, 0, 0]], [1.6, [0, 0, 160], 'in'], [1.8, [0, 0, 170], 'out'], [3, [0, 0, 168]])),
    ...legs.map((l) => rot(`leg_${l}`, poses([0, zero], [1.2, [0, 0, (l[0] === 'l' ? 1 : -1) * 50]], [3, [0, 0, (l[0] === 'l' ? 1 : -1) * 60]]))),
    scl('weak_point', poses([0, 1], [0.5, 1.6], [1.0, 0.05, 'snap'], [3, 0.05])),
    scl('eyes', poses([0, 1], [1.2, 0.8], [3, 0.05])),
  ]);

  return model(root, [idle, wake, move, attack, spit, hit, die], {
    attacks: {
      Attack: { warn: 0.4, hit: 1.0, end: 1.2 },
      Attack_spit: { warn: 0.3, hit: 1.0, end: 1.4 },
    },
  });
}

export const broodmother: ModelEntry = { id: 'subboss-broodmother', name: 'Broodmother', type: 'guardian', create };
