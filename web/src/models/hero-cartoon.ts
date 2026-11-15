// The protagonist in a soft cartoon look: round, simple shapes, bright
// colours, a smooth ramp of light and a glow along the edges. A big helmet
// with a round window and a friendly face behind the glass, chunky limbs,
// mittens and boots, a scarf, and a round pack with a glowing ring, a
// bedroll and a little sensor orb. A proposal for the team to compare with
// the voxel hero and the detailed explorer; the colours are the team's.
// It moves with a bounce: the eyes blink, the antenna and the scarf lag
// behind, and the orb bobs on its arm. A weapon goes in the `hold` node of
// the right hand (see weapons.ts).

import * as THREE from 'three';
import { TAU, animation, bar, barrel, box, capsule, glass, glow, halo, lathe, loop, model, node, part, patch, poses, rig, soft, sphere, torus, tube } from './kit.ts';
import type { Key, Model, ModelEntry, Place, Track } from './kit.ts';

const BLUE = soft('#2f7bff');
const BLUE_DEEP = soft('#1d4fd0');
const CREAM = soft('#fff1d6');
const ORANGE = soft('#ff8b2c');
const GOLD = soft('#ffc533');
const DARK = soft('#2a2d4a');
const SKIN = soft('#f7c8a2', 0.25);
const HAIR = soft('#6a3f22');
const PINK = soft('#ff8fae', 0.2);
const MOUTH = soft('#8a3b2f', 0.1);
const EYE = soft('#22233a', 0.9);
const CYAN = '#63e9ff';
const WHITE = '#ffffff';
const WARM = '#ffd45a';

type Side = 'l' | 'r';
const SIDES = [1, -1] as const;
const DEG = Math.PI / 180;

/** A part that gives off light. */
function lit(geometry: THREE.BufferGeometry, colour: string, place: Place = {}): THREE.Mesh {
  return part(geometry, glow(colour), { ...place, outline: false });
}

/**
 * A lit piece with a soft glow around it. `aura` is the same shape, a little
 * bigger.
 */
function beam(core: THREE.BufferGeometry, aura: THREE.BufferGeometry, colour: string, place: Place = {}): THREE.Mesh[] {
  return [lit(core, colour, place), part(aura, halo(colour, 0.24), place)];
}

/**
 * Part of a circle as a profile for lathe(): angles from the top, in
 * degrees. Going down the circle turns the faces inwards.
 */
function arc(radius: number, from: number, to: number, steps: number): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const angle = (from + ((to - from) * i) / steps) * DEG;
    points.push([radius * Math.sin(angle), radius * Math.cos(angle)]);
  }
  return points;
}

function arm(side: Side): THREE.Group {
  const s = side === 'l' ? 1 : -1;
  const hand = node(`hand_${side}`, { at: [0, -0.185, 0] },
    // A mitten with a thumb.
    part(sphere(0.082, 1.1), BLUE_DEEP, { at: [0, -0.045, 0], scale: [0.85, 1.05, 1] }),
    part(sphere(0.036, 0.6), BLUE_DEEP, { at: [-0.02 * s, -0.03, 0.066], scale: [1, 1.2, 1] }),
  );
  // Where a weapon goes: the foot of its grip here, its barrel along the
  // forearm and its top towards the front of the hand.
  if (side === 'r') hand.add(node('hold', { at: [0, -0.045, -0.055], rot: [90, 0, 0] }));
  const forearm = node(`forearm_${side}`, { at: [0, -0.18, 0], rot: [-10, 0, 0] },
    bar([0, 0, 0], [0, -0.15, 0], 0.074, BLUE),
    // A thick cuff with a ring of light.
    part(lathe([[0.07, -0.17], [0.092, -0.158], [0.095, -0.105], [0.076, -0.092]], 18, 6), CREAM),
    ...beam(torus(0.094, 0.009, 0.8), torus(0.096, 0.016, 0.7), CYAN, { at: [0, -0.132, 0] }),
    hand,
  );
  return node(`arm_${side}`, { at: [0.225 * s, 0.3, 0], rot: [0, 0, 10 * s] },
    part(sphere(0.096, 1.1), BLUE_DEEP, { at: [0.008 * s, 0.008, 0], scale: [1, 0.92, 1] }),
    part(torus(0.086, 0.01, 0.8), GOLD, { at: [0.004 * s, -0.045, 0] }),
    bar([0, 0, 0], [0, -0.17, 0], 0.078, BLUE),
    forearm,
  );
}

function leg(side: Side): THREE.Group {
  const s = side === 'l' ? 1 : -1;
  const foot = node(`foot_${side}`, { at: [0, -0.22, 0] },
    // A big round boot: cream cuff and toe, a ring of light, a dark sole.
    part(lathe([[0.095, -0.03], [0.125, -0.015], [0.128, 0.05], [0.105, 0.066]], 20, 6), CREAM),
    ...beam(torus(0.127, 0.009, 0.8), torus(0.129, 0.016, 0.7), CYAN, { at: [0, 0.02, 0] }),
    part(sphere(0.125, 1.1), BLUE_DEEP, { at: [0, -0.06, 0.045], scale: [0.95, 0.72, 1.4] }),
    part(sphere(0.092, 0.8), CREAM, { at: [0, -0.066, 0.152], scale: [1.08, 0.72, 0.86] }),
    part(barrel(0.11, 0.115, 0.04, 0.015, 1.34), DARK, { at: [0, -0.13, 0.045], scale: [1, 1, 1.5] }),
  );
  const shin = node(`shin_${side}`, { at: [0, -0.2, 0] },
    bar([0, 0, 0], [0, -0.14, 0], 0.098, BLUE),
    // Knee pad.
    part(sphere(0.062, 0.7), CREAM, { at: [0, -0.005, 0.082], scale: [1.1, 1.1, 0.5] }),
    foot,
  );
  return node(`leg_${side}`, { at: [0.125 * s, -0.03, 0], rot: [0, 8 * s, 0] },
    bar([0, 0, 0], [0, -0.17, 0], 0.105, BLUE),
    shin,
  );
}

