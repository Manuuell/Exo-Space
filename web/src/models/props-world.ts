// Props of the open world, in the game's soft cartoon style: a beacon on
// high ground, a treasure chest, a house of the NPCs' village, a campfire for
// the enemy camps, and the glider the protagonist opens in the air. Original
// designs. Each stands on the ground at its origin and faces +Z.

import { TAU, animation, bar, box, dome, glow, halo, lathe, loop, model, node, part, poses, rig, seeded, slab, soft, sphere, torus } from './kit.ts';
import type { Model, ModelEntry, Vec3 } from './kit.ts';

const STONE = soft('#cfc8b6', 0.3);
const STONE_DARK = soft('#a8a08c', 0.3);
const GOLD = soft('#f2b84b', 0.5);
const WOOD = soft('#a0673f', 0.3);
const WOOD_DARK = soft('#7a4a2c', 0.25);
const MOSS = soft('#6fbf4e', 0.35);
const CYAN = '#63e9ff';

// --- Beacon -------------------------------------------------------------------

/**
 * A beacon: a stone pillar with gold rings on a round base, a crystal
 * floating over it inside a ring of floating stones. Unlit, the crystal is
 * pale; `lit` (hidden until the player lights it) is its glow and its beam.
 * About 7 m tall.
 */
function createBeacon(): Model {
  const root = node('beacon', {},
    part(lathe([[0, 0], [2.0, 0], [2.0, 0.35], [1.6, 0.55], [0, 0.55]], 24), STONE),
    part(lathe([[0, 0.55], [1.1, 0.55], [1.1, 0.9], [0, 0.9]], 20), STONE_DARK),
    part(lathe([[0.55, 0.9], [0.42, 2.0], [0.36, 4.3], [0.5, 4.6], [0, 4.6]], 16), STONE),
    ...[1.6, 3.0, 4.35].map((y) => part(torus(0.5, 0.08), GOLD, { at: [0, y, 0] })),
    ...Array.from({ length: 4 }, (_, k) => part(sphere(0.35, 0.6), MOSS, { at: [Math.sin(k * 1.6) * 1.5, 0.55, Math.cos(k * 1.6) * 1.5], scale: [1.3, 0.4, 1] })),
    node('ring', { at: [0, 5.8, 0] },
      ...Array.from({ length: 5 }, (_, k) => part(box(0.32, 0.32, 0.32, 0.08), STONE_DARK, { at: [Math.sin((k / 5) * TAU) * 1.1, 0, Math.cos((k / 5) * TAU) * 1.1], rot: [20, k * 30, 10] }))),
    node('crystal', { at: [0, 5.8, 0] },
      part(lathe([[0, -0.8], [0.4, 0], [0, 0.8]], 6), soft('#c8f4ff', 0.9)),
      node('lit', {},
        part(lathe([[0, -0.82], [0.42, 0], [0, 0.82]], 6), glow(CYAN), { outline: false }),
        part(sphere(1.2, 0.6), halo(CYAN, 0.35), { outline: false }),
        // A beam of light up into the sky, to see it from afar.
        part(lathe([[0.18, 0], [0.5, 60], [0, 60]], 12), halo(CYAN, 0.18), { outline: false }))),
  );
  const { rot, mov } = rig(root);
  const wave = (p: number) => Math.sin(p * TAU);
  const idle = animation('Idle', 4, [
    rot('crystal', loop((p) => [0, 720 * p, 0])),
    mov('crystal', loop((p) => [0, 0.2 * wave(p), 0])),
    rot('ring', loop((p) => [0, -360 * 2 * p, 0])),
  ]);
  root.getObjectByName('lit')!.visible = false;
  return model(root, [idle]);
}

// --- Chest --------------------------------------------------------------------

