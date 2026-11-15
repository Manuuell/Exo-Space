// How a planet looks, from its real data: the colours of its ground, rock,
// sky and liquids, the shape of its land and what grows or stands on it.
// It follows the table of section 2 of lore-and-mechanics.md:
//
// | Planet data          | What it changes                                     |
// |----------------------|-----------------------------------------------------|
// | Temperature (pl_eqt) | Palette, tinted continuously: snow, moss, rust,     |
// |                      | basalt; the liquid (ice, water, lava); the scenery  |
// | Star (st_teff)       | Colour of the light, the sky and the glows          |
// | Gravity (derived)    | Height of the land: tall spires under low gravity,  |
// |                      | low flat mesas under high gravity                   |
// | Radius (pl_rade)     | Size of the globe seen from space                   |
//
// Nothing is a fixed biome: every colour and every shape is blended from the
// numbers, so two planets with different figures look different. The same
// planet always gives the same land: the seed is its name.
//
// Pure data, no Three.js: the tests load this file in Node. Units are metres.

import { rgbToHex, starColor } from '../data/derived.ts';
import type { PlanetLook } from './contract.ts';

export interface PlanetScenery {
  /** Weight of each kind of land, from the temperature; they add up to 1. */
  weights: { ice: number; moss: number; lava: number };
  /** Ground on the lowlands, the slopes and the heights; rock on cliffs. */
  ground: { low: string; high: string; peak: string; rock: string };
  /** What blooms, sparkles or burns: flowers, crystals, embers. */
  accent: string;
  /** The liquid in the low places, and the height it fills up to. */
  liquid: { kind: 'ice' | 'water' | 'lava'; colour: string; level: number; glows: boolean };
  /** The star's own colour, and the light it gives once through the air. */
  star: string;
  sun: string;
  /** Hemisphere fill: the sky's colour and the ground's. */
  fill: [string, string];
  /** Sky from the zenith to the horizon, and the black of space. */
  sky: { zenith: string; horizon: string; space: string };
  /** How far the haze lets you see, in metres. */
  haze: number;
  /** How high the land rises, in metres: higher under low gravity. */
  relief: number;
  /** Radius of the globe seen from space, in metres: a game scale, not the real one. */
  globeRadius: number;
}

/** A neutral planet, for missing values: an Earth around a Sun. */
const NEUTRAL = { eqTempK: 280, gravityG: 1, starTeffK: 5772, radiusEarth: 1 };
const usable = (value: number | null | undefined, fallback: number) => (value !== null && value !== undefined && Number.isFinite(value) && value > 0 ? value : fallback);

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const smooth = (edge0: number, edge1: number, x: number) => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

// --- Colours -----------------------------------------------------------------

type Rgb = [number, number, number];
const toRgb = (hex: string): Rgb => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as Rgb;
const toHex = (rgb: Rgb) => `#${rgb.map((c) => Math.round(clamp(c, 0, 1) * 255).toString(16).padStart(2, '0')).join('')}`;

/** Mixes two colours: 0 gives the first, 1 the second. */
export function mix(a: string, b: string, t: number): string {
  const [x, y] = [toRgb(a), toRgb(b)];
  return toHex(x.map((c, i) => c + (y[i] - c) * t) as Rgb);
}

/** A colour read off a ramp of [temperature, colour] stops, blended between them. */
function ramp(stops: readonly (readonly [number, string])[], temperature: number): string {
  if (temperature <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    const [t1, c1] = stops[i];
    const [t0, c0] = stops[i - 1];
    if (temperature <= t1) return mix(c0, c1, (temperature - t0) / (t1 - t0));
  }
  return stops[stops.length - 1][1];
}

