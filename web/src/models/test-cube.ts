// Test model: a cube with eyes that jumps. It only proves that the kit, the
// viewers and the tests work. Delete it once the first real character exists.

import { PALETTE, TAU, animation, bar, box, eye, glow, loop, model, node, part, poses, rig, sphere } from './kit.ts';
import type { Model, ModelEntry } from './kit.ts';

/** 0 most of the time, a quick bump to 1 between two phases: a blink. */
function bump(phase: number, from: number, to: number): number {
  if (phase <= from || phase >= to) return 0;
  return Math.sin(((phase - from) / (to - from)) * Math.PI);
}

function create(): Model {
  const colour = PALETTE.mint;
  // The body pivots at ground level, so squashing it keeps it on the floor.
  const root = node('test_cube', {},
    node('body', {},
      part(box(0.9, 0.9, 0.9, 0.18), colour, { at: [0, 0.45, 0] }),
      part(box(0.26, 0.06, 0.05, 0.025), PALETTE.ink, { at: [0, 0.3, 0.45], outline: false }),
      eye('eye_l', { at: [0.2, 0.6, 0.4], radius: 0.17, iris: PALETTE.navy, lid: colour, lidOpen: 70, side: 'l' }),
      eye('eye_r', { at: [-0.2, 0.6, 0.4], radius: 0.17, iris: PALETTE.navy, lid: colour, lidOpen: 70, side: 'r' }),
      node('antenna', { at: [0.18, 0.9, -0.1] },
        bar([0, 0, 0], [0.06, 0.32, 0], 0.025, PALETTE.slate),
        part(sphere(0.07), glow(PALETTE.ember), { at: [0.06, 0.36, 0] }),
      ),
    ),
  );

  const { rot, mov, scl } = rig(root);
  const breathe = (phase: number) => Math.sin(phase * TAU);
  const blink = (phase: number): [number, number, number] => [150 * bump(phase, 0.84, 0.94), 0, 0];

  const idle = animation('Idle', 2.4, [
    scl('body', loop((p) => [1 + 0.03 * breathe(p), 1 - 0.04 * breathe(p), 1 + 0.03 * breathe(p)])),
    rot('eye_l_lid', loop(blink)),
    rot('eye_r_lid', loop(blink)),
    rot('antenna', loop((p) => [0, 0, 8 * Math.sin(p * TAU + 0.6)])),
  ]);

  // Anticipation, launch, apex, landing and settle: it has to read from afar.
  const jump = animation('Jump', 1.2, [
    mov('body', poses(
      [0, [0, 0, 0]],
      [0.22, [0, 0, 0]],
      [0.55, [0, 1.1, 0], 'out'],
      [0.86, [0, 0, 0], 'in'],
    )),
    scl('body', poses(
      [0, 1],
      [0.2, [1.25, 0.7, 1.25]],
      [0.3, [0.85, 1.25, 0.85], 'snap'],
      [0.55, 1],
      [0.84, [0.92, 1.1, 0.92], 'in'],
      [0.92, [1.3, 0.65, 1.3], 'snap'],
      [1.05, [0.96, 1.05, 0.96]],
      [1.2, 1],
    )),
    rot('eye_l_lid', poses([0, [0, 0, 0]], [0.2, [55, 0, 0]], [0.32, [-15, 0, 0], 'snap'], [0.9, [0, 0, 0]], [0.95, [55, 0, 0]], [1.15, [0, 0, 0]])),
    rot('eye_r_lid', poses([0, [0, 0, 0]], [0.2, [55, 0, 0]], [0.32, [-15, 0, 0], 'snap'], [0.9, [0, 0, 0]], [0.95, [55, 0, 0]], [1.15, [0, 0, 0]])),
    rot('antenna', poses([0, [0, 0, 0]], [0.3, [0, 0, -25]], [0.55, [0, 0, 20]], [0.92, [0, 0, -30], 'snap'], [1.2, [0, 0, 0], 'back'])),
  ]);

  return model(root, [idle, jump]);
}

export const testCube: ModelEntry = { id: 'test-cube', name: 'Test cube', type: 'prop', create };
