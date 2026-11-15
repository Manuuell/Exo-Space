// What a planet's real figures mean for moving on it and flying over it: how
// hard it pulls, how high its air reaches, how long its year is. This is the
// logic behind a planet, not its look: palettes and terrain are designed
// elsewhere. Every figure here is either a catalog value or derived from one,
// and says which. A missing value is named and replaced by a neutral one.
//
// Pure data, no Three.js: the tests load this file in Node.

import { escapeVelocity, surfaceGravity } from '../data/derived.ts';
import type { Exoplanet } from '../data/exoplanets.ts';

/** Standard gravity on Earth, in m/s². */
export const EARTH_GRAVITY = 9.80665;
/** Earth's equilibrium temperature, in kelvin: the same kind of figure as `pl_eqt`. */
export const EARTH_EQUILIBRIUM_K = 255;
/** The range gravity is kept in so the game stays playable, in Earth g. */
export const GRAVITY_LIMITS = { min: 0.3, max: 2 } as const;
/** Where space starts over a planet like Earth, in game metres. */
export const EARTH_CEILING = 1_500;
/** The range that height is kept in, in game metres. */
export const CEILING_LIMITS = { min: 900, max: 3_000 } as const;

/**
 * How fast air thins out with height, in km: R·T / (M·g), for air like
 * Earth's. The catalog says nothing about any planet's air, so this is what
 * the height would be if it were like Earth's, at the planet's real
 * temperature and gravity.
 */
export function scaleHeightKm(temperatureK: number, gravityG: number): number {
  const GAS_CONSTANT = 8.314462;
  const AIR_MOLAR_MASS = 0.028964;
  return (GAS_CONSTANT * temperatureK) / (AIR_MOLAR_MASS * gravityG * EARTH_GRAVITY) / 1000;
}

export const EARTH_SCALE_HEIGHT_KM = scaleHeightKm(EARTH_EQUILIBRIUM_K, 1);

export interface PlanetPhysics {
  name: string;
  /** Surface gravity in Earth g, as the catalog gives it (mass / radius²), or null. */
  gravityG: number | null;
  /** Gravity used in play, in m/s²: the real one, kept inside GRAVITY_LIMITS. */
  gravity: number;
  /** True when the real gravity was outside the limits and had to be capped. */
  gravityCapped: boolean;
  /** Equilibrium temperature in kelvin (`pl_eqt`), or null. */
  temperatureK: number | null;
  /** Derived: how fast the air would thin out, in km, if it were like Earth's. */
  scaleHeightKm: number | null;
  /** Derived: the height, in game metres, above which the ship is in space. */
  ceiling: number;
  /** Length of the year in days (`pl_orbper`), or null. */
  yearDays: number | null;
  /** Derived: escape velocity in km/s, or null. */
  escapeVelocityKms: number | null;
  /** Catalog values this planet lacks, each replaced here by a neutral one. */
  missing: string[];
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** The physics of a planet, from its catalog row. */
export function planetPhysics(planet: Exoplanet): PlanetPhysics {
  const missing: string[] = [];
  const gravityG = surfaceGravity(planet);
  if (gravityG === null) missing.push('gravity (needs mass and radius): 1 g used');
  if (planet.pl_eqt === null) missing.push('equilibrium temperature: Earth\'s used');

  const playG = clamp(gravityG ?? 1, GRAVITY_LIMITS.min, GRAVITY_LIMITS.max);
  const height = gravityG === null || planet.pl_eqt === null ? null : scaleHeightKm(planet.pl_eqt, gravityG);
  const ceiling = clamp(EARTH_CEILING * ((height ?? EARTH_SCALE_HEIGHT_KM) / EARTH_SCALE_HEIGHT_KM), CEILING_LIMITS.min, CEILING_LIMITS.max);

  return {
    name: planet.pl_name,
    gravityG,
    gravity: playG * EARTH_GRAVITY,
    gravityCapped: gravityG !== null && playG !== gravityG,
    temperatureK: planet.pl_eqt,
    scaleHeightKm: height,
    ceiling: Math.round(ceiling),
    yearDays: planet.pl_orbper,
    escapeVelocityKms: escapeVelocity(planet),
    missing,
  };
}