const LOWLAND = [[150, '#dfe9f2'], [200, '#bcd2e3'], [235, '#5f9a86'], [262, '#6c9a4a'], [300, '#9a9852'], [340, '#a87c4c'], [400, '#7c4030'], [600, '#3c2b2b'], [1200, '#2a1c1c']] as const;
const HIGHLAND = [[150, '#c5d8ea'], [200, '#9fbad6'], [240, '#4f7f5c'], [300, '#8a8452'], [360, '#8c5a3c'], [420, '#5a3530'], [1200, '#241818']] as const;
const ROCK = [[150, '#8fb0d4'], [230, '#7f7f9c'], [300, '#8a7466'], [400, '#4a3434'], [1200, '#1f1717']] as const;
const ACCENT = [[150, '#7fe0ff'], [210, '#9fe8ff'], [240, '#ff8fc4'], [300, '#ffb347'], [360, '#ff6a2a'], [1200, '#ff4a1a']] as const;

/** Weights of the three kinds of land: ice when cold, moss when temperate, lava when hot. */
export function landWeights(temperature: number): PlanetScenery['weights'] {
  const ice = 1 - smooth(195, 235, temperature);
  const lava = smooth(320, 375, temperature);
  return { ice, lava, moss: Math.max(0, 1 - ice - lava) };
}

export function planetScenery(planet: Partial<PlanetLook>): PlanetScenery {
  const temperature = usable(planet.eqTempK, NEUTRAL.eqTempK);
  const gravity = usable(planet.gravityG, NEUTRAL.gravityG);
  const radius = usable(planet.radiusEarth, NEUTRAL.radiusEarth);
  const star = starColor({ st_teff: usable(planet.starTeffK, NEUTRAL.starTeffK) });
  const starHex = star ? rgbToHex(star) : '#ffffff';
  const weights = landWeights(temperature);

  const low = ramp(LOWLAND, temperature);
  const high = ramp(HIGHLAND, temperature);
  const rock = ramp(ROCK, temperature);
  // Snow on the peaks of cold and mild worlds; on hot ones, the rock itself.
  const peak = mix(mix(rock, '#f4f8fc', 1 - weights.lava), '#2a1e1e', weights.lava * 0.5);
  const accent = ramp(ACCENT, temperature);

  const liquid: PlanetScenery['liquid'] = weights.lava > 0.5
    ? { kind: 'lava', colour: mix('#ff5a1f', starHex, 0.2), level: -8, glows: true }
    : weights.ice > 0.5
      ? { kind: 'ice', colour: mix('#cfe8f5', '#9fd0ea', weights.moss), level: -10, glows: false }
      : { kind: 'water', colour: mix('#2f6f8a', '#24506a', weights.lava), level: -12, glows: false };

  // The sky: a deep zenith, a horizon lit by the star and the haze of the
  // ground; smoky on hot worlds, clear and dark on cold ones.
  const zenith = mix(mix('#1e2550', starHex, 0.12), '#2a1414', weights.lava * 0.6);
  const horizon = mix(mix(mix('#c9b4c4', starHex, 0.55), '#b85a3a', weights.lava * 0.7), '#c9d4ea', weights.ice * 0.25);

  return {
    weights,
    ground: { low, high, peak, rock },
    accent,
    liquid,
    star: starHex,
    sun: mix(starHex, '#ffffff', 0.4),
    fill: [mix(horizon, '#ffffff', 0.3), mix(low, '#000000', 0.45)],
    sky: { zenith, horizon, space: '#02030a' },
    haze: 3200 + 1600 * weights.ice - 1400 * weights.lava,
    relief: Math.round(110 / Math.pow(clamp(gravity, 0.3, 2), 0.8)),
    globeRadius: Math.round(20_000 * clamp(radius, 0.4, 2.5)),
  };
}

// --- The land ----------------------------------------------------------------

/** A seed from a planet's name. */
export function nameSeed(name: string): number {
  let h = 2166136261;
  for (const char of name) h = Math.imul(h ^ char.charCodeAt(0), 16777619);
  return h >>> 0;
}

