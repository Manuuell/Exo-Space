// Drifter: an NPC species that travels between the planets, a trader. A
// floating jellyfish merchant in detailed voxel: a pink bell in four stepped
// tiers with glowing spots and a frill, a top hat, a kind face, trailing
// tentacles of blocks with glowing tips, two front tentacles for arms, a
// lantern and a satchel of goods. It hovers about 1.2 m above the ground.
// Never hostile: kind eyes, a smile, cyan and gold lights.

import { TAU, animation, block, light, loop, model, node, poses, rig, speckle, tint } from './kit.ts';
import type { Model, ModelEntry, Vec3 } from './kit.ts';
import { shades } from './beasts.ts';
import { blink, pixelFace } from './folk.ts';

const HOVER = 1.2;
const BELL = '#ff8fc8';
const BELL_DARK = '#e0609f';
const BELL_LIGHT = '#ffb3dc';
const TENT = '#ffb3d9';
const LEATHER = '#8a5a34';
const DARK = '#2a2d4a';
const GOLD = '#ffc533';
const CYAN = '#63e9ff';
const WARM = '#ffd45a';

function create(): Model {
  // A tentacle: blocks hanging down, smaller as they go, with a glowing tip.
  const tentacle = (i: number, angle: number) => {
    const a = (angle * Math.PI) / 180;
    return node(`tentacle_${i}`, { at: [Math.sin(a) * 0.27, -0.02, Math.cos(a) * 0.27] },
      ...[0, 1, 2, 3].map((j) => block(0.09 - j * 0.012, 0.16, 0.09 - j * 0.012, j % 2 ? TENT : tint(TENT, -0.06), { at: [((j % 2) - 0.5) * 0.03, -0.08 - j * 0.15, 0] })),
      ...light(0.05, 0.05, 0.05, CYAN, { at: [0, -0.65, 0] }, 1.6),
    );
  };

  const arm = (side: 'l' | 'r') => {
    const s = side === 'l' ? 1 : -1;
    const lantern = side === 'r'
      ? [node('lantern', { at: [0, -0.1, 0] },
        block(0.02, 0.08, 0.02, GOLD, { at: [0, 0.02, 0] }),
        block(0.1, 0.02, 0.1, GOLD, { at: [0, -0.03, 0] }),
        ...light(0.07, 0.09, 0.07, WARM, { at: [0, -0.09, 0] }, 1.8),
        block(0.1, 0.02, 0.1, GOLD, { at: [0, -0.15, 0] }))]
      : [];
    return node(`arm_${side}`, { at: [0.24 * s, -0.04, 0.2] },
      block(0.08, 0.16, 0.08, TENT, { at: [0.03 * s, -0.08, 0.02] }),
      block(0.07, 0.16, 0.07, tint(TENT, -0.06), { at: [0.07 * s, -0.22, 0.05] }),
      node(`hand_${side}`, { at: [0.09 * s, -0.33, 0.07] }, block(0.09, 0.08, 0.09, TENT), ...lantern),
    );
  };

  const satchel = node('satchel', { at: [-0.36, -0.25, -0.04] },
    block(0.24, 0.22, 0.13, LEATHER),
    block(0.25, 0.07, 0.14, '#6e4428', { at: [0, 0.08, 0.005] }),
    block(0.05, 0.05, 0.02, GOLD, { at: [0, 0.05, 0.075] }),
    ...[[-0.06, 0.13], [0.03, 0.14], [0.08, 0.125]].map(([x, y]) => block(0.05, 0.05, 0.05, GOLD, { at: [x, y, -0.02] })),
    ...light(0.04, 0.08, 0.04, '#c38bff', { at: [-0.08, 0.15, 0.02] }, 1.5),
    block(0.03, 0.3, 0.03, LEATHER, { at: [0.12, 0.2, 0.02], rot: [0, 0, -40] }),
  );

  const head = node('head', {},
    block(0.8, 0.16, 0.8, BELL_DARK, { at: [0, 0.04, 0] }),
    block(0.76, 0.18, 0.76, BELL, { at: [0, 0.18, 0] }),
    block(0.62, 0.14, 0.62, BELL, { at: [0, 0.33, 0] }),
    block(0.42, 0.1, 0.42, BELL_LIGHT, { at: [0, 0.44, 0] }),
    ...speckle(shades(BELL), { box: [0.76, 0.18, 0.76], at: [0, 0.18, 0], faces: 'lrb', count: 10, size: 0.05, seed: 51 }),
    ...[[0.3, 0.18, 0.2], [-0.3, 0.2, -0.1], [0.12, 0.33, -0.28], [-0.2, 0.33, 0.22], [0.0, 0.44, 0.1], [0.32, 0.2, -0.25]].flatMap(([x, y, z]) =>
      light(0.06, 0.06, 0.06, CYAN, { at: [x, y, z] }, 1.5)),
    // The frill under the rim.
    ...[0, 45, 90, 135, 180, 225, 270, 315].map((d) => {
      const a = (d * Math.PI) / 180;
      return block(0.12, 0.08, 0.06, BELL_DARK, { at: [Math.sin(a) * 0.36, -0.06, Math.cos(a) * 0.36], rot: [0, d, 0] });
    }),
    ...pixelFace({ at: [0, 0.22, 0.38], px: 0.04, gap: 4.6 }),
    // A small top hat.
    block(0.32, 0.04, 0.32, DARK, { at: [0, 0.51, 0] }),
    block(0.2, 0.2, 0.2, DARK, { at: [0, 0.62, 0] }),
    block(0.21, 0.04, 0.21, GOLD, { at: [0, 0.55, 0] }),
  );

  const body = node('body', { at: [0, HOVER, 0] },
    head,
    ...[150, 190, 230, 270, 110, 330].map((angle, i) => tentacle(i, angle)),
    arm('l'),
    arm('r'),
    satchel,
  );

  const root = node('drifter', {}, body);
  const { rot, mov, scl } = rig(root);
  const wave = (p: number, shift = 0) => Math.sin((p + shift) * TAU);
  const zero: Vec3 = [0, 0, 0];
  const tentacles = (amount: number) =>
    [0, 1, 2, 3, 4, 5].map((i) => rot(`tentacle_${i}`, loop((p) => [amount * wave(p, i / 6), 0, amount * 0.6 * wave(p, i / 6 + 0.25)])));

  const idle = animation('Idle', 3, [
    mov('body', loop((p) => [0, 0.08 * wave(p), 0])),
    scl('head', loop((p) => [1 + 0.025 * wave(p * 2), 1 - 0.03 * wave(p * 2), 1 + 0.025 * wave(p * 2)])),
    rot('head', loop((p) => [3 * wave(p, 0.3), 10 * wave(p, 0.1), 0])),
    scl('eyes', loop((p) => blink(p, 0.8))),
    rot('satchel', loop((p) => [0, 0, 5 * wave(p, 0.2)])),
    rot('lantern', loop((p) => [0, 0, 8 * wave(p, 0.3)])),
    ...tentacles(10),
  ]);

  const talk = animation('Talk', 1.5, [
    mov('body', loop((p) => [0, 0.05 * wave(p * 2), 0])),
    rot('head', loop((p) => [7 * wave(p * 2), 6 * wave(p), 0])),
    rot('arm_l', loop((p) => [-30 - 15 * wave(p), 0, 15 * wave(p, 0.25)])),
    rot('arm_r', loop((p) => [-15 - 8 * wave(p, 0.5), 0, -8 * wave(p, 0.25)])),
    scl('eyes', loop((p) => blink(p, 0.45))),
    ...tentacles(14),
  ]);

  const sway = (t: number, z: number): [number, Vec3] => [t, [-40, 0, z]];
  const greet = animation('Wave', 1.6, [
    rot('arm_l', poses([0, zero], sway(0.3, 85), sway(0.5, 115), sway(0.7, 80), sway(0.9, 115), sway(1.1, 80), sway(1.3, 100), [1.6, zero])),
    rot('head', poses([0, zero], [0.3, [-5, 10, 8]], [1.3, [-5, 10, 8]], [1.6, zero])),
    mov('body', poses([0, zero], [0.3, [0, 0.08, 0]], [1.3, [0, 0.08, 0]], [1.6, zero])),
  ]);

  return model(root, [idle, talk, greet]);
}

export const drifter: ModelEntry = { id: 'npc-drifter', name: 'Drifter', type: 'npc', flies: true, create };