function create(): Model {
  // Helmet: a blue ball with a round window rimmed in gold. Its faces only
  // look outwards, so a dark lining shows behind the head.
  const R = 0.26;
  const OPEN = 56;
  const forward = [0, -0.06, 1] as const;
  const length = Math.hypot(...forward);
  const rimAt = (R * Math.cos(OPEN * DEG)) / length;
  const face = [0, -0.035, 0.015] as const;
  const onFace = (x: number, y: number, z: number) => [face[0] + x, face[1] + y, face[2] + z] as const;
  const helmet = node('helmet', { at: [0, 0.24, 0.01] },
    part(lathe(arc(R, 180, OPEN, 14), 28), BLUE, { up: forward }),
    part(lathe(arc(R - 0.012, OPEN, 180, 8), 20), DARK, { up: forward }),
    part(lathe(arc(R - 0.004, OPEN, 0, 7), 28), glass('#ffe2b0', 0.16), { up: forward }),
    part(torus(R * Math.sin(OPEN * DEG), 0.028, 1.1), GOLD, { at: [0, forward[1] * rimAt, forward[2] * rimAt], up: forward }),
    // Shine on the glass.
    lit(patch(R - 0.002, 6, [20, 42], { round: 1, turn: -30, steps: [3, 5] }), WHITE),
    lit(patch(R - 0.002, 4, [8, 15], { round: 1, turn: -37, steps: [2, 3] }), WHITE),
    // A stripe over the top, from the brow to the back.
    part(patch(R + 0.004, 66, [-9, 9], { round: 0.4, depth: 0.008 }), CREAM, { rot: [-130, 0, 90] }),
    // The face: big eyes, blush, a smile, and hair with a fringe.
    part(sphere(0.185, 1.2), SKIN, { at: face }),
    part(lathe(arc(0.192, 82, 0, 8), 20), HAIR, { at: face, up: [0, 1, -0.5] }),
    part(sphere(0.06, 0.8), HAIR, { at: onFace(0.03, 0.105, 0.14), scale: [1.5, 0.55, 0.7], rot: [0, 0, -12] }),
    // Both eyes are one node: squashing it is a blink.
    node('eyes', { at: onFace(0, 0.005, 0.172) }, ...SIDES.flatMap((s) => [
      part(sphere(0.036, 0.7), EYE, { at: [0.066 * s, 0, 0], scale: [0.82, 1.2, 0.5] }),
      lit(sphere(0.011, 0.6), WHITE, { at: [0.066 * s + 0.012, 0.017, 0.016] }),
    ])),
    ...SIDES.flatMap((s) => [
      part(sphere(0.026, 0.6), PINK, { at: onFace(0.119 * s, -0.05, 0.134), scale: [1.2, 0.8, 0.25], face: [0.64 * s, -0.27, 0.72] }),
      // Ear pods with a light.
      part(barrel(0.07, 0.08, 0.05, 0.02, 1.34), CREAM, { at: [s * (R - 0.005), -0.02, -0.02], up: [s, 0, 0] }),
      lit(sphere(0.026), CYAN, { at: [s * (R + 0.018), -0.02, -0.02], scale: [0.4, 1, 1] }),
    ]),
    part(tube([onFace(-0.03, -0.055, 0.178), onFace(0, -0.068, 0.177), onFace(0.03, -0.055, 0.178)], 0.0065, 0.5), MOUTH),
    // Antenna with a glowing ball.
    node('antenna', { at: [-0.099, 0.234, -0.052] },
      bar([0, 0, 0], [-0.051, 0.166, -0.033], 0.012, DARK),
      ...beam(sphere(0.036, 0.7), sphere(0.062, 0.6), WARM, { at: [-0.054, 0.176, -0.035] })),
  );

  const head = node('head', { at: [0, 0.4, 0] },
    part(barrel(0.09, 0.1, 0.07, 0.01), DARK),
    helmet,
  );

  // The pack: a round shell with a glowing ring, two hoses, thrusters, a
  // bedroll on top and a sensor orb on an arm over the left shoulder.
  const back = { up: [0, 0, -1] } as const;
  const backpack = node('backpack', { at: [0, 0.16, -0.19] },
    part(sphere(0.21, 1.2), BLUE_DEEP, { at: [0, 0, -0.04], scale: [1, 1.05, 0.72] }),
    part(barrel(0.11, 0.122, 0.03, 0.012, 1.34), CREAM, { at: [0, 0, -0.185], ...back }),
    ...beam(torus(0.07, 0.016, 1.2), torus(0.072, 0.028, 0.8), CYAN, { at: [0, 0, -0.202], ...back }),
    part(sphere(0.042, 0.6), GOLD, { at: [0, 0, -0.2], scale: [1, 1, 0.5] }),
    part(capsule(0.06, 0.4), CREAM, { at: [0, 0.245, -0.05], up: [1, 0, 0] }),
    ...SIDES.flatMap((s) => [
      part(torus(0.062, 0.012), ORANGE, { at: [0.1 * s, 0.245, -0.05], up: [1, 0, 0] }),
      part(tube([[0.09 * s, -0.17, -0.08], [0.2 * s, -0.13, -0.09], [0.255 * s, -0.02, -0.09], [0.23 * s, 0.09, -0.08], [0.14 * s, 0.13, -0.06]], 0.026, 0.6), DARK),
      part(barrel(0.04, 0.06, 0.07, 0.01), DARK, { at: [0.085 * s, -0.225, -0.05] }),
      lit(sphere(0.045, 0.6), WARM, { at: [0.085 * s, -0.258, -0.05], scale: [1, 0.3, 1] }),
    ]),
    part(tube([[0.15, 0.13, -0.08], [0.24, 0.2, -0.09], [0.295, 0.29, -0.07], [0.305, 0.36, -0.045]], 0.016, 0.7), DARK),
    node('orb', { at: [0.31, 0.42, -0.04] },
      part(sphere(0.07, 0.9), CREAM),
      part(torus(0.07, 0.011), BLUE, { up: [0.12, 1, -0.15] }),
      ...beam(sphere(0.034, 0.7), sphere(0.05, 0.6), CYAN, { at: [0, 0, 0.058], scale: [1, 1, 0.45] })),
  );

  const chest = node('chest', { at: [0, 0.1, 0] },
    part(lathe([[0.19, -0.11], [0.228, 0], [0.222, 0.14], [0.182, 0.27], [0.125, 0.345], [0.09, 0.37]], 24, 12), BLUE, { scale: [1, 1, 0.9] }),
    // Chest light.
    part(barrel(0.06, 0.07, 0.03, 0.012, 1.34), CREAM, { at: [0, 0.17, 0.196], up: [0, 0.15, 1] }),
    ...beam(sphere(0.044, 0.7), sphere(0.066, 0.6), CYAN, { at: [0, 0.172, 0.21], scale: [1, 1, 0.4] }),
    // Scarf, knotted at the front with two tails.
    part(lathe([[0.11, -0.04], [0.17, -0.036], [0.192, -0.005], [0.176, 0.03], [0.12, 0.042]], 22, 9), ORANGE, { at: [0, 0.36, 0], rot: [8, 0, 0] }),
    part(sphere(0.046, 0.7), ORANGE, { at: [-0.075, 0.335, 0.168] }),
    node('scarf_tails', { at: [-0.075, 0.335, 0.168] },
      bar([-0.005, -0.015, 0.007], [-0.04, -0.135, 0.037], 0.03, ORANGE, { scale: [1, 1, 0.5] }),
      bar([0.007, -0.015, 0.01], [0.025, -0.115, 0.044], 0.027, ORANGE, { scale: [1, 1, 0.5] })),
    arm('l'),
    arm('r'),
    head,
    backpack,
  );

  const body = node('body', { at: [0, 0.6, 0] },
    part(sphere(0.2, 1.2), BLUE, { scale: [1.12, 0.72, 0.92] }),
    // Belt with a round buckle, a pouch and a canteen.
    part(lathe([[0.218, -0.032], [0.236, -0.024], [0.236, 0.024], [0.218, 0.032]], 24), DARK, { at: [0, 0.07, 0], scale: [1, 1, 0.9] }),
    part(barrel(0.046, 0.052, 0.03, 0.012), GOLD, { at: [0, 0.07, 0.212], up: [0, 0, 1] }),
    lit(sphere(0.026), CYAN, { at: [0, 0.07, 0.224], scale: [1, 1, 0.4] }),
    part(box(0.1, 0.11, 0.07, 0.03), CREAM, { at: [-0.165, 0.035, 0.135], rot: [0, -42, 0] }),
    part(box(0.106, 0.045, 0.076, 0.02), ORANGE, { at: [-0.166, 0.075, 0.136], rot: [0, -42, 0] }),
    part(sphere(0.012, 0.6), GOLD, { at: [-0.19, 0.058, 0.164] }),
    part(capsule(0.045, 0.14), CREAM, { at: [0.2, 0.02, 0.1], rot: [0, 0, 8] }),
    part(barrel(0.022, 0.026, 0.03, 0.006), ORANGE, { at: [0.191, 0.097, 0.1], rot: [0, 0, 8] }),
    chest,
    leg('l'),
    leg('r'),
  );

  const root = node('hero_cartoon', {}, body);
  return model(root, clips(root));
}