/** A repeatable number from 0 to 1 for a point of a grid. */
export function hash2(ix: number, iz: number, seed: number): number {
  let h = Math.imul(ix | 0, 374761393) ^ Math.imul(iz | 0, 668265263) ^ Math.imul(seed | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Smooth noise from -1 to 1, with features about one unit wide. */
function noise(x: number, z: number, seed: number): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const u = fx * fx * (3 - 2 * fx);
  const v = fz * fz * (3 - 2 * fz);
  const a = hash2(ix, iz, seed);
  const b = hash2(ix + 1, iz, seed);
  const c = hash2(ix, iz + 1, seed);
  const d = hash2(ix + 1, iz + 1, seed);
  return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * 2 - 1;
}

/** Layers of noise, each finer and fainter: rolling land. From about -1 to 1. */
export function fbm(x: number, z: number, seed: number, octaves = 4): number {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise(x * freq, z * freq, seed + i * 101);
    freq *= 2.03;
    amp *= 0.5;
  }
  return sum;
}

/** Sharp ridges: 1 on the crest, falling to 0. */
function ridges(x: number, z: number, seed: number, octaves = 3): number {
  let sum = 0;
  let amp = 0.55;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    sum += amp * (1 - Math.abs(noise(x * freq, z * freq, seed + i * 37)));
    freq *= 2.1;
    amp *= 0.45;
  }
  return sum;
}

/** The flat ground around the landing site, where the ship starts. */
export const LANDING_FLAT = { inner: 60, outer: 200 };

/**
 * The valley around the landing site is the last place on the planet where
 * anyone can live. Beyond the ring of mountains the land is dead: scorched,
 * cracked and burning. The border wanders a little, so it is not a circle.
 */
export const LAST_VALLEY = { inner: 780, outer: 1000 };

/** 0 inside the last valley, rising to 1 in the wasteland beyond it. */
export function wasteland(planet: Partial<PlanetLook> & { name?: string }): (x: number, z: number) => number {
  const seed = nameSeed(planet.name ?? 'neutral') + 8111;
  return (x, z) => smooth(LAST_VALLEY.inner, LAST_VALLEY.outer, Math.hypot(x, z) + fbm(x / 600, z / 600, seed, 2) * 120);
}

/** Steps the land into flat terraces with cliffs between them, `step` metres high. */
function terrace(height: number, step: number): number {
  const t = height / step;
  const base = Math.floor(t);
  return (base + smooth(0.62, 0.8, t - base)) * step;
}

/**
 * The height of the land at a point, in metres. Temperate land rolls in
 * hills with mountain ranges and lakes; hot land stands in flat-topped mesas
 * cut by channels; cold land is smooth snow with sharp spires. Planets in
 * between mix them. Around the origin the land is flat, for the landing site.
 */
export function planetGround(planet: Partial<PlanetLook> & { name?: string }): (x: number, z: number) => number {
  const scenery = planetScenery(planet);
  const { ice, moss, lava } = scenery.weights;
  const relief = scenery.relief;
  const seed = nameSeed(planet.name ?? 'neutral');
  return (x, z) => {
    let height = 0;
    if (moss > 0.01) {
      // Rolling hills, tall mountain ranges, stepped plateaus with cliffs,
      // and river valleys cut below the water.
      const hills = fbm(x / 700, z / 700, seed) * relief * 0.6;
      // Ranges here and there, and always some around the landing site,
      // so there is something to climb and to look out from.
      const fromHome = Math.hypot(x, z);
      // A ring of mountains closes the valley about 600 m out.
      const home = smooth(430, 720, fromHome) * (1 - smooth(1700, 2800, fromHome));
      const range = Math.max(smooth(0, 0.4, fbm(x / 5200, z / 5200, seed + 7, 2)), home * 0.9);
      const mountains = ridges(x / 2200, z / 2200, seed + 13) ** 2 * relief * 5.2 * range;
      const plateaus = terrace(Math.max(0, fbm(x / 1500, z / 1500, seed + 17, 3)) * relief * 2.6, 34);
      const river = 1 - smooth(0, 0.06, Math.abs(noise(x / 2400, z / 2400, seed + 19)));
      height += moss * (hills + mountains + plateaus - river * (relief * 0.35 + 20));
    }
    if (lava > 0.01) {
      const plateau = smooth(0.08, 0.2, fbm(x / 1300, z / 1300, seed + 23, 3)) * relief * 0.85;
      const rough = fbm(x / 160, z / 160, seed + 29, 2) * 6;
      const channel = 1 - smooth(0, 0.07, Math.abs(noise(x / 1700, z / 1700, seed + 31)));
      height += lava * (plateau + rough - channel * 32 - 4);
    }
    if (ice > 0.01) {
      const snow = fbm(x / 1100, z / 1100, seed + 41, 3) * relief * 0.35;
      const spires = ridges(x / 700, z / 700, seed + 43) ** 4 * relief * 3.2;
      const field = smooth(-0.1, 0.35, fbm(x / 3800, z / 3800, seed + 47, 2));
      height += ice * (snow + spires * field);
    }
    // Flat around the landing site, rising gently into the land.
    const fromStart = Math.hypot(x, z);
    const rise = smooth(LANDING_FLAT.inner, LANDING_FLAT.outer, fromStart);
    return rise === 0 ? 0 : height * rise;
  };
}

