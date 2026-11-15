// Giant tree, the "skyshade" of TRAPPIST-1 e: a landmark seen from far
// away and from the air, about 67 m tall. Big roots arching into the
// ground, a flared trunk with spiralling bark, a glowing hollow at its foot,
// four branches holding the planet's umbrella crowns at full size, and pink
// lantern-pods hanging from vines under them. Soft cartoon, the game's
// style. Original design. The origin is on the ground under the trunk.

import { TAU, animation, bar, glow, halo, lathe, loop, model, node, part, rig, seeded, soft, sphere, tube } from './kit.ts';
import type { Model, ModelEntry, Vec3 } from './kit.ts';

const BARK = soft('#7d5446', 0.3);
const BARK_DARK = soft('#5e3c34', 0.25);
const CROWN = soft('#33c4a2', 0.45);
const CROWN_LIGHT = soft('#7fe6b8', 0.45);
const VINE = soft('#3f8f4a', 0.3);
const POD = '#ff8fc4';
const SPORE = '#7ff7e0';

/** Radius of the trunk at a height: flared at the foot, narrowing upwards. */
function trunkRadius(y: number): number {
  return 2.3 + 4.6 * Math.exp(-y / 3.2) + 1.4 * Math.exp(-y / 22);
}

function create(): Model {
  const rand = seeded(311);
  const profile: [number, number][] = [[0, 0], ...Array.from({ length: 24 }, (_, i) => {
    const y = (i / 23) * 52;
    return [trunkRadius(y), y] as [number, number];
  }), [0, 52]];

  // Bark that spirals up the trunk, just over its surface.
  const spiral = (start: number) => {
    const points: Vec3[] = Array.from({ length: 12 }, (_, i) => {
      const y = 1.5 + i * 4.2;
      const a = start + i * 0.42;
      const r = trunkRadius(y) - 0.15;
      return [Math.sin(a) * r, y, Math.cos(a) * r];
    });
    return part(tube(points, 0.38, 0.35), BARK_DARK);
  };

  // A root: two segments arching out and down into the ground.
  const root = (angle: number, reach: number) => {
    const at = (r: number, y: number): Vec3 => [Math.sin(angle) * r, y, Math.cos(angle) * r];
    return [
      bar(at(3.2, 5.5), at(6.8, 2.2), 1.15, BARK),
      bar(at(6.8, 2.2), at(reach, 0.6), 0.6, BARK),
    ];
  };

  // A crown on a branch: a big flattened dome of leaves with a lighter top.
  const crown = (name: string, at: Vec3, radius: number) => node(name, { at },
    part(sphere(radius, 0.9), CROWN, { scale: [1, 0.3, 1] }),
    part(sphere(radius * 0.62, 0.6), CROWN_LIGHT, { at: [radius * 0.1, radius * 0.17, -radius * 0.05], scale: [1, 0.38, 1] }),
    // Vines with a glowing pod at the end, hanging from under the crown.
    ...Array.from({ length: 3 }, (_, k) => {
      const a = (k / 3) * TAU + rand();
      const r = radius * (0.45 + rand() * 0.35);
      const drop = 4 + rand() * 6;
      const top: Vec3 = [Math.sin(a) * r, -radius * 0.05, Math.cos(a) * r];
      const end: Vec3 = [top[0] * 1.05, top[1] - drop, top[2] * 1.05];
      return [
        part(tube([top, [top[0] * 1.08, top[1] - drop * 0.5, top[2] * 1.02], end], 0.12, 0.35), VINE),
        part(sphere(0.75, 0.4), glow(POD), { at: [end[0], end[1] - 0.6, end[2]], scale: [1, 1.3, 1], outline: false }),
        part(sphere(1.4, 0.4), halo(POD, 0.3), { at: [end[0], end[1] - 0.6, end[2]], outline: false }),
      ];
    }).flat());

  // Four branches out of the top of the trunk, each holding a crown.
  const branches = [[0.3, 13, 50], [2.0, 12, 47], [3.6, 14, 53], [5.1, 11, 45]] as const;

  const tree = node('giant_tree', {},
    part(lathe(profile, 16), BARK),
    spiral(0), spiral(2.1), spiral(4.2),
    ...[0.2, 1.25, 2.3, 3.3, 4.35, 5.4].flatMap((a, k) => root(a, 10.5 + (k % 3) * 1.6)),
    // The glowing hollow at the foot, with spore lights around it.
    part(sphere(1, 0.8), soft('#2a1f2e', 0.2), { at: [0, 2.6, trunkRadius(2.6) - 0.55], scale: [1.6, 2.4, 0.6] }),
    ...Array.from({ length: 6 }, (_, k) => part(sphere(0.22, 0.3), glow(SPORE), { at: [(k - 2.5) * 0.55, 0.5 + (k % 2) * 3.6, trunkRadius(1.5) - 0.2], outline: false })),
    ...branches.map(([a, reach, y]) => bar([Math.sin(a) * 1.2, y - 9, Math.cos(a) * 1.2], [Math.sin(a) * reach * 0.8, y - 1, Math.cos(a) * reach * 0.8], 1.0, BARK)),
    crown('crown_top', [0, 58, 0], 21),
    ...branches.map(([a, reach, y], k) => crown(`crown_${k}`, [Math.sin(a) * reach, y, Math.cos(a) * reach], 9 + (k % 2) * 2.5)),
  );

  const { rot, scl } = rig(tree);
  const wave = (p: number, shift = 0) => Math.sin((p + shift) * TAU);
  // The crowns sway a little in the wind; the pods breathe.
  const idle = animation('Idle', 4, [
    rot('crown_top', loop((p) => [1.2 * wave(p), 0, 1.0 * wave(p, 0.25)])),
    ...branches.map((_, k) => rot(`crown_${k}`, loop((p) => [1.6 * wave(p, k * 0.2), 0, 1.4 * wave(p, k * 0.2 + 0.25)]))),
    ...branches.map((_, k) => scl(`crown_${k}`, loop((p) => 1 + 0.01 * wave(p * 2, k * 0.3)))),
  ]);

  return model(tree, [idle]);
}

export const giantTree: ModelEntry = { id: 'prop-giant-tree', name: 'Giant tree (skyshade)', type: 'prop', create };
