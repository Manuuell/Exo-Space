// Ashwing's nest, on a peak of the last valley: a mound of dark rock with a
// ring of charred logs heaped into a bowl, embers glowing in it, three of the
// dragon's eggs (indigo, cracked with ember light), and the bones of what it
// has hunted. About 13 m across. Soft cartoon, the game's style.

import { bar, glow, halo, lathe, model, node, part, soft, sphere } from './kit.ts';
import type { Model, ModelEntry } from './kit.ts';

const ROCK = soft('#4a3b3a', 0.3);
const ROCK_DARK = soft('#33292a', 0.25);
const LOG = soft('#3a2620', 0.3);
const CHAR = soft('#1f1716', 0.2);
const EGG = soft('#3f4a94', 0.5);
const BONE = soft('#f3e6c8', 0.3);
const EMBER = '#ff8a2a';

function create(): Model {
  // The mound: a low, wide hill of rock with a hollow on top.
  const mound = part(lathe([[0, 1.1], [3.2, 1.25], [4.6, 1.6], [5.6, 1.3], [6.4, 0.6], [6.6, 0]], 20), ROCK);
  const rocks = Array.from({ length: 9 }, (_, i) => {
    const a = (i / 9) * Math.PI * 2 + 0.3;
    const r = 5.6 + (i % 3) * 0.4;
    const size = 0.9 + (i % 4) * 0.25;
    return part(sphere(size, 0), i % 2 ? ROCK : ROCK_DARK, { at: [Math.sin(a) * r, size * 0.8, Math.cos(a) * r], scale: [1.2, 0.8, 1] });
  });
  // The bowl: charred logs leaning around the hollow, two rings of them.
  const logs = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    const r = i % 2 ? 3.6 : 4.3;
    const y = i % 2 ? 1.5 : 1.8;
    const tangent = [Math.cos(a), 0, -Math.sin(a)];
    const centre = [Math.sin(a) * r, y, Math.cos(a) * r];
    const half = 1.6 + (i % 3) * 0.25;
    return bar(
      [centre[0] - tangent[0] * half, centre[1] - 0.25 + (i % 2) * 0.2, centre[2] - tangent[2] * half],
      [centre[0] + tangent[0] * half, centre[1] + 0.25, centre[2] + tangent[2] * half],
      0.22, i % 3 ? LOG : CHAR);
  });
  // Embers in the hollow.
  const embers = [[0.8, 0.4], [-1.2, 0.9], [0.2, -1.4], [-0.6, -0.5], [1.6, -0.6]].flatMap(([x, z]) => [
    part(sphere(0.32, 1), glow(EMBER), { at: [x, 1.28, z], scale: [1, 0.45, 1], outline: false }),
  ]);
  // Three eggs, one fallen on its side.
  const egg = (k: number, x: number, z: number, tilt: number) => node(`egg_${k}`, { at: [x, 1.3, z], rot: [tilt, 0, tilt * 0.5] },
    part(sphere(0.55, 1), EGG, { at: [0, 0.6, 0], scale: [0.85, 1.2, 0.85] }),
    bar([0.2, 0.35, 0.42], [-0.05, 0.75, 0.47], 0.035, glow(EMBER), { outline: false }),
    bar([-0.05, 0.75, 0.47], [0.15, 1.05, 0.4], 0.03, glow(EMBER), { outline: false }));
  // Bones of its prey: a rib cage and a long thigh bone.
  const bones = [
    ...[0, 1, 2, 3].map((i) => bar([-3 + i * 0.35, 1.35, 2.2], [-3.2 + i * 0.35, 2.0, 1.7], 0.06, BONE)),
    bar([-3.3, 1.38, 2.1], [-1.9, 1.38, 2.5], 0.08, BONE),
    bar([2.6, 1.4, -2.0], [3.6, 1.45, -1.2], 0.1, BONE),
  ];
  const root = node('dragon-nest', {},
    mound, ...rocks, ...logs, ...embers,
    egg(0, -0.4, 0.3, 0), egg(1, 0.9, -0.5, 6), egg(2, -1.4, -0.9, 70),
    ...bones,
    part(sphere(2.6, 1), halo(EMBER, 0.12), { at: [0, 1.3, 0], scale: [1, 0.35, 1], outline: false }));
  return model(root, []);
}

export const dragonNest: ModelEntry = { id: 'prop-dragon-nest', name: 'Dragon nest', type: 'prop', create };