// --- What stands on the land -------------------------------------------------

export type PropKind = 'tree' | 'bulbtree' | 'boulder' | 'crystal' | 'column' | 'vent' | 'spire' | 'pillar' | 'wall';

export interface Prop {
  kind: PropKind;
  x: number;
  z: number;
  /** Height of the prop, in metres. */
  size: number;
  /** Turn around the vertical, in radians. */
  yaw: number;
}

/** Side of the square cells props are scattered in, in metres. */
export const PROP_CELL = 400;

/** Kinds of prop and how many to a cell, for each kind of land. */
const SCATTER: Record<keyof PlanetScenery['weights'], readonly (readonly [PropKind, number, number, number])[]> = {
  // [kind, per cell, smallest, largest]
  // Trees are drawn by the forests (forestDensity); here: rocks, crystals
  // and the first colonists' ruins, broken pillars and walls.
  moss: [['boulder', 14, 2, 10], ['crystal', 2, 4, 12], ['pillar', 3, 4, 11], ['wall', 2.5, 3, 7]],
  lava: [['column', 4, 18, 60], ['vent', 1.5, 10, 26], ['boulder', 3, 6, 18]],
  ice: [['spire', 4, 30, 110], ['crystal', 3, 8, 26], ['boulder', 2, 5, 14]],
};

/**
 * The props of one cell of the land: always the same for the same planet
 * and cell. None stand on the landing site or in the liquid.
 */
export function propsInCell(planet: Partial<PlanetLook> & { name?: string }, ci: number, ck: number, ground = planetGround(planet)): Prop[] {
  const scenery = planetScenery(planet);
  const seed = nameSeed(planet.name ?? 'neutral') + 977;
  const gravity = usable(planet.gravityG, NEUTRAL.gravityG);
  // Low gravity grows things taller.
  const tall = clamp(Math.pow(1 / gravity, 0.5), 0.75, 1.4);
  const props: Prop[] = [];
  let n = 0;
  const next = () => hash2(ci * 7919 + n, ck * 104729 - n++, seed);
  for (const land of ['moss', 'lava', 'ice'] as const) {
    const weight = scenery.weights[land];
    if (weight < 0.05) continue;
    // Trees gather in forests, with clearings between them.
    const forest = 0.1 + 1.8 * smooth(-0.15, 0.35, fbm((ci + 0.5) * PROP_CELL / 2600, (ck + 0.5) * PROP_CELL / 2600, seed + 61, 2));
    for (const [kind, perCell, small, large] of SCATTER[land]) {
      const count = Math.floor(perCell * weight * (kind === 'tree' || kind === 'bulbtree' ? forest : 1) + next());
      for (let i = 0; i < count; i++) {
        const x = (ci + next()) * PROP_CELL;
        const z = (ck + next()) * PROP_CELL;
        const size = (small + (large - small) * next() ** 1.6) * (kind === 'boulder' ? 1 : tall);
        const yaw = next() * Math.PI * 2;
        if (Math.hypot(x, z) < LANDING_FLAT.inner + 40) continue;
        if (ground(x, z) < scenery.liquid.level + 2) continue;
        props.push({ kind, x, z, size, yaw });
      }
    }
  }
  return props;
}