/** A treasure chest of wood with gold bands and a glowing lock. `Open` lifts the lid. */
function createChest(): Model {
  const lid = node('lid', { at: [0, 0.62, -0.38] },
    part(lathe([[0, -0.6], [0.36, -0.6], [0.38, -0.3], [0.38, 0.3], [0.36, 0.6], [0, 0.6]], 16, 0), WOOD, { at: [0, 0, 0.38], rot: [0, 0, 90], scale: [1, 1, 1.05] }),
    ...[-0.42, 0.42].map((x) => part(torus(0.39, 0.05), GOLD, { at: [x, 0, 0.38], rot: [0, 0, 90], scale: [1, 1, 1.05] })),
    node('lock', { at: [0, 0.02, 0.8] },
      part(box(0.22, 0.26, 0.08, 0.04), GOLD),
      part(sphere(0.07, 0.5), glow(CYAN), { at: [0, 0, 0.05], outline: false })),
  );
  const root = node('chest', {},
    part(box(1.3, 0.62, 0.8, 0.08), WOOD, { at: [0, 0.31, 0] }),
    part(box(1.34, 0.08, 0.84, 0.03), WOOD_DARK, { at: [0, 0.05, 0] }),
    ...[-0.42, 0.42].map((x) => part(box(0.1, 0.64, 0.84, 0.03), GOLD, { at: [x, 0.32, 0] })),
    // The treasure inside, seen when it opens.
    node('treasure', { at: [0, 0.6, 0] },
      part(sphere(0.3, 0.6), glow('#ffd23f'), { scale: [1.4, 0.4, 0.8], outline: false }),
      part(sphere(0.55, 0.5), halo('#ffd23f', 0.3), { scale: [1.4, 0.6, 1], outline: false })),
    lid,
  );
  const { rot, scl } = rig(root);
  const idle = animation('Idle', 2, [scl('lock', loop((p) => 1 + 0.08 * Math.sin(p * TAU * 2)))]);
  const open = animation('Open', 1, [
    rot('lid', poses([0, [0, 0, 0]], [0.15, [-6, 0, 0]], [0.6, [-112, 0, 0], 'back'], [1, [-105, 0, 0]])),
    scl('treasure', poses([0, 1], [0.4, 1.6], [1, 1.2])),
  ]);
  return model(root, [idle, open]);
}

// --- Hut ----------------------------------------------------------------------

/**
 * A house of the NPCs' village: round cream walls under a big mushroom-cap
 * roof with spots, a round door, warm round windows, a little chimney. About
 * 7 m tall.
 */
function createHut(): Model {
  const rand = seeded(5);
  const root = node('hut', {},
    part(lathe([[0, 0], [2.6, 0], [2.7, 0.3], [2.5, 2.6], [2.2, 3.4], [0, 3.4]], 24), soft('#fff1d6', 0.3)),
    part(lathe([[2.75, 0], [2.85, 0.15], [2.75, 0.5], [0, 0.5]], 24), STONE_DARK),
    // The roof: a wide cap with a pale rim and spots.
    part(lathe([[0, 3.0], [4.0, 3.0], [4.2, 3.35], [3.6, 4.6], [2.2, 5.8], [0, 6.3]], 28, 20), soft('#ff7a6b', 0.45)),
    part(torus(3.95, 0.16), soft('#ffe0d0', 0.4), { at: [0, 3.15, 0] }),
    ...Array.from({ length: 7 }, (_, k) => {
      const a = (k / 7) * TAU + rand();
      const r = 1.6 + rand() * 1.6;
      return part(sphere(0.28 + rand() * 0.2, 0.5), soft('#fff6ea', 0.4), { at: [Math.sin(a) * r, 6.1 - r * 0.62, Math.cos(a) * r], scale: [1, 0.35, 1] });
    }),
    // A round door and two warm windows, facing +Z.
    part(box(1.4, 1.7, 0.14, 0.3), WOOD_DARK, { at: [0, 1.35, 2.5] }),
    part(sphere(0.7, 0.6), WOOD_DARK, { at: [0, 2.2, 2.46], scale: [1, 0.55, 0.12] }),
    part(sphere(0.08, 0.4), GOLD, { at: [0.45, 1.2, 2.62] }),
    ...[-1.45, 1.45].flatMap((x) => [
      part(sphere(0.42, 0.6), glow('#ffd28a'), { at: [x, 2.0, 2.05], scale: [1, 1, 0.3], outline: false }),
      part(torus(0.42, 0.07), WOOD_DARK, { at: [x, 2.0, 2.08], rot: [90, 0, 0] }),
    ]),
    bar([1.6, 4.4, -1.4], [1.6, 6.4, -1.4], 0.32, STONE_DARK),
    part(sphere(0.4, 0.6), MOSS, { at: [-2.6, 0.3, 1.2], scale: [1, 0.6, 1] }),
    part(sphere(0.35, 0.6), soft('#ff8fc4', 0.5), { at: [-2.4, 0.6, 1.5] }),
  );
  return model(root, []);
}

