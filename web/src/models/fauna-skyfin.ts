// Skyfin: a gentle flier of TRAPPIST-1 e, about 3 m across its fins. A
// round lilac body with a cream belly, two wide soft fins that row the air,
// a long tail with a glowing tip, and a little face with big eyes. It glides
// in small flocks above the meadows. Soft cartoon, the game's style.

import { TAU, animation, glow, halo, loop, model, node, part, rig, soft, sphere, tube } from './kit.ts';
import type { Model, ModelEntry } from './kit.ts';
import { kindEyes } from './fauna-face.ts';

const SKIN = soft('#c58bff', 0.5);
const SKIN_DEEP = soft('#9a63e0', 0.4);
const BELLY = soft('#fff1d6', 0.35);
const TIP = '#7ff7e0';
/** It hovers this high over its origin. */
const HOVER = 2.2;

function create(): Model {
  const fin = (s: number) => node(`fin_${s > 0 ? 'l' : 'r'}`, { at: [s * 0.35, 0, -0.05] },
    part(sphere(0.8, 0.8), SKIN, { at: [s * 0.75, 0, -0.1], scale: [1, 0.12, 0.62], rot: [0, s * -12, 0] }),
    part(sphere(0.45, 0.6), SKIN_DEEP, { at: [s * 1.3, 0.02, -0.28], scale: [1, 0.1, 0.55], rot: [0, s * -25, 0] }),
    part(sphere(0.08, 0.4), glow(TIP), { at: [s * 1.6, 0.04, -0.4], outline: false }));

  const head = node('head', { at: [0, 0.05, 0.55] },
    part(sphere(0.34, 0.8), SKIN, { scale: [1.1, 0.85, 1] }),
    part(sphere(0.22, 0.6), BELLY, { at: [0, -0.12, 0.16], scale: [1.2, 0.6, 0.8] }),
    kindEyes([0, 0.08, 0.22], 0.3, 0.1));

  const body = node('body', { at: [0, HOVER, 0] },
    part(sphere(0.5, 0.8), SKIN, { scale: [1, 0.7, 1.25] }),
    part(sphere(0.38, 0.6), BELLY, { at: [0, -0.15, 0.05], scale: [1, 0.55, 1.15] }),
    head,
    fin(1), fin(-1),
    node('tail', { at: [0, 0, -0.55] },
      part(tube([[0, 0, 0], [0, 0.05, -0.5], [0, -0.05, -1.0], [0, 0.05, -1.4]], 0.06, 0.5), SKIN_DEEP),
      part(sphere(0.11, 0.5), glow(TIP), { at: [0, 0.05, -1.48], outline: false }),
      part(sphere(0.24, 0.4), halo(TIP, 0.35), { at: [0, 0.05, -1.48], outline: false })));

  const root = node('skyfin', {}, body);
  const { rot, mov } = rig(root);
  const wave = (p: number, shift = 0) => Math.sin((p + shift) * TAU);

  // Hovering: slow strokes of the fins, a gentle bob.
  const idle = animation('Idle', 2, [
    rot('fin_l', loop((p) => [0, 0, 22 * wave(p)])),
    rot('fin_r', loop((p) => [0, 0, -22 * wave(p)])),
    mov('body', loop((p) => [0, -0.12 * wave(p, 0.1), 0])),
    rot('tail', loop((p) => [8 * wave(p, 0.3), 10 * wave(p), 0])),
    rot('head', loop((p) => [0, 12 * wave(p * 0.5), 0])),
  ]);

  // Gliding: long strokes, the body leaning into them.
  const move = animation('Move', 1.2, [
    rot('fin_l', loop((p) => [0, 0, 34 * wave(p)])),
    rot('fin_r', loop((p) => [0, 0, -34 * wave(p)])),
    mov('body', loop((p) => [0, -0.2 * wave(p, 0.15), 0])),
    rot('body', loop((p) => [5 * wave(p, 0.25), 0, 0])),
    rot('tail', loop((p) => [14 * wave(p, 0.4), 6 * wave(p), 0])),
  ]);

  return model(root, [idle, move]);
}

export const skyfin: ModelEntry = { id: 'fauna-skyfin', name: 'Skyfin', type: 'fauna', flies: true, create };