// --- Flora: the small plants around the player ---------------------------------

export type FloraKind = 'grass' | 'flower' | 'bush' | 'fern' | 'mushroom';

export interface Flora {
  kind: FloraKind;
  x: number;
  z: number;
  /** Height, in metres. */
  size: number;
  yaw: number;
  /** 0 to 1: which of the kind's colours it takes. */
  tint: number;
}

/** Side of the square cells flora is scattered in, in metres. */
export const FLORA_CELL = 40;

/** Plants to a cell on fully temperate land, and their smallest and largest heights. */
const FLORA: readonly (readonly [FloraKind, number, number, number])[] = [
  ['grass', 16, 0.35, 0.9], ['flower', 7, 0.3, 0.8], ['bush', 3, 0.8, 2.2], ['fern', 2.5, 0.9, 2], ['mushroom', 1.5, 0.4, 2.6],
];

/**
 * The small plants of one cell: grass, flowers, bushes, ferns and glowing
 * mushrooms. They grow on temperate land; cold and hot worlds have none.
 */
export function floraInCell(planet: Partial<PlanetLook> & { name?: string }, ci: number, ck: number, ground = planetGround(planet)): Flora[] {
  const scenery = planetScenery(planet);
  const weight = scenery.weights.moss;
  if (weight < 0.05) return [];
  const seed = nameSeed(planet.name ?? 'neutral') + 4421;
  const dead = wasteland(planet);
  const flora: Flora[] = [];
  let n = 0;
  const next = () => hash2(ci * 4253 + n, ck * 7867 - n++, seed);
  for (const [kind, perCell, small, large] of FLORA) {
    const count = Math.floor(perCell * weight + next());
    for (let i = 0; i < count; i++) {
      const x = (ci + next()) * FLORA_CELL;
      const z = (ck + next()) * FLORA_CELL;
      const size = small + (large - small) * next() ** 1.4;
      const yaw = next() * Math.PI * 2;
      const tint = next();
      if (Math.hypot(x, z) < 22) continue;
      if (ground(x, z) < scenery.liquid.level + 1.5) continue;
      // Nothing grows in the wasteland.
      if (dead(x, z) > 0.25) continue;
      flora.push({ kind, x, z, size, yaw, tint });
    }
  }
  return flora;
}

// --- Landmarks: dungeons, giant trees and herds ----------------------------------

export type Species = 'mossback' | 'puffhop' | 'skyfin';

export interface Landmark {
  x: number;
  z: number;
  /** Turn around the vertical, in radians; a gate's door faces the landing site. */
  yaw: number;
}

export interface Herd {
  species: Species;
  x: number;
  z: number;
  /** How many animals, and how far from the middle they roam, in metres. */
  count: number;
  roam: number;
}

export interface Village {
  centre: Landmark;
  /** The houses around the square, each facing it, and where its folk stand. */
  huts: Landmark[];
  folk: Landmark[];
}

export interface PlanetFeatures {
  /** The ways into the dungeons: the first is the main ruin, with the relic and the rune. */
  gates: Landmark[];
  giants: Landmark[];
  herds: Herd[];
  /** The NPCs' village, on temperate land only. */
  village: Village | null;
  /** Enemy camps: each guards the chest at its middle. */
  camps: Landmark[];
  /** Beacons on high ground: lit, they show the way and let the player travel back. */
  beacons: Landmark[];
  /** Treasure chests: the camps' ones first, then the rest. */
  chests: Landmark[];
  /** Star shards to collect, many on high places. */
  shards: Landmark[];
  /** Where packs of enemies roam. */
  packs: Landmark[];
}