// --- Campfire -----------------------------------------------------------------

/** An enemy camp's fire: a ring of stones, crossed logs, a flickering flame. */
function createCampfire(): Model {
  const root = node('campfire', {},
    ...Array.from({ length: 8 }, (_, k) => part(sphere(0.28, 0.5), k % 2 ? STONE : STONE_DARK, { at: [Math.sin((k / 8) * TAU) * 0.95, 0.16, Math.cos((k / 8) * TAU) * 0.95], scale: [1.2, 0.6, 1] })),
    ...[0, 60, 120].map((yaw) => part(lathe([[0.12, -0.7], [0.12, 0.7]], 8), WOOD_DARK, { at: [0, 0.18, 0], rot: [90, yaw, 0] })),
    node('flame', { at: [0, 0.3, 0] },
      part(lathe([[0, 0], [0.5, 0.1], [0.3, 0.7], [0, 1.3]], 10), glow('#ff9a3d'), { outline: false }),
      part(lathe([[0, 0], [0.3, 0.1], [0.15, 0.5], [0, 0.9]], 8), glow('#ffe08a'), { at: [0, 0.02, 0], outline: false }),
      part(sphere(0.75, 0.5), halo('#ff9a3d', 0.3), { at: [0, 0.55, 0], outline: false })),
  );
  const { scl } = rig(root);
  const idle = animation('Idle', 1, [scl('flame', loop((p) => [1 + 0.08 * Math.sin(p * TAU * 3), 1 + 0.18 * Math.sin(p * TAU * 4 + 1), 1 + 0.08 * Math.sin(p * TAU * 3 + 2)]))]);
  return model(root, [idle]);
}

// --- Glider -------------------------------------------------------------------

/**
 * The protagonist's glider: two wings of cream and blue on a light frame,
 * opened on her back to glide down from high places. Its origin is where it
 * meets her back; it spreads along X and leans back along -Z.
 */
function createGlider(): Model {
  const wing = (s: number): ReturnType<typeof part>[] => {
    const outline: [number, number][] = [[0, 0.2], [1.9 * s, -0.1], [2.3 * s, -0.7], [0.4 * s, -0.6]].map(([x, z]) => [x, z] as [number, number]);
    const stripe: [number, number][] = [[0.5 * s, -0.42], [2.1 * s, -0.55], [2.2 * s, -0.68], [0.45 * s, -0.56]].map(([x, z]) => [x, z] as [number, number]);
    return [
      part(slab(outline, 0.05, 0.02), soft('#fff1d6', 0.4), { at: [0, 0.1, 0] }),
      part(slab(stripe, 0.06, 0.02), soft('#2f7bff', 0.4), { at: [0, 0.1, 0] }),
    ];
  };
  const root = node('glider', { at: [0, 0, 0] },
    ...wing(1), ...wing(-1),
    bar([-2.2, 0.12, -0.55] as Vec3, [2.2, 0.12, -0.55] as Vec3, 0.035, soft('#ff8b2c', 0.4)),
    bar([0, 0.12, 0.2] as Vec3, [0, 0.12, -0.7] as Vec3, 0.04, soft('#ff8b2c', 0.4)),
    part(dome(0.15), GOLD, { at: [0, 0.12, 0] }),
  );
  return model(root, []);
}

export const beacon: ModelEntry = { id: 'prop-beacon', name: 'Beacon', type: 'prop', create: createBeacon };
export const chest: ModelEntry = { id: 'prop-chest', name: 'Treasure chest', type: 'prop', create: createChest };
export const hut: ModelEntry = { id: 'prop-hut', name: 'Village hut', type: 'prop', create: createHut };
export const campfire: ModelEntry = { id: 'prop-campfire', name: 'Campfire', type: 'prop', create: createCampfire };
export const glider: ModelEntry = { id: 'prop-glider', name: 'Glider', type: 'prop', flies: true, create: createGlider };
export const worldProps: readonly ModelEntry[] = [beacon, chest, hut, campfire, glider];
