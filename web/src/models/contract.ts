// The naming contract every model shares with the game: which nodes and clips
// each type must have, how many triangles it may use, which clips loop, and
// the planet values a model may change with. See prompts-characters.md,
// part 2.
//
// Pure data, no Three.js: the tests load this file in Node.

export type ModelType = 'player' | 'npc' | 'enemy' | 'guardian' | 'fauna' | 'weapon' | 'shot' | 'ship' | 'prop';

export interface TypeContract {
  /** Node names the game looks up to attach things or aim at. */
  nodes: readonly string[];
  /** Clip names the game plays. */
  clips: readonly string[];
  /** Triangles of the model itself; the outline pass is not counted. */
  maxTriangles: number;
}

export const CONTRACT: Record<ModelType, TypeContract> = {
  player: {
    // `hold` sits inside `hand_r`: a weapon added to it lands in the palm.
    nodes: ['body', 'chest', 'head', 'leg_l', 'leg_r', 'hand_r', 'hold'],
    clips: ['Idle', 'Walk', 'Run', 'Jump', 'Hit', 'Victory', 'Defeat'],
    maxTriangles: 30_000,
  },
  npc: {
    nodes: ['body', 'head'],
    clips: ['Idle', 'Talk', 'Wave'],
    maxTriangles: 12_000,
  },
  enemy: {
    nodes: ['body'],
    clips: ['Idle', 'Move', 'Attack', 'Hit', 'Die'],
    maxTriangles: 8_000,
  },
  guardian: {
    nodes: ['body', 'weak_point'],
    clips: ['Idle', 'Wake', 'Move', 'Attack', 'Hit', 'Die'],
    maxTriangles: 30_000,
  },
  // Peaceful animals that live on the open land: they graze, wander and
  // fly, and never attack. `Move` is their walk (or flight) in place.
  fauna: {
    nodes: ['body', 'head'],
    clips: ['Idle', 'Move'],
    maxTriangles: 8_000,
  },
  // A weapon is held by the foot of its grip, which is its origin, and
  // shoots along +Z: the shot leaves from `muzzle`. `Fire` is one shot.
  weapon: {
    nodes: ['muzzle'],
    clips: ['Fire'],
    maxTriangles: 4_000,
  },
  // What a weapon shoots. Its origin is its centre and it flies along +Z.
  // `Fly` loops while it travels; `Burst` is what it does when it hits, and
  // ends with nothing left to see. `weapon-x` shoots `shot-x`.
  shot: {
    nodes: [],
    clips: ['Fly', 'Burst'],
    maxTriangles: 800,
  },
  // The player's ship, as web/src/content/flight.ts flies it: its origin is
  // on the ground under it and its nose points along +Z. At rest it is
  // landed. `engine` is the main exhaust, which the game scales with speed;
  // `rune` holds the jump rune, shown while the player has one. `Takeoff`
  // and `Land` end in the pose of `Fly` and `Idle`.
  ship: {
    nodes: ['body', 'engine', 'rune'],
    clips: ['Idle', 'Takeoff', 'Fly', 'Land'],
    maxTriangles: 20_000,
  },
  prop: {
    nodes: [],
    clips: [],
    maxTriangles: 12_000,
  },
};

/** Clips that play in a loop: their last frame must match the first. */
export const LOOP_CLIPS: readonly string[] = ['Idle', 'Walk', 'Run', 'Move', 'Talk'];

/** No clip lasts longer than this, in seconds. */
export const MAX_CLIP_SECONDS = 4;

/** A guardian is between 3 and 6 metres tall, so it reads from the door. */
export const GUARDIAN_HEIGHT = { min: 3, max: 6 } as const;

/** Types whose clips named Attack… must say when they warn and when they hit. */
export const TIMED_TYPES: readonly ModelType[] = ['enemy', 'guardian'];

/**
 * When an attack warns and when it hits, in seconds from the start of its
 * clip, so the game can apply damage on the right frame.
 */
export interface AttackTiming {
  /** The tell starts: the player can see the attack coming. */
  warn: number;
  /** The blow lands: damage is applied from here… */
  hit: number;
  /** …until here, when the attack is over and the model recovers. */
  end: number;
}

/**
 * What a model may read from the planet it is on. The game fills it from the
 * catalog (real values) and from derived values (gravity), never from
 * made-up figures.
 */
export interface PlanetLook {
  /** Planet name, as in the catalog. */
  name: string;
  /** Equilibrium temperature, in kelvin (catalog field pl_eqt). */
  eqTempK: number;
  /** Surface gravity in Earth g, derived as mass / radius². */
  gravityG: number;
  /** Temperature of the star, in kelvin (catalog field st_teff). */
  starTeffK: number;
  /** Radius of the planet, in Earth radii (catalog field pl_rade). */
  radiusEarth: number;
}

/**
 * The three planets that can be landed on, with the values the catalog gives
 * (web/public/data/exoplanets.csv). Gravity is derived from pl_bmasse and
 * pl_rade; the tests check these figures against the catalog.
 */
export const TRAPPIST_1: Record<'e' | 'b' | 'h', PlanetLook> = {
  e: { name: 'TRAPPIST-1 e', eqTempK: 249.7, gravityG: 0.82, starTeffK: 2566, radiusEarth: 0.92 },
  b: { name: 'TRAPPIST-1 b', eqTempK: 397.6, gravityG: 1.1, starTeffK: 2566, radiusEarth: 1.116 },
  h: { name: 'TRAPPIST-1 h', eqTempK: 171.7, gravityG: 0.57, starTeffK: 2566, radiusEarth: 0.755 },
};
