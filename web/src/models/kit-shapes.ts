// Every shape of the kit in a row, to look at them: a new piece has to be
// seen, not only pass the tests. Development only.

import { PALETTE, bar, barrel, box, capsule, cone, dome, eye, glow, model, node, part, sphere, spike, torus } from './kit.ts';
import type { Model, ModelEntry } from './kit.ts';

function create(): Model {
  const gap = 0.8;
  const x = (i: number) => (i - 4.5) * gap;
  const root = node('kit_shapes', {},
    node('box', { at: [x(0), 0, 0] }, part(box(0.5, 0.5, 0.5), PALETTE.snow, { at: [0, 0.25, 0] })),
    node('sphere', { at: [x(1), 0, 0] }, part(sphere(0.28), PALETTE.ember, { at: [0, 0.28, 0] })),
    node('capsule', { at: [x(2), 0, 0] }, part(capsule(0.18, 0.7), PALETTE.cyan, { at: [0, 0.35, 0] })),
    node('barrel', { at: [x(3), 0, 0] }, part(barrel(0.2, 0.3, 0.6), PALETTE.slate, { at: [0, 0.3, 0] })),
    node('torus', { at: [x(4), 0, 0] }, part(torus(0.24, 0.07), PALETTE.lilac, { at: [0, 0.07, 0] })),
    node('cone', { at: [x(5), 0, 0] }, part(cone(0.26, 0.6), PALETTE.sun)),
    node('spike', { at: [x(6), 0, 0] },
      part(spike(0.12, 0.6, 0.35), PALETTE.violet),
      part(spike(0.08, 0.4), PALETTE.violet, { at: [0.16, 0, 0.1] })),
    node('dome', { at: [x(7), 0, 0] }, part(dome(0.3), PALETTE.moss)),
    node('bar', { at: [x(8), 0, 0] },
      bar([-0.2, 0.05, 0], [0.2, 0.55, 0], 0.06, PALETTE.rust),
      part(sphere(0.08), glow(PALETTE.red), { at: [0.2, 0.62, 0] })),
    node('eyes', { at: [x(9), 0, 0] },
      eye('eye_angry', { at: [0, 0.55, 0], radius: 0.18, iris: PALETTE.red, lid: PALETTE.coal, lidOpen: 5, lidAngle: 30, side: 'r' }),
      eye('eye_glow', { at: [0, 0.18, 0], radius: 0.14, iris: PALETTE.cyan, glow: true, pupil: null })),
  );
  return model(root, []);
}

export const kitShapes: ModelEntry = { id: 'kit-shapes', name: 'Kit shapes', type: 'prop', create };