// ---------------------------------------------------------------------------
// Clips
// ---------------------------------------------------------------------------
// The clips stay on the spot: the game moves the character. The one
// exception is the hop of Jump, Victory and Defeat, which is the position
// track of `body`; a game that lifts the character itself can drop it.

/** From the hip to the knee, and from the knee to the ankle, in metres. */
const THIGH = 0.2;
const SHIN = 0.22;

/**
 * A crouch with the thighs that many degrees forward and the feet flat
 * under the hips: the angles of each joint and how far the hips drop.
 */
function squat(thigh: number) {
  const a = thigh * DEG;
  const c = Math.asin(Math.min((THIGH * Math.sin(a)) / SHIN, 1));
  return {
    leg: -thigh,
    shin: (a + c) / DEG,
    foot: -c / DEG,
    drop: THIGH * (1 - Math.cos(a)) + SHIN * (1 - Math.cos(c)),
  };
}

/** 0 most of the time, a quick bump to 1 between two phases: a blink. */
function bump(phase: number, from: number, to: number): number {
  if (phase <= from || phase >= to) return 0;
  return Math.sin(((phase - from) / (to - from)) * Math.PI);
}

function clips(root: THREE.Group): THREE.AnimationClip[] {
  const { rot, mov, scl } = rig(root);
  const wave = (p: number, shift = 0) => Math.sin((p + shift) * TAU);
  /** 1 when the left leg is at the front of its stride, -1 at the back. */
  const stride = (p: number) => Math.cos(p * TAU);
  /** Above 0 while the left leg is in the air, coming forward. */
  const lifted = (p: number) => Math.max(0, -Math.sin(p * TAU));
  /** The same keys for both sides, with the sideways angles mirrored. */
  const both = (name: string, keys: Key[]) => SIDES.map((s) =>
    rot(`${name}_${s > 0 ? 'l' : 'r'}`, poses(...keys.map(([t, value, ease]) => {
      const [x, y, z] = typeof value === 'number' ? [value, 0, 0] : value;
      return [t, [x, y * s, z * s], ease ?? 'inOut'] as const;
    }))));

  // Idle: breathing, a slow look around, a blink now and then.
  const idle = animation('Idle', 3.6, [
    scl('chest', loop((p) => [1 + 0.012 * wave(p * 2), 1 + 0.018 * wave(p * 2), 1 + 0.02 * wave(p * 2)])),
    rot('body', loop((p) => [0, 2.5 * wave(p, 0.1), 1.2 * wave(p)])),
    rot('leg_l', loop((p) => [0, 0, -1.2 * wave(p)])),
    rot('leg_r', loop((p) => [0, 0, -1.2 * wave(p)])),
    rot('head', loop((p) => [2 * wave(p * 2, 0.3), 9 * wave(p, 0.15), 2 * wave(p)])),
    rot('arm_l', loop((p) => [3 * wave(p, 0.2), 0, 2 + 2 * wave(p * 2)])),
    rot('arm_r', loop((p) => [-3 * wave(p, 0.2), 0, -2 - 2 * wave(p * 2)])),
    rot('forearm_l', loop((p) => [-4 - 3 * wave(p, 0.3), 0, 0])),
    rot('forearm_r', loop((p) => [-4 + 3 * wave(p, 0.3), 0, 0])),
    rot('antenna', loop((p) => [4 * wave(p * 2), 0, 7 * wave(p * 2, 0.2)])),
    rot('scarf_tails', loop((p) => [3 * wave(p * 2), 0, 3 * wave(p)])),
    mov('orb', loop((p) => [0, 0.012 * wave(p * 2, 0.1), 0])),
    rot('orb', loop((p) => [0, 18 * wave(p), 0])),
    scl('eyes', loop((p) => [1, 1 - 0.9 * Math.max(bump(p, 0.42, 0.47), bump(p, 0.9, 0.95)), 1])),
  ]);

  // Walk: a waddle. The body dips when a foot lands and rolls over the leg
  // that carries it; arms swing against the legs.
  const STEP = 24;
  const walkLegs = [
    mov('body', loop((p) => [0, 0.006 - 0.034 * stride(p) ** 2, 0])),
    rot('body', loop((p) => [3, -5 * stride(p), -2.5 * wave(p)])),
    scl('chest', loop((p) => [1, 1 - 0.015 * stride(p * 2), 1])),
    rot('leg_l', loop((p) => [-3 - STEP * stride(p), 0, 0])),
    rot('leg_r', loop((p) => [-3 + STEP * stride(p), 0, 0])),
    rot('shin_l', loop((p) => [46 * lifted(p), 0, 0])),
    rot('shin_r', loop((p) => [46 * lifted(p + 0.5), 0, 0])),
    rot('foot_l', loop((p) => [14 * stride(p) - 46 * lifted(p), 0, 0])),
    rot('foot_r', loop((p) => [-14 * stride(p) - 46 * lifted(p + 0.5), 0, 0])),
    mov('backpack', loop((p) => [0, 0.008 * wave(p * 2, 0.3), 0])),
    rot('antenna', loop((p) => [10 * wave(p * 2, 0.15), 0, 6 * wave(p)])),
    rot('scarf_tails', loop((p) => [-4 + 8 * wave(p * 2, 0.2), 0, 5 * wave(p, 0.1)])),
    mov('orb', loop((p) => [0, 0.015 * wave(p * 2, 0.3), 0])),
    rot('orb', loop((p) => [6 * wave(p * 2, 0.4), 0, 0])),
  ];
  const walk = animation('Walk', 0.9, [
    ...walkLegs,
    rot('chest', loop((p) => [0, 9 * stride(p), 1.5 * wave(p)])),
    rot('head', loop((p) => [-3 + 2 * stride(p * 2), -4 * stride(p), wave(p)])),
    rot('arm_l', loop((p) => [28 * stride(p), 0, 4])),
    rot('arm_r', loop((p) => [-28 * stride(p), 0, -4])),
    rot('forearm_l', loop((p) => [-12 - 12 * Math.max(0, -stride(p)), 0, 0])),
    rot('forearm_r', loop((p) => [-12 - 12 * Math.max(0, stride(p)), 0, 0])),
  ]);

  // Run: leaning in, knees high, elbows bent, in the air at each stride.
  const STRIDE = 40;
  /**
   * The ankle through a running stride: the sole level until the leg passes
   * under the hips, up on the toes at the push, loose while in the air.
   */
  const runFoot = (phase: number): number => {
    const p = phase - Math.floor(phase);
    if (p >= 0.5) return -15 + 70 * (p - 0.5);
    const push = p < 0.25 ? 0 : 45 * ((p - 0.25) / 0.25) ** 2;
    return push - (20 - STRIDE * stride(p));
  };
  const runLegs = [
    mov('body', loop((p) => [0, 0.015 + 0.03 * stride(p * 2), 0])),
    rot('body', loop((p) => [13, -8 * stride(p), -2 * wave(p)])),
    scl('chest', loop((p) => [1, 1 + 0.02 * stride(p * 2), 1])),
    rot('leg_l', loop((p) => [-11 - STRIDE * stride(p), 0, 0])),
    rot('leg_r', loop((p) => [-11 + STRIDE * stride(p), 0, 0])),
    rot('shin_l', loop((p) => [18 + 72 * lifted(p), 0, 0])),
    rot('shin_r', loop((p) => [18 + 72 * lifted(p + 0.5), 0, 0])),
    rot('foot_l', loop((p) => [runFoot(p), 0, 0])),
    rot('foot_r', loop((p) => [runFoot(p + 0.5), 0, 0])),
    mov('backpack', loop((p) => [0, 0.012 * wave(p * 2, 0.35), 0])),
    rot('antenna', loop((p) => [-22 + 8 * wave(p * 2), 0, 5 * wave(p)])),
    rot('scarf_tails', loop((p) => [-14 + 10 * wave(p * 2), 0, 12 * wave(p * 2, 0.3)])),
    mov('orb', loop((p) => [0, 0.02 * wave(p * 2, 0.4), -0.015])),
    rot('orb', loop((p) => [10, 0, 6 * wave(p)])),
  ];
  const run = animation('Run', 0.56, [
    ...runLegs,
    rot('chest', loop((p) => [2, 14 * stride(p), 0])),
    rot('head', loop((p) => [-11 + 2 * stride(p * 2), -6 * stride(p), 0])),
    rot('arm_l', loop((p) => [42 * stride(p), 0, 7])),
    rot('arm_r', loop((p) => [-42 * stride(p), 0, -7])),
    rot('forearm_l', loop((p) => [-70 - 10 * Math.max(0, -stride(p)), 0, 0])),
    rot('forearm_r', loop((p) => [-70 - 10 * Math.max(0, stride(p)), 0, 0])),
  ]);

  // Aiming: the right elbow out to the side and the forearm level, so the
  // weapon points ahead and shows from behind, beside the body; the left
  // hand comes up in front of the chest and the right shoulder leads. These
  // tracks only move the chest, the head and the arms, so they sit on top of
  // any pair of legs. `lean` is how far the body tips forward, which the
  // forearm has to cancel; `bounce` is how much the stride shakes the aim.
  const AIM = { arm: [-55, 0, -40], chest: 10, head: -8 } as const;
  const turn = (x: number, y: number, z: number) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x * DEG, y * DEG, z * DEG));
  /** The turn of the forearm that leaves it level and pointing ahead. */
  const levelForearm = (lean: number): [number, number, number] => {
    const carried = turn(lean, 0, 0).multiply(turn(0, AIM.chest, 0));
    const upper = root.getObjectByName('arm_r')!.quaternion.clone().multiply(turn(...AIM.arm));
    const rest = root.getObjectByName('forearm_r')!.quaternion;
    // Level: the forearm runs along +Z and the front of the hand faces up.
    const local = rest.clone().invert().multiply(upper.invert()).multiply(carried.invert()).multiply(turn(-90, 0, 0));
    const angles = new THREE.Euler().setFromQuaternion(local, 'XYZ');
    return [angles.x / DEG, angles.y / DEG, angles.z / DEG];
  };
  const aiming = (lean: number, bounce: number): Track[] => {
    const [fx, fy, fz] = levelForearm(lean);
    return [
      rot('chest', loop((p) => [0, AIM.chest + bounce * 2 * stride(p), 0])),
      rot('head', loop((p) => [-2 - lean * 0.6, AIM.head - bounce * 2 * stride(p), 0])),
      rot('arm_r', loop((p) => [AIM.arm[0] + wave(p * 2) * (0.5 + bounce), AIM.arm[1], AIM.arm[2]])),
      rot('forearm_r', loop((p) => [fx + bounce * 2 * wave(p * 2, 0.2), fy, fz])),
      rot('arm_l', loop((p) => [-48 - lean + bounce * 3 * wave(p * 2, 0.1), 0, -14])),
      rot('forearm_l', loop(() => [-62, 0, 0])),
    ];
  };
  const aim = animation('Aim', 1.8, [
    scl('chest', loop((p) => [1 + 0.01 * wave(p), 1 + 0.015 * wave(p), 1 + 0.015 * wave(p)])),
    ...aiming(0, 0),
    rot('antenna', loop((p) => [3 * wave(p), 0, 5 * wave(p, 0.2)])),
    rot('scarf_tails', loop((p) => [2 * wave(p), 0, 2 * wave(p, 0.3)])),
    mov('orb', loop((p) => [0, 0.01 * wave(p, 0.1), 0])),
    scl('eyes', loop((p) => [1, 0.86 - 0.76 * bump(p, 0.6, 0.68), 1])),
  ]);
  const walkAim = animation('WalkAim', 0.9, [...walkLegs, ...aiming(3, 0.5)]);
  const runAim = animation('RunAim', 0.56, [...runLegs, ...aiming(15, 1)]);

  // Shoot: one shot, from the aim and back to it. The arm takes the kick.
  const [ax, ay, az] = AIM.arm;
  const [fx, fy, fz] = levelForearm(0);
  const shoot = animation('Shoot', 0.3, [
    rot('arm_r', poses([0, [ax, ay, az]], [0.05, [ax + 8, ay, az], 'snap'], [0.3, [ax, ay, az], 'back'])),
    rot('forearm_r', poses([0, [fx, fy, fz]], [0.05, [fx - 22, fy, fz], 'snap'], [0.3, [fx, fy, fz], 'back'])),
    rot('chest', poses([0, [0, AIM.chest, 0]], [0.05, [-4, AIM.chest - 4, 0], 'snap'], [0.3, [0, AIM.chest, 0]])),
    rot('head', poses([0, [-2, AIM.head, 0]], [0.06, [-6, AIM.head + 2, 0], 'snap'], [0.3, [-2, AIM.head, 0]])),
    scl('eyes', poses([0, [1, 0.86, 1]], [0.04, [1.1, 0.55, 1], 'snap'], [0.2, [1, 0.86, 1]], [0.3, [1, 0.86, 1]])),
  ]);

  // Jump: crouch, spring, tuck at the top, land with a squash.
  const deep = squat(50);
  const landing = squat(42);
  const tuck = squat(34);
  const jump = animation('Jump', 1.2, [
    mov('body', poses([0, [0, 0, 0]], [0.22, [0, -deep.drop, 0]], [0.34, [0, 0.09, 0], 'linear'], [0.6, [0, 0.5, 0], 'out'], [0.86, [0, 0, 0], 'in'], [0.95, [0, -landing.drop, 0], 'out'], [1.2, [0, 0, 0]])),
    ...both('leg', [[0, 0], [0.22, deep.leg], [0.34, 6, 'in'], [0.6, tuck.leg], [0.84, -8], [0.95, landing.leg, 'out'], [1.2, 0]]),
    ...both('shin', [[0, 0], [0.22, deep.shin], [0.34, 4, 'in'], [0.6, tuck.shin + 15], [0.84, 10], [0.95, landing.shin, 'out'], [1.2, 0]]),
    ...both('foot', [[0, 0], [0.22, deep.foot], [0.34, 28, 'in'], [0.6, 20], [0.84, -6], [0.95, landing.foot, 'out'], [1.2, 0]]),
    ...both('arm', [[0, 0], [0.22, [35, 0, 8]], [0.36, [-150, 0, 30], 'snap'], [0.6, [-125, 0, 40]], [0.86, [-60, 0, 30]], [0.95, [-20, 0, 14], 'out'], [1.2, 0]]),
    ...both('forearm', [[0, 0], [0.22, -25], [0.36, -5], [0.6, -15], [0.95, -35], [1.2, 0]]),
    rot('chest', poses([0, [0, 0, 0]], [0.22, [14, 0, 0]], [0.36, [-6, 0, 0], 'snap'], [0.6, [0, 0, 0]], [0.95, [12, 0, 0], 'out'], [1.2, [0, 0, 0]])),
    scl('chest', poses([0, 1], [0.22, [1.06, 0.9, 1.06]], [0.34, [0.95, 1.1, 0.95], 'snap'], [0.6, 1], [0.86, [0.96, 1.06, 0.96], 'in'], [0.95, [1.08, 0.88, 1.08], 'snap'], [1.08, [0.98, 1.03, 0.98]], [1.2, 1])),
    rot('head', poses([0, [0, 0, 0]], [0.22, [8, 0, 0]], [0.36, [-14, 0, 0], 'snap'], [0.6, [-4, 0, 0]], [0.86, [4, 0, 0]], [0.95, [12, 0, 0], 'out'], [1.2, [0, 0, 0]])),
    rot('antenna', poses([0, [0, 0, 0]], [0.22, [18, 0, 0]], [0.38, [-30, 0, -18], 'snap'], [0.6, [0, 0, 0]], [0.84, [14, 0, 12]], [0.95, [34, 0, 22], 'snap'], [1.08, [-12, 0, -10]], [1.2, [0, 0, 0], 'back'])),
    rot('scarf_tails', poses([0, [0, 0, 0]], [0.36, [10, 0, 0], 'snap'], [0.6, [-25, 0, 6]], [0.84, [-55, 0, 0]], [0.97, [14, 0, 0], 'snap'], [1.2, [0, 0, 0]])),
    mov('orb', poses([0, [0, 0, 0]], [0.36, [0, -0.03, 0], 'snap'], [0.6, [0, 0.01, 0]], [0.86, [0, 0.03, 0]], [0.97, [0, -0.03, 0], 'snap'], [1.2, [0, 0, 0], 'back'])),
    scl('eyes', poses([0, 1], [0.3, 1], [0.4, [1.06, 1.14, 1]], [0.84, [1.06, 1.14, 1]], [0.95, [1.12, 0.45, 1], 'snap'], [1.12, 1], [1.2, 1])),
  ]);

  // Hit: knocked back with the eyes shut, then straight again.
  const hit = animation('Hit', 0.5, [
    mov('body', poses([0, [0, 0, 0]], [0.09, [0, 0.02, -0.08], 'snap'], [0.3, [0, 0, -0.03]], [0.5, [0, 0, 0]])),
    rot('body', poses([0, [0, 0, 0]], [0.1, [-15, 0, 0], 'snap'], [0.3, [5, 0, 0]], [0.5, [0, 0, 0]])),
    ...both('leg', [[0, 0], [0.1, 15, 'snap'], [0.3, -5], [0.5, 0]]),
    rot('chest', poses([0, [0, 0, 0]], [0.1, [-9, 0, 0], 'snap'], [0.3, [4, 0, 0]], [0.5, [0, 0, 0]])),
    scl('chest', poses([0, 1], [0.08, [1.09, 0.9, 1.09], 'snap'], [0.26, [0.97, 1.04, 0.97]], [0.5, 1])),
    rot('head', poses([0, [0, 0, 0]], [0.1, [-20, 0, 0], 'snap'], [0.28, [10, 0, 0]], [0.5, [0, 0, 0]])),
    ...both('arm', [[0, 0], [0.1, [-35, 0, 50], 'snap'], [0.3, [-10, 0, 15]], [0.5, 0]]),
    ...both('forearm', [[0, 0], [0.1, -50, 'snap'], [0.3, -15], [0.5, 0]]),
    scl('eyes', poses([0, 1], [0.05, [1.2, 0.12, 1], 'snap'], [0.3, [1.2, 0.12, 1]], [0.42, 1], [0.5, 1])),
    rot('antenna', poses([0, [0, 0, 0]], [0.1, [38, 0, 12], 'snap'], [0.25, [-22, 0, -8]], [0.38, [8, 0, 0]], [0.5, [0, 0, 0]])),
    rot('scarf_tails', poses([0, [0, 0, 0]], [0.12, [-40, 0, 0], 'snap'], [0.32, [10, 0, 0]], [0.5, [0, 0, 0]])),
    mov('orb', poses([0, [0, 0, 0]], [0.1, [0, 0.03, 0.02], 'snap'], [0.3, [0, -0.01, 0]], [0.5, [0, 0, 0]])),
  ]);

  // Victory: a jump for joy, then the right hand held high with a bounce.
  const ready = squat(38);
  const soft30 = squat(30);
  const victory = animation('Victory', 2.4, [
    mov('body', poses([0, [0, 0, 0]], [0.22, [0, -ready.drop, 0]], [0.34, [0, 0.085, 0], 'linear'], [0.56, [0, 0.32, 0], 'out'], [0.78, [0, 0, 0], 'in'], [0.88, [0, -soft30.drop, 0], 'out'], [1.1, [0, 0, 0]], [1.3, [0, 0, 0]], [1.45, [0, 0.06, 0], 'out'], [1.6, [0, 0, 0], 'in'], [1.7, [0, 0, 0]], [1.85, [0, 0.06, 0], 'out'], [2, [0, 0, 0], 'in'], [2.4, [0, 0, 0]])),
    ...both('leg', [[0, 0], [0.22, ready.leg], [0.34, 5, 'in'], [0.56, [-28, 0, 14]], [0.78, -6], [0.88, soft30.leg, 'out'], [1.1, 0], [2.4, 0]]),
    ...both('shin', [[0, 0], [0.22, ready.shin], [0.34, 4, 'in'], [0.56, 58], [0.78, 8], [0.88, soft30.shin, 'out'], [1.1, 0], [2.4, 0]]),
    ...both('foot', [[0, 0], [0.22, ready.foot], [0.34, 26, 'in'], [0.56, 15], [0.78, -5], [0.88, soft30.foot, 'out'], [1.1, 0], [1.3, 0], [1.45, 18, 'out'], [1.6, 0, 'in'], [1.7, 0], [1.85, 18, 'out'], [2, 0, 'in'], [2.4, 0]]),
    rot('arm_r', poses([0, [0, 0, 0]], [0.22, [30, 0, -6]], [0.36, [-165, 0, -38], 'snap'], [0.78, [-160, 0, -34]], [0.88, [-150, 0, -30]], [1.1, [-168, 0, -36], 'back'], [1.45, [-172, 0, -30]], [1.6, [-160, 0, -40]], [1.85, [-172, 0, -30]], [2, [-162, 0, -38]], [2.4, [-165, 0, -36]])),
    rot('arm_l', poses([0, [0, 0, 0]], [0.22, [30, 0, 6]], [0.36, [-165, 0, 38], 'snap'], [0.78, [-160, 0, 34]], [0.9, [-40, 0, 25]], [1.15, [8, 0, 22], 'out'], [2.4, [6, 0, 20]])),
    rot('forearm_r', poses([0, [0, 0, 0]], [0.36, [-10, 0, 0]], [1.1, [-28, 0, 0]], [1.45, [-18, 0, 0]], [1.6, [-34, 0, 0]], [1.85, [-18, 0, 0]], [2, [-34, 0, 0]], [2.4, [-28, 0, 0]])),
    rot('forearm_l', poses([0, [0, 0, 0]], [0.36, [-10, 0, 0]], [1.15, [-35, 0, 0]], [2.4, [-35, 0, 0]])),
    rot('chest', poses([0, [0, 0, 0]], [0.22, [12, 0, 0]], [0.36, [-8, 0, 0], 'snap'], [0.88, [10, 0, 0]], [1.1, [-6, 0, 3], 'back'], [2.4, [-6, 0, 3]])),
    scl('chest', poses([0, 1], [0.22, [1.06, 0.91, 1.06]], [0.34, [0.95, 1.1, 0.95], 'snap'], [0.56, 1], [0.88, [1.07, 0.9, 1.07], 'snap'], [1.1, 1], [2.4, 1])),
    rot('head', poses([0, [0, 0, 0]], [0.22, [8, 0, 0]], [0.36, [-14, 0, 0], 'snap'], [0.88, [8, 0, 0]], [1.1, [-8, 0, 9], 'back'], [1.45, [-10, 6, 7]], [1.85, [-10, -4, 9]], [2.4, [-8, 0, 9]])),
    scl('eyes', poses([0, 1], [0.3, 1], [0.4, [1.08, 1.15, 1]], [0.8, [1.08, 1.15, 1]], [0.88, [1.12, 0.5, 1], 'snap'], [1.1, [1.05, 1.1, 1]], [1.64, [1.05, 1.1, 1]], [1.7, [1.1, 0.12, 1], 'snap'], [1.78, [1.05, 1.1, 1]], [2.4, [1.05, 1.1, 1]])),
    rot('antenna', poses([0, [0, 0, 0]], [0.36, [-20, 0, -15], 'snap'], [0.56, [10, 0, 10]], [0.88, [25, 0, 20], 'snap'], [1.1, [-10, 0, -12]], [1.3, [6, 0, 8]], [1.45, [-12, 0, 0]], [1.6, [10, 0, 0]], [1.85, [-12, 0, 0]], [2, [8, 0, 0]], [2.4, [0, 0, 0]])),
    rot('scarf_tails', poses([0, [0, 0, 0]], [0.36, [10, 0, 0], 'snap'], [0.56, [-30, 0, 8]], [0.78, [-55, 0, 0]], [0.9, [15, 0, 0], 'snap'], [1.1, [0, 0, 0]], [1.45, [-10, 0, 0]], [1.6, [4, 0, 0]], [1.85, [-10, 0, 0]], [2, [4, 0, 0]], [2.4, [0, 0, 0]])),
    rot('orb', poses([0, [0, 0, 0]], [0.36, [0, 0, 0]], [0.6, [0, 120, 0], 'linear'], [0.85, [0, 240, 0], 'linear'], [1.1, [0, 360, 0], 'out'], [2.4, [0, 360, 0]])),
    mov('orb', poses([0, [0, 0, 0]], [0.6, [0, 0.03, 0]], [1.1, [0, 0, 0]], [1.45, [0, 0.02, 0]], [1.6, [0, 0, 0]], [1.85, [0, 0.02, 0]], [2, [0, 0, 0]], [2.4, [0, 0, 0]])),
  ]);

  // Defeat: a stagger, the feet slip forward, a bump onto the ground, a slump.
  const weak = squat(14);
  const weaker = squat(24);
  const SIT = -0.42;
  const defeat = animation('Defeat', 2.4, [
    mov('body', poses([0, [0, 0, 0]], [0.1, [0, 0.01, -0.06], 'snap'], [0.45, [0.02, -weak.drop, -0.04]], [0.8, [-0.02, -weaker.drop, -0.05]], [0.95, [0, 0.06, -0.08], 'out'], [1.16, [0, SIT, -0.1], 'in'], [1.26, [0, SIT + 0.035, -0.1], 'out'], [1.38, [0, SIT, -0.1], 'in'], [2.4, [0, SIT, -0.1]])),
    rot('body', poses([0, [0, 0, 0]], [0.1, [-13, 0, 0], 'snap'], [0.45, [4, 0, 3.5]], [0.8, [-4, 0, -4]], [0.95, [-16, 0, 0]], [1.16, [-6, 0, 0]], [1.4, [0, 0, 0]], [2.4, [0, 0, 0]])),
    ...both('leg', [[0, 0], [0.1, 13, 'snap'], [0.45, weak.leg], [0.8, weaker.leg], [0.95, [-60, 0, 3]], [1.05, [-88, 0, 6]], [2.4, [-88, 0, 6]]]),
    ...both('shin', [[0, 0], [0.45, weak.shin], [0.8, weaker.shin], [0.95, 30], [1.05, 4], [1.16, 0], [2.4, 0]]),
    ...both('foot', [[0, 0], [0.45, weak.foot], [0.8, weaker.foot], [0.95, -10], [1.16, -12], [2.4, -12]]),
    rot('chest', poses([0, [0, 0, 0]], [0.1, [-8, 0, 0], 'snap'], [0.45, [6, 0, -5]], [0.8, [-3, 0, 6]], [0.95, [-12, 0, 0]], [1.16, [14, 0, 0], 'in'], [1.3, [6, 0, 0]], [2, [15, 0, 3]], [2.4, [15, 0, 3]])),
    scl('chest', poses([0, 1], [1.1, 1], [1.18, [1.08, 0.9, 1.08], 'snap'], [1.4, 1], [2.4, 1])),
    rot('head', poses([0, [0, 0, 0]], [0.1, [-18, 0, 0], 'snap'], [0.45, [6, -8, 6]], [0.8, [-4, 10, -8]], [0.95, [-20, 0, 0]], [1.16, [18, 0, 0], 'in'], [1.3, [4, 0, 0]], [2, [17, 0, 7]], [2.4, [17, 0, 7]])),
    ...both('arm', [[0, 0], [0.1, [-30, 0, 45], 'snap'], [0.45, [10, 0, 20]], [0.8, [-15, 0, 30]], [0.95, [-70, 0, 35]], [1.16, [-20, 0, 18], 'in'], [2, [-18, 0, 6]], [2.4, [-18, 0, 6]]]),
    ...both('forearm', [[0, 0], [0.1, -45, 'snap'], [0.8, -25], [1.16, -30], [2, -12], [2.4, -12]]),
    scl('eyes', poses([0, 1], [0.05, [1.15, 0.12, 1], 'snap'], [0.22, [1.15, 0.12, 1]], [0.32, [1.1, 1.05, 1]], [1.08, [1.1, 1.1, 1]], [1.14, [1.2, 0.1, 1], 'snap'], [1.7, [1, 0.1, 1]], [2.05, [1, 0.32, 1]], [2.4, [1, 0.32, 1]])),
    rot('antenna', poses([0, [0, 0, 0]], [0.1, [30, 0, 0], 'snap'], [0.45, [-10, 0, 15]], [0.8, [8, 0, -15]], [1.16, [35, 0, 10], 'snap'], [1.4, [10, 0, 0]], [2.1, [55, 0, 25]], [2.4, [55, 0, 25]])),
    rot('scarf_tails', poses([0, [0, 0, 0]], [0.95, [-10, 0, 0]], [1.12, [-50, 0, 0]], [1.2, [20, 0, 0], 'snap'], [1.4, [0, 0, 0]], [2.4, [0, 0, 0]])),
    mov('orb', poses([0, [0, 0, 0]], [1.16, [0, 0.03, 0]], [1.3, [0, -0.02, 0]], [2, [0, -0.035, 0.02]], [2.4, [0, -0.035, 0.02]])),
    rot('orb', poses([0, [0, 0, 0]], [1.3, [0, 0, 0]], [2, [25, -25, 0]], [2.4, [25, -25, 0]])),
  ]);

  return [idle, walk, run, jump, hit, victory, defeat, aim, walkAim, runAim, shoot];
}

export const heroCartoon: ModelEntry = { id: 'hero-cartoon', name: 'Hero · cartoon', type: 'player', create };