/**
 * Where a planet's landmarks stand: its dungeon gates on dry, flat ground,
 * the giant trees and the herds of its temperate land. Always the same for
 * the same planet.
 */
export function planetFeatures(planet: Partial<PlanetLook> & { name?: string }, ground = planetGround(planet)): PlanetFeatures {
  const scenery = planetScenery(planet);
  const seed = nameSeed(planet.name ?? 'neutral') + 8191;
  let n = 0;
  const next = () => hash2(n * 31, n++ * 17 + 5, seed);
  const taken: { x: number; z: number; room: number }[] = [{ x: 0, z: 0, room: LANDING_FLAT.inner + 40 }];
  const dry = (x: number, z: number) => ground(x, z) > scenery.liquid.level + 3;
  const flat = (x: number, z: number, span: number, rise: number) => {
    const h = ground(x, z);
    return [[span, 0], [-span, 0], [0, span], [0, -span]].every(([dx, dz]) => Math.abs(ground(x + dx, z + dz) - h) < rise);
  };
  // Tries spots at random distances until one fits, or gives up.
  const place = (near: number, far: number, room: number, fits: (x: number, z: number) => boolean) => {
    for (let attempt = 0; attempt < 60; attempt++) {
      const angle = next() * Math.PI * 2;
      const reach = near + (far - near) * Math.sqrt(next());
      const x = Math.sin(angle) * reach;
      const z = Math.cos(angle) * reach;
      if (!fits(x, z)) continue;
      if (taken.some((spot) => Math.hypot(spot.x - x, spot.z - z) < spot.room + room)) continue;
      taken.push({ x, z, room });
      return { x, z };
    }
    return null;
  };
  const facingHome = (x: number, z: number) => Math.atan2(-x, -z);

  const gates: Landmark[] = [];
  // Close enough to find on foot: something to do every few hundred metres.
  for (const [near, far] of [[300, 430], [220, 340], [380, 520]]) {
    const spot = place(near, far, 40, (x, z) => dry(x, z) && flat(x, z, 12, 3));
    if (spot) gates.push({ ...spot, yaw: facingHome(spot.x, spot.z) });
  }

  const giants: Landmark[] = [];
  const herds: Herd[] = [];
  if (scenery.weights.moss > 0.5) {
    // One giant close to the landing site, to see from the pad; the rest
    // further out.
    for (const [near, far, count] of [[170, 280, 1], [300, 900, 9]] as const) {
      for (let k = 0; k < count; k++) {
        const spot = place(near, far, 70, (x, z) => dry(x, z) && flat(x, z, 10, 6));
        if (spot) giants.push({ ...spot, yaw: next() * Math.PI * 2 });
      }
    }
    const groups: readonly (readonly [Species, number, number, number, number, number])[] = [
      // [species, groups, nearest, furthest, animals, roam]
      ['mossback', 4, 120, 450, 4, 30],
      ['puffhop', 6, 40, 320, 4, 12],
      ['skyfin', 4, 100, 500, 3, 40],
    ];
    for (const [species, count, near, far, animals, roam] of groups) {
      for (let k = 0; k < count; k++) {
        const spot = place(near, far, roam, (x, z) => dry(x, z) && flat(x, z, roam / 2, roam / 3));
        if (spot) herds.push({ species, ...spot, count: animals + Math.floor(next() * 2), roam });
      }
    }
  }
  let village: Village | null = null;
  if (scenery.weights.moss > 0.5) {
    const spot = place(90, 170, 50, (x, z) => dry(x, z) && flat(x, z, 22, 4));
    if (spot) {
      const turn = next() * Math.PI * 2;
      const ring = (count: number, radius: number) => Array.from({ length: count }, (_, k) => {
        const a = turn + (k / count) * Math.PI * 2;
        const x = spot.x + Math.sin(a) * radius;
        const z = spot.z + Math.cos(a) * radius;
        return { x, z, yaw: Math.atan2(spot.x - x, spot.z - z) };
      });
      village = { centre: { ...spot, yaw: facingHome(spot.x, spot.z) }, huts: ring(6, 30), folk: ring(4, 11) };
    }
  }

  const camps: Landmark[] = [];
  for (let k = 0; k < 5; k++) {
    const spot = place(160, 430, 40, (x, z) => dry(x, z) && flat(x, z, 14, 5));
    if (spot) camps.push({ ...spot, yaw: next() * Math.PI * 2 });
  }

  // The highest of a few dry spots in a ring, kept apart from the rest.
  const high = (near: number, far: number, room: number, tries: number) => {
    let best: { x: number; z: number; h: number } | null = null;
    for (let attempt = 0; attempt < tries * 4 && (best === null || attempt < tries); attempt++) {
      const angle = next() * Math.PI * 2;
      const reach = near + (far - near) * Math.sqrt(next());
      const x = Math.sin(angle) * reach;
      const z = Math.cos(angle) * reach;
      if (!dry(x, z) || taken.some((spot) => Math.hypot(spot.x - x, spot.z - z) < spot.room + room)) continue;
      const h = ground(x, z);
      if (!best || h > best.h) best = { x, z, h };
    }
    if (!best) return null;
    taken.push({ x: best.x, z: best.z, room });
    return { x: best.x, z: best.z, yaw: facingHome(best.x, best.z) };
  };

  const beacons: Landmark[] = [];
  for (let k = 0; k < 6; k++) {
    const spot = high(220, 620, 80, 8);
    if (spot) beacons.push(spot);
  }

  const chests: Landmark[] = camps.map((camp) => ({ ...camp }));
  for (let k = 0; k < 9; k++) {
    const spot = place(60, 480, 14, (x, z) => dry(x, z) && flat(x, z, 3, 2));
    if (spot) chests.push({ ...spot, yaw: facingHome(spot.x, spot.z) });
  }

  const shards: Landmark[] = [];
  for (let k = 0; k < 30; k++) {
    const spot = place(40, 480, 8, dry);
    if (spot) shards.push({ ...spot, yaw: 0 });
  }
  for (let k = 0; k < 15; k++) {
    const spot = high(150, 620, 10, 5);
    if (spot) shards.push(spot);
  }

  // Packs of enemies all over the valley, in the forests and the meadows.
  const packs: Landmark[] = [];
  // As many close to the landing site as far out, so there is always a fight nearby.
  for (let k = 0; k < 30; k++) {
    const band = [[80, 260], [260, 440], [440, 620]][k % 3];
    const spot = place(band[0], band[1], 22, (x, z) => dry(x, z) && flat(x, z, 5, 4));
    if (spot) packs.push({ ...spot, yaw: next() * Math.PI * 2 });
  }

  return { gates, giants, herds, village, camps, beacons, chests, shards, packs };
}

