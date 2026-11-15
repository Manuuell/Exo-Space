// Ruin gate: the way into a dungeon. The first colonists' ruins, half sunk
// in a mossy mound: an arch of big rounded stones, a crest above it with a
// ring of runes (the star and its seven planets), a portal that turns,
// two braziers of cyan fire, vines with flowers, crystals and fallen
// blocks, and a flagstone path leading up to it. About 10 m tall. The door
// faces +Z; the origin is on the ground at the middle of the threshold.
// Soft cartoon, the game's style. Original design.

import { TAU, animation, bar, box, dome, glow, halo, lathe, loop, model, node, part, rig, seeded, soft, sphere, torus, tube } from './kit.ts';
import type { Model, ModelEntry, Vec3 } from './kit.ts';

const STONE = ['#c9c2b0', '#bdb5a2', '#d4cdbb', '#b2aa96'];
const MOSS = soft('#6fbf4e', 0.35);
const MOSS_DARK = soft('#4f9a3c', 0.3);
const EARTH = soft('#7a9a4e', 0.3);
const GOLD = soft('#f2b84b', 0.5);
const PORTAL = '#7ff7e0';
const FIRE = '#63e9ff';
const PINK = '#ff7eb6';
/** A low tuft of moss: a few sides are enough. */
const TUFT = lathe([[0, 0], [1, 0], [0.8, 0.6], [0.4, 0.95], [0, 1]], 10);

