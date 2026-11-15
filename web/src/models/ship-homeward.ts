// Homeward: the player's ship, in the protagonist's soft cartoon style
// (the game's style since 2026-11-15). A long cream
// hull with a pointed nose, the protagonist's cobalt blue and orange in its
// stripes, a dark glossy canopy with orange frames, double-delta wings with
// canards, a canted twin tail and a main engine. Two things are its own: an
// engine pod at each wing tip that turns, pointing at the ground to take
// off and land and backwards to fly, and a glass dome on its back where the
// jump rune glows while the player has one. About 12 m long and 10 m across.
// Original design, no logos.
//
// It follows the flight logic of web/src/content/flight.ts: the origin is on
// the ground under the ship and the nose points along +Z.

import { TAU, animation, bar, barrel, cone, dome, glow, halo, lamp, lathe, loop, model, node, part, poses, rig, slab, soft, sphere, strap, torus } from './kit.ts';
import type { Look, Model, ModelEntry, Vec3 } from './kit.ts';

/** The ship's paint. */
interface Looks {
  cream: Look; blue: Look; blueDeep: Look; orange: Look; dark: Look;
  steel: Look; burnt: Look; tyre: Look; canopy: Look; dome: Look;
}

/** The protagonist's soft cartoon: her own colours under a smooth ramp of light. */
const CARTOON: Looks = {
  cream: soft('#fff1d6'), blue: soft('#2f7bff'), blueDeep: soft('#1d4fd0'), orange: soft('#ff8b2c'),
  dark: soft('#2a2d4a', 0.3), steel: soft('#a3a9c2'), burnt: soft('#5a5f75', 0.3), tyre: soft('#22242e', 0.2),
  canopy: soft('#24508a', 0.9), dome: soft('#2a9fb8', 0.9),
};

const CYAN = '#63e9ff';

/** Height of the hull's axis over the ground, with the legs out. */
const AXIS = 2.0;
/** The hull is a little flatter than it is wide. */
const FLAT = 0.82;
const HULL_R = 1.05;
const TAIL = -5.0;
const NOSE = 6.1;

type Outline = [number, number][];

/** Radius of the hull at a point along it (z): a swollen tail, a straight middle, a pointed nose. */
function hullRadius(z: number): number {
  if (z <= TAIL) return 0.6;
  if (z < -1.6) return 0.6 + (HULL_R - 0.6) * Math.sin((((z - TAIL) / (-1.6 - TAIL)) * Math.PI) / 2);
  if (z < 0.4) return HULL_R;
  const t = Math.min(1, (z - 0.4) / (NOSE - 0.4));
  return HULL_R * Math.sqrt(1 - t * t) * (1 - 0.35 * t);
}

/** The hull's profile from z0 to z1, pushed out by `out`, as [radius, z] for lathe(). */
function hullProfile(z0: number, z1: number, steps: number, out = 0): Outline {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const z = z0 + ((z1 - z0) * i) / steps;
    const r = hullRadius(z);
    return [r > 0.01 ? r + out : 0, z];
  });
}

/** A lathe turned so its axis runs along +Z, and flattened like the hull. */
const alongHull = { at: [0, AXIS, 0] as Vec3, rot: [90, 0, 0] as Vec3, scale: [1, 1, FLAT] as Vec3 };

/** A point on the hull's surface: along it (z), around it (degrees from the top), pushed out by `out`. */
function onHull(z: number, angle: number, out = 0.012): Vec3 {
  const a = (angle * Math.PI) / 180;
  const r = hullRadius(z) + out;
  return [Math.sin(a) * r, AXIS + Math.cos(a) * r * FLAT, z];
}