// --- Forests and paths ---------------------------------------------------------

/**
 * How thick the forest is at a point, from 0 (open meadow) to 1 (deep
 * forest): forests gather on hills and plateaus, thin out in the valleys and
 * on the heights, and leave the landing site, the village, the paths and the
 * water clear. Only on temperate land.
 */
export function forestDensity(planet: Partial<PlanetLook> & { name?: string }, ground = planetGround(planet), paths?: PlanetPaths): (x: number, z: number) => number {
  const scenery = planetScenery(planet);
  const seed = nameSeed(planet.name ?? 'neutral') + 6007;
  const moss = scenery.weights.moss;
  const relief = scenery.relief;
  const level = scenery.liquid.level;
  const dead = wasteland(planet);
  return (x, z) => {
    if (moss < 0.2) return 0;
    const alive = 1 - dead(x, z);
    if (alive <= 0) return 0;
    const h = ground(x, z);
    if (h < level + 1.5) return 0;
    const patches = smooth(-0.15, 0.3, fbm(x / 900, z / 900, seed, 3));
    const fine = 0.75 + 0.5 * fbm(x / 120, z / 120, seed + 3, 2);
    // Fewer trees on the bare heights.
    const height = 1 - smooth(relief * 1.8, relief * 2.6, h);
    const clear = smooth(LANDING_FLAT.inner + 20, LANDING_FLAT.inner + 120, Math.hypot(x, z));
    const path = paths ? smooth(4, 14, paths.distance(x, z)) : 1;
    return Math.max(0, Math.min(1, patches * fine * height * clear * path * moss * alive));
  };
}