function create(): Model {
  const rand = seeded(73);
  const stone = () => soft(STONE[Math.floor(rand() * STONE.length)], 0.3);
  // A chunky rounded stone, turned by `yaw` degrees and leaning by `lean`.
  const block = (w: number, h: number, d: number, at: Vec3, yaw = 0, lean = 0) =>
    part(box(w, h, d, Math.min(w, h, d) * 0.22, 1), stone(), { at, rot: [lean, yaw, lean * 0.7] });

  // Two pillars of stacked stones, each course a little offset.
  const pillar = (s: number) => {
    const parts = [];
    for (let c = 0; c < 5; c++) {
      const w = 1.7 - (c % 2) * 0.2;
      parts.push(block(w, 1.35, 1.8, [s * (3.1 + (c % 2 ? 0.08 : -0.05)), 0.68 + c * 1.38, (rand() - 0.5) * 0.12], (rand() - 0.5) * 6, (rand() - 0.5) * 2));
    }
    // A cap of moss on top.
    parts.push(part(sphere(1, 0.6), MOSS, { at: [s * 3.1, 7.25, 0], scale: [1.0, 0.32, 1.05] }));
    return parts;
  };

  // The crest: a round stone above the lintel with the ring of runes: the
  // star in the middle and its seven planets around it.
  const crest = node('crest', { at: [0, 9.6, 0.15] },
    part(lathe([[0, -0.5], [1.75, -0.5], [1.9, -0.25], [1.9, 0.25], [1.75, 0.5], [0, 0.5]], 32), soft('#d4cdbb', 0.3), { rot: [90, 0, 0] }),
    part(torus(1.35, 0.1), GOLD, { at: [0, 0, 0.55], rot: [90, 0, 0] }),
    node('runes', { at: [0, 0, 0.6] },
      ...Array.from({ length: 7 }, (_, k) => {
        const a = (k / 7) * TAU;
        return part(sphere(0.16, 0.5), glow(FIRE), { at: [Math.sin(a) * 1.35, Math.cos(a) * 1.35, 0.05], outline: false });
      })),
    part(sphere(0.42, 0.8), glow('#ffb25a'), { at: [0, 0, 0.6], scale: [1, 1, 0.5], outline: false }),
    part(sphere(0.7, 0.8), halo('#ffb25a', 0.35), { at: [0, 0, 0.62], scale: [1, 1, 0.3], outline: false }));

  // The portal: a glowing door with a slow swirl turning in it.
  const portal = node('portal', { at: [0, 3.1, -0.2] },
    part(box(4.3, 5.9, 0.15, 0.06, 1), glow('#3fd8c0'), { outline: false }),
    node('swirl', { at: [0, 0, 0.12] },
      ...Array.from({ length: 3 }, (_, k) => part(torus(0.7 + k * 0.6, 0.09, 0.7), glow(k % 2 ? PORTAL : '#c8fff4'), { rot: [90, 0, 0], scale: [1, 1.3, 1], outline: false })),
      ...Array.from({ length: 6 }, (_, k) => {
        const a = (k / 6) * TAU * 1.6;
        const r = 0.3 + k * 0.28;
        return part(sphere(0.12, 0.5), glow('#ffffff'), { at: [Math.cos(a) * r, Math.sin(a) * r * 1.3, 0.08], outline: false });
      })),
    part(box(4.6, 6.1, 0.1, 0.05, 1), halo(PORTAL, 0.35), { at: [0, 0, 0.2], outline: false }));

  // A brazier of cyan fire on a short pedestal.
  const brazier = (s: number) => node(`brazier_${s > 0 ? 'l' : 'r'}`, { at: [s * 4.6, 0, 2.6] },
    block(1.1, 1.3, 1.1, [0, 0.65, 0]),
    part(lathe([[0, 0], [0.45, 0.02], [0.75, 0.3], [0.8, 0.55], [0.7, 0.6], [0.3, 0.35], [0, 0.35]], 20), GOLD, { at: [0, 1.3, 0] }),
    node(`flame_${s > 0 ? 'l' : 'r'}`, { at: [0, 1.75, 0] },
      part(sphere(0.42, 0.6), glow(FIRE), { scale: [1, 1.5, 1], outline: false }),
      part(sphere(0.22, 0.5), glow('#e8ffff'), { at: [0, -0.12, 0.05], scale: [1, 1.4, 1], outline: false }),
      part(sphere(0.75, 0.6), halo(FIRE, 0.35), { scale: [1, 1.4, 1], outline: false })));

  // Vines climbing a pillar, with leaves and flowers.
  const vine = (s: number, seed: number) => {
    const r = seeded(seed);
    const points: Vec3[] = Array.from({ length: 7 }, (_, i) => [s * (3.1 + (i % 2 ? 0.95 : 0.85) * (r() > 0.5 ? 1 : -1) * 0.55), 0.2 + i * 1.15, 0.95 + r() * 0.15]);
    const leaves = points.slice(1).flatMap((p, i) => [
      part(sphere(0.22, 0.4), i % 2 ? MOSS : MOSS_DARK, { at: [p[0] + 0.15, p[1], p[2] + 0.08], scale: [1.3, 0.5, 0.9], rot: [0, 0, 30] }),
      part(sphere(0.12, 0.4), soft(i % 3 ? PINK : '#ffb347', 0.5), { at: [p[0] - 0.12, p[1] + 0.2, p[2] + 0.12] }),
    ]);
    return [part(tube(points, 0.06, 0.4), MOSS_DARK), ...leaves];
  };

  const crystals = (at: Vec3, colour: string, seed: number) => {
    const r = seeded(seed);
    return Array.from({ length: 3 }, (_, k) => part(lathe([[0, 0], [0.18, 0.15], [0.12, 0.7 + r() * 0.5], [0, 0.95 + r() * 0.5]], 6), soft(colour, 0.9), {
      at: [at[0] + (k - 1) * 0.28, at[1], at[2] + (r() - 0.5) * 0.3], rot: [(r() - 0.5) * 30, r() * 60, (k - 1) * 22],
    }));
  };

  const root = node('ruin_gate', {},
    // The mound the ruins sink into, behind the door.
    part(dome(7), EARTH, { at: [0, 0, -7.6], scale: [1.3, 0.95, 1.0] }),
    part(dome(3.6), MOSS, { at: [-2.5, 5.9, -8.4], scale: [1, 0.3, 0.9] }),
    part(dome(2.8), MOSS_DARK, { at: [3.6, 5.5, -6.5], scale: [1, 0.3, 0.9] }),
    // A stone floor at the threshold and the path up to it.
    block(9.4, 0.4, 3.6, [0, 0.2, 1.3]),
    ...Array.from({ length: 7 }, (_, k) => block(1.6 + rand() * 0.8, 0.22, 1.2 + rand() * 0.4, [(rand() - 0.5) * 1.6, 0.11, 4.0 + k * 1.6], (rand() - 0.5) * 30)),
    ...pillar(1), ...pillar(-1),
    // The lintel, in three stones, and the crest.
    block(3.2, 1.6, 2.0, [-2.6, 7.9, 0]), block(3.0, 1.75, 2.1, [0, 8.0, 0]), block(3.2, 1.6, 2.0, [2.6, 7.9, 0]),
    part(sphere(1, 0.6), MOSS, { at: [-1.6, 8.85, 0.1], scale: [1.6, 0.3, 1.1] }),
    part(sphere(1, 0.6), MOSS_DARK, { at: [2.4, 8.8, -0.1], scale: [1.2, 0.28, 1.0] }),
    crest,
    // Dark depth behind the portal, and the portal.
    part(box(4.6, 6.0, 1.2, 0.1, 1), soft('#203040', 0.2), { at: [0, 3.1, -0.9] }),
    portal,
    brazier(1), brazier(-1),
    ...vine(1, 11), ...vine(-1, 12),
    ...crystals([4.4, 0.35, 1.0], '#ff9fd0', 21), ...crystals([-4.9, 0.35, 0.4], '#9fe8ff', 22), ...crystals([2.2, 0.35, 8.5], '#ff9fd0', 23),
    // Fallen blocks.
    block(1.4, 1.0, 1.2, [-6.2, 0.5, 2.4], 18), block(1.0, 0.8, 1.1, [6.4, 0.4, 4.0], -25), block(1.6, 1.1, 1.3, [-5.4, 0.55, 6.5], 40),
    // Moss tufts on the ground.
    ...Array.from({ length: 8 }, (_, k) => part(TUFT, k % 2 ? MOSS : MOSS_DARK, { at: [(rand() - 0.5) * 14, 0, -1 + rand() * 9], scale: [0.6 + rand() * 0.5, 0.3, 0.5 + rand() * 0.4] })),
    bar([-3.1, 0.1, 0.95], [-3.4, 0.1, 1.6], 0.04, MOSS_DARK),
  );

  const { rot, scl } = rig(root);
  const wave = (p: number, shift = 0) => Math.sin((p + shift) * TAU);
  // The portal turns, the fire flickers, the runes breathe.
  const idle = animation('Idle', 4, [
    rot('swirl', loop((p) => [0, 0, -720 * p])),
    scl('portal', loop((p) => 1 + 0.02 * wave(p * 2))),
    scl('flame_l', loop((p) => [1 + 0.08 * wave(p * 6), 1 + 0.15 * wave(p * 8, 0.3), 1 + 0.08 * wave(p * 6)])),
    scl('flame_r', loop((p) => [1 + 0.08 * wave(p * 6, 0.5), 1 + 0.15 * wave(p * 8, 0.7), 1 + 0.08 * wave(p * 6, 0.5)])),
    scl('runes', loop((p) => 1 + 0.06 * wave(p * 2))),
  ]);

  return model(root, [idle]);
}

export const ruinGate: ModelEntry = { id: 'prop-ruin-gate', name: 'Ruin gate', type: 'prop', create };