function build(L: Looks): Model {
  // Painted bands around the hull, just over its surface, and panel seams.
  const band = (z0: number, z1: number, look: Look) => part(lathe(hullProfile(z0, z1, 4, 0.012), 32), look, alongHull);
  const seam = (z: number) => part(torus(hullRadius(z) + 0.01, 0.018, 0.6), L.dark, { at: [0, AXIS, z], rot: [90, 0, 0], scale: [1, 1, FLAT] });
  // A stripe along a side of the hull, at an angle from the top.
  const stripe = (s: number, angle: number, width: number, look: Look, z0 = -4.4, z1 = 4.6) => {
    const a = (angle * Math.PI) / 180;
    const points = Array.from({ length: 9 }, (_, i) => onHull(z0 + ((z1 - z0) * i) / 8, s * angle));
    return part(strap(points, width, 0.02, [0, Math.sin(a), -Math.cos(a) * s], 0.45), look);
  };

  // The canopy: an elongated glossy bubble with orange frames.
  const canopyAt: Vec3 = [0, AXIS + 0.8, 2.1];
  const canopyR: Vec3 = [0.55, 0.42, 1.5];
  const canopyTop = (dz: number) => canopyAt[1] + canopyR[1] * Math.sqrt(1 - (dz / canopyR[2]) ** 2) + 0.015;
  const frame = (dz: number) => {
    const k = Math.sqrt(1 - (dz / canopyR[2]) ** 2);
    const points = Array.from({ length: 9 }, (_, i) => {
      const a = ((-80 + i * 20) * Math.PI) / 180;
      return [Math.sin(a) * (canopyR[0] * k + 0.015), canopyAt[1] + Math.cos(a) * (canopyR[1] * k + 0.015), canopyAt[2] + dz] as Vec3;
    });
    return part(strap(points, 0.06, 0.03, [0, 0, 1], 0.5), L.orange);
  };
  const spine = part(strap(Array.from({ length: 7 }, (_, i) => {
    const dz = -1.3 + i * (2.6 / 6);
    return [0, canopyTop(dz), canopyAt[2] + dz] as Vec3;
  }), 0.06, 0.03, [1, 0, 0], 0.5), L.orange);

  // A wing, swept back, with a strake along the hull and an engine pod at
  // the tip. `s` is +1 for the left wing (+X) and -1 for the right one.
  const wing = (s: number) => {
    const side = s > 0 ? 'l' : 'r';
    const mirror = (outline: Outline): Outline => outline.map(([x, z]) => [x * s, z]);
    const lit = s > 0 ? '#ff4a4a' : '#4dff88';
    // The pod: a nacelle whose nose points along +Z; at rest it is turned
    // to fire at the ground.
    const pod = node(`pod_${side}`, { at: [s * 3.95, 0.05, -2.3], rot: [-90, 0, 0] },
      part(lathe([[0, -1.1], [0.36, -1.1], [0.48, -0.7], [0.52, 0], [0.5, 0.7], [0.44, 1.05], [0.36, 1.15]], 20, 14), L.blue, { rot: [90, 0, 0] }),
      part(lathe([[0.535, -0.25], [0.535, 0.25]], 24), L.orange, { rot: [90, 0, 0] }),
      part(lathe([[0.515, 0.55], [0.48, 0.9], [0.4, 1.13]], 24), L.cream, { rot: [90, 0, 0] }),
      part(torus(0.39, 0.06), L.steel, { at: [0, 0, 1.15], rot: [90, 0, 0] }),
      part(barrel(0.34, 0.34, 0.05), L.dark, { at: [0, 0, 1.1], rot: [90, 0, 0] }),
      part(lathe([[0.3, 0], [0.36, -0.2], [0.42, -0.3]], 20), L.burnt, { at: [0, 0, -1.08], rot: [90, 0, 0] }),
      part(barrel(0.3, 0.3, 0.04), L.dark, { at: [0, 0, -1.1], rot: [90, 0, 0] }),
      node(`pod_glow_${side}`, { at: [0, 0, -1.15] },
        part(cone(0.28, 0.3), glow(CYAN), { rot: [-90, 0, 0], outline: false }),
        part(cone(0.42, 0.45), halo(CYAN, 0.3), { rot: [-90, 0, 0], outline: false })));
    const trailing = mirror([[0.2, -2.95], [3.3, -2.6], [3.3, -2.85], [0.2, -3.25]]);
    return node(`wing_${side}`, { at: [s * 0.82, AXIS - 0.35, 0] },
      part(slab(mirror([[0, 2.4], [0.5, 0.9], [3.4, -1.6], [3.4, -2.9], [0, -3.4]]), 0.16), L.cream),
      part(slab(mirror([[0.55, 0.62], [3.3, -1.75], [3.3, -2.0], [0.55, 0.32]]), 0.02, 0.005), L.orange, { at: [0, 0.085, 0] }),
      part(slab(trailing, 0.02, 0.005), L.blue, { at: [0, 0.085, 0] }),
      part(slab(trailing, 0.02, 0.005), L.blue, { at: [0, -0.085, 0] }),
      // The hinge the pod turns on.
      part(barrel(0.16, 0.16, 0.6), L.steel, { at: [s * 3.55, 0.05, -2.3], rot: [0, 0, 90] }),
      // Navigation lights: red on the left wing, green on the right.
      node(`nav_${side}`, { at: [s * 3.35, 0, -1.5] },
        part(sphere(0.07, 0.6), lamp(lit, 3)),
        part(sphere(0.16, 0.6), halo(lit, 0.35), { outline: false })),
      pod);
  };

  const canard = (s: number) => part(slab([[0, 0.5], [0.95 * s, -0.05], [0.95 * s, -0.3], [0, -0.4]], 0.1), L.blue, { at: [s * 0.62, AXIS - 0.08, 3.3] });

  // A tail fin, canted out and swept back, tipped in orange. The outline is
  // drawn flat ([height, z]) and stood up.
  const fin = (s: number) => {
    const place = { at: [s * 0.32, AXIS + 0.55, 0] as Vec3, rot: [0, 0, 90 - s * 25] as Vec3 };
    return [
      part(slab([[0, -2.5], [1.75, -3.9], [1.75, -4.6], [0, -4.9]], 0.12), L.blueDeep, place),
      part(slab([[1.45, -3.6], [1.78, -3.88], [1.78, -4.62], [1.45, -4.62]], 0.14, 0.03), L.orange, place),
    ];
  };

  // Landing legs: they fold back under the hull to fly. The pad touches
  // the ground.
  const leg = (name: string, at: Vec3) => {
    const drop = at[1];
    return node(name, { at },
      part(barrel(0.12, 0.12, 0.2), L.dark, { rot: [0, 0, 90] }),
      bar([0, 0, 0], [0, -drop + 0.12, 0], 0.07, L.steel),
      bar([0.12, -0.2, 0.06], [0.12, -drop * 0.65, 0.06], 0.045, L.dark),
      part(barrel(0.26, 0.3, 0.1), L.tyre, { at: [0, -drop + 0.05, 0] }));
  };

  const back = AXIS + HULL_R * FLAT;
  const body = node('body', {},
    // The hull, its painted bands, seams and stripes.
    part(lathe([[0, TAIL], ...hullProfile(TAIL, NOSE, 40)], 32), L.cream, alongHull),
    band(NOSE - 0.85, NOSE, L.orange),
    band(-0.5, 0.0, L.blue),
    band(-4.55, -4.25, L.orange),
    seam(-3.6), seam(-2.0), seam(1.0), seam(3.9),
    ...[1, -1].flatMap((s) => [stripe(s, 88, 0.26, L.blue), stripe(s, 103, 0.08, L.orange, -4.2, 4.2)]),
    // Canopy and frames; side air intakes.
    part(sphere(1, 1.1), L.canopy, { at: canopyAt, scale: canopyR }),
    frame(-0.75), frame(0), frame(0.75), spine,
    ...[1, -1].map((s) => part(barrel(0.2, 0.26, 1.1), L.dark, { at: [s * 0.86, AXIS - 0.15, 0.6], rot: [90, 0, 0], scale: [1, 1, 1.6] })),
    // The rune dome on the back, with the jump rune inside.
    part(torus(0.44, 0.045), L.orange, { at: [0, back, -0.7] }),
    part(dome(0.42), L.dome, { at: [0, back, -0.7] }),
    node('rune', { at: [0, back + 0.22, -0.7] },
      node('rune_glow', {},
        part(lathe([[0, -0.15], [0.11, 0], [0, 0.15]], 4), lamp(CYAN, 3)),
        part(sphere(0.24, 0.6), halo(CYAN, 0.35), { outline: false }))),
    // An antenna with a beacon.
    bar([0, AXIS + 0.85, -2.2], [0, AXIS + 1.45, -2.45], 0.025, L.steel),
    part(sphere(0.05, 0.5), lamp('#ff4a4a', 3), { at: [0, AXIS + 1.47, -2.46] }),
    // The main engine.
    part(lathe([[0.5, 0], [0.6, -0.4], [0.7, -0.75]], 28), L.burnt, { at: [0, AXIS, TAIL + 0.05], rot: [90, 0, 0] }),
    part(barrel(0.5, 0.5, 0.05), L.dark, { at: [0, AXIS, TAIL - 0.05], rot: [90, 0, 0] }),
    node('engine', { at: [0, AXIS, TAIL - 0.1] },
      node('flame', {},
        part(cone(0.45, 0.9), glow(CYAN), { rot: [-90, 0, 0], outline: false }),
        part(cone(0.66, 1.3), halo(CYAN, 0.3), { rot: [-90, 0, 0], outline: false }))),
    ...fin(1), ...fin(-1),
    canard(1), canard(-1),
    wing(1), wing(-1),
    leg('leg_n', [0, 1.42, 3.0]),
    leg('leg_l', [1.3, AXIS - 0.43, -1.6]),
    leg('leg_r', [-1.3, AXIS - 0.43, -1.6]),
  );

  const root = node('homeward', {}, body);
  const { rot, mov, scl } = rig(root);
  const wave = (p: number, shift = 0) => Math.sin((p + shift) * TAU);
  const zero: Vec3 = [0, 0, 0];
  const legs = ['leg_n', 'leg_l', 'leg_r'];
  const pods = ['pod_l', 'pod_r'];
  const glows = ['pod_glow_l', 'pod_glow_r'];
  /** Legs folded back under the hull, and pods turned to push forward. */
  const folded: Vec3 = [90, 0, 0];
  const blink = (shift: number) => loop((p) => ((p + shift) % 0.5 < 0.08 ? 1.6 : 0.5));

  // Landed: the engines idle low, the rune turns, the lights blink.
  const idle = animation('Idle', 2, [
    scl('flame', loop((p) => 0.4 + 0.04 * wave(p * 2))),
    ...glows.map((name) => scl(name, loop((p) => 0.35 + 0.04 * wave(p * 2, 0.3)))),
    rot('rune_glow', loop((p) => [0, 720 * p, 0])),
    scl('rune_glow', loop((p) => 1 + 0.12 * wave(p * 2))),
    scl('nav_l', blink(0)),
    scl('nav_r', blink(0.25)),
  ]);

  // The pods fire at the ground, the legs fold away (by 0.7 s) and the pods
  // swing back to push forward (by 1.2 s).
  const takeoff = animation('Takeoff', 1.2, [
    ...legs.map((name) => rot(name, poses([0, zero], [0.15, zero], [0.7, folded, 'inOut']))),
    ...pods.map((name) => rot(name, poses([0, zero], [0.4, zero], [1.2, folded, 'inOut']))),
    ...glows.map((name) => scl(name, poses([0, 0.35], [0.15, 2.4, 'snap'], [1.2, 1.6]))),
    scl('flame', poses([0, 0.4], [0.6, 0.6], [1.2, 1, 'out'])),
    mov('body', poses([0, zero], [0.15, [0, -0.06, 0], 'snap'], [0.4, zero])),
  ]);

  // In flight: legs away, pods back, the engines alive and a light sway.
  const fly = animation('Fly', 2, [
    ...legs.map((name) => rot(name, loop(() => folded))),
    ...pods.map((name, i) => rot(name, loop((p) => [90 + 3 * wave(p, i * 0.5), 0, 0]))),
    ...glows.map((name, i) => scl(name, loop((p) => 1.6 + 0.2 * wave(p * 6, i * 0.3)))),
    scl('flame', loop((p) => 1 + 0.12 * wave(p * 8))),
    mov('body', loop((p) => [0, 0.05 * wave(p), 0])),
    rot('rune_glow', loop((p) => [0, 720 * p, 0])),
    scl('nav_l', blink(0)),
    scl('nav_r', blink(0.25)),
  ]);

  // The pods swing down to hold it up (by 0.6 s), the legs come out (by
  // 1.1 s), and it settles on them.
  const land = animation('Land', 1.4, [
    ...pods.map((name) => rot(name, poses([0, folded], [0.6, zero, 'inOut']))),
    ...legs.map((name) => rot(name, poses([0, folded], [0.4, folded], [1.1, zero, 'inOut']))),
    ...glows.map((name) => scl(name, poses([0, 1.6], [0.6, 2.2], [1.2, 1.6], [1.4, 0.35]))),
    scl('flame', poses([0, 1], [0.8, 0.6], [1.4, 0.4])),
    mov('body', poses([0, zero], [1.15, zero], [1.25, [0, -0.06, 0], 'snap'], [1.4, zero])),
  ]);

  return model(root, [idle, takeoff, fly, land]);
}

export const homeward: ModelEntry = { id: 'ship-homeward', name: 'Homeward', type: 'ship', create: () => build(CARTOON) };