export interface PlanetPaths {
  /** Each path, as points along it ([x, z], about 10 m apart). */
  lines: [number, number][][];
  /** Distance from a point to the nearest path, in metres (large when far from any). */
  distance(x: number, z: number): number;
}

/**
 * Dirt paths that join the landing site, the village and every place to go:
 * the dungeon gates, the camps and the beacons. They wander a little, as
 * paths do. Always the same for the same planet.
 */
export function planetPaths(planet: Partial<PlanetLook> & { name?: string }, features = planetFeatures(planet)): PlanetPaths {
  const seed = nameSeed(planet.name ?? 'neutral') + 9311;
  const hub = features.village ? features.village.centre : { x: 0, z: 0 };
  const ends: { x: number; z: number }[] = [...features.gates, ...features.camps, ...features.beacons];
  const pairs: [{ x: number; z: number }, { x: number; z: number }][] = [[{ x: 0, z: 0 }, hub]];
  for (const end of ends) {
    // From the nearest point already joined: the hub, the landing site or a gate.
    const from = [hub, { x: 0, z: 0 }, ...features.gates.filter((gate) => gate !== end)]
      .reduce((best, spot) => (Math.hypot(spot.x - end.x, spot.z - end.z) < Math.hypot(best.x - end.x, best.z - end.z) ? spot : best), hub);
    pairs.push([from, end]);
  }
  const lines = pairs.map(([a, b], k) => {
    const length = Math.hypot(b.x - a.x, b.z - a.z);
    const steps = Math.max(2, Math.round(length / 10));
    const nx = -(b.z - a.z) / length;
    const nz = (b.x - a.x) / length;
    return Array.from({ length: steps + 1 }, (_, i) => {
      const t = i / steps;
      // A gentle wander, none at the ends.
      const wander = Math.sin(t * Math.PI) * (noise(t * 3.1 + k * 7.7, k * 1.3, seed) * 0.12 * length);
      return [a.x + (b.x - a.x) * t + nx * wander, a.z + (b.z - a.z) * t + nz * wander] as [number, number];
    });
  });
  // Segments filed in a grid of 100 m squares, to find the near ones fast.
  const CELL = 100;
  const grid = new Map<string, [number, number, number, number][]>();
  for (const line of lines) {
    for (let i = 1; i < line.length; i++) {
      const [x0, z0] = line[i - 1];
      const [x1, z1] = line[i];
      for (const [gx, gz] of [[Math.floor(x0 / CELL), Math.floor(z0 / CELL)], [Math.floor(x1 / CELL), Math.floor(z1 / CELL)]]) {
        const key = `${gx},${gz}`;
        const list = grid.get(key) ?? [];
        if (!list.some((segment) => segment[0] === x0 && segment[1] === z0)) list.push([x0, z0, x1, z1]);
        grid.set(key, list);
      }
    }
  }
  return {
    lines,
    distance(x, z) {
      let best = 1e9;
      const gx = Math.floor(x / CELL);
      const gz = Math.floor(z / CELL);
      for (let i = gx - 1; i <= gx + 1; i++) {
        for (let k = gz - 1; k <= gz + 1; k++) {
          for (const [x0, z0, x1, z1] of grid.get(`${i},${k}`) ?? []) {
            const dx = x1 - x0;
            const dz = z1 - z0;
            const t = Math.max(0, Math.min(1, ((x - x0) * dx + (z - z0) * dz) / (dx * dx + dz * dz || 1)));
            best = Math.min(best, Math.hypot(x - x0 - dx * t, z - z0 - dz * t));
          }
        }
      }
      return best;
    },
  };
}
