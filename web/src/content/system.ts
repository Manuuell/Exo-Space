// A planetary system laid out from the catalog: how big each world and its
// star are, how far apart they get, and what the sky holds as seen from one
// of them. Sizes and orbits are real catalog values turned into kilometres;
// where each planet is on its orbit at a given moment is derived, because
// the catalog does not say (see startingPhase).
//
// Pure data, no Three.js: the tests load this file in Node.

import type { Exoplanet } from '../data/exoplanets.ts';

/** One astronomical unit, in kilometres. */
export const AU_KM = 149_597_870.7;
/** The nominal radii the archive's Earth and solar units stand for, in km. */
export const EARTH_RADIUS_KM = 6_378.1;
export const SUN_RADIUS_KM = 695_700;
/** How wide the Sun and the full Moon look from Earth, in degrees: to compare. */
export const SUN_FROM_EARTH_DEG = 0.533;
export const MOON_FROM_EARTH_DEG = 0.518;

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** Radius of the planet in km, from `pl_rade`. */
export function radiusKm(planet: Pick<Exoplanet, 'pl_rade'>): number | null {
  return planet.pl_rade === null ? null : planet.pl_rade * EARTH_RADIUS_KM;
}

/** Radius of the star in km, from `st_rad`. */
export function starRadiusKm(planet: Pick<Exoplanet, 'st_rad'>): number | null {
  return planet.st_rad === null ? null : planet.st_rad * SUN_RADIUS_KM;
}

/** Radius of the orbit in km, from `pl_orbsmax`. */
export function orbitKm(planet: Pick<Exoplanet, 'pl_orbsmax'>): number | null {
  return planet.pl_orbsmax === null ? null : planet.pl_orbsmax * AU_KM;
}

/** How wide a ball of this radius looks from this far, in degrees. */
export function apparentSizeDeg(radius: number, distance: number): number {
  return (2 * Math.atan(radius / distance) * 180) / Math.PI;
}

/** Every planet of the same star, from the innermost orbit outwards. */
export function siblings(catalog: readonly Exoplanet[], planet: Pick<Exoplanet, 'hostname'>): Exoplanet[] {
  return catalog
    .filter((candidate) => candidate.hostname === planet.hostname)
    .sort((a, b) => (a.pl_orbsmax ?? Infinity) - (b.pl_orbsmax ?? Infinity));
}

/** The closest two planets of one star ever get: the gap between their orbits. */
export function closestApproachKm(a: Pick<Exoplanet, 'pl_orbsmax'>, b: Pick<Exoplanet, 'pl_orbsmax'>): number | null {
  const first = orbitKm(a);
  const second = orbitKm(b);
  return first === null || second === null ? null : Math.abs(first - second);
}

/**
 * Where a planet starts on its orbit, as a fraction of a turn. The catalog
 * has no orbital phase, so this is derived from the planet's name: the same
 * planet always starts at the same place, and it is not a real position.
 */
export function startingPhase(name: string): number {
  let hash = 2166136261;
  for (let i = 0; i < name.length; i++) {
    hash ^= name.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967296;
}

/**
 * Position of a planet around its star after `days`, in km, with the star at
 * the origin and the orbits in the XZ plane. Orbits are taken as circles:
 * the eccentricity in the catalog is left out.
 */
export function orbitPosition(planet: Pick<Exoplanet, 'pl_name' | 'pl_orbsmax' | 'pl_orbper'>, days: number): Vec3 | null {
  const radius = orbitKm(planet);
  if (radius === null || planet.pl_orbper === null || planet.pl_orbper <= 0) return null;
  const angle = (startingPhase(planet.pl_name) + days / planet.pl_orbper) * Math.PI * 2;
  return { x: radius * Math.cos(angle), y: 0, z: radius * Math.sin(angle) };
}

/** Something to see in the sky of a planet. */
export interface SkyBody {
  name: string;
  kind: 'star' | 'planet';
  /** Unit vector from the planet towards it, in the frame of orbitPosition. */
  direction: Vec3;
  distanceKm: number;
  radiusKm: number;
  /** How wide it looks, in degrees. */
  sizeDeg: number;
}

export interface Sky {
  bodies: SkyBody[];
  /** Planets of the system left out, each with the catalog value it lacks. */
  missing: string[];
}

/**
 * The star and the sister planets as seen from `home` after `days`: where
 * each one is, how far and how wide it looks. A body whose catalog values do
 * not allow it is left out and named in `missing`.
 */
export function skyFrom(home: Exoplanet, catalog: readonly Exoplanet[], days: number): Sky {
  const bodies: SkyBody[] = [];
  const missing: string[] = [];
  const here = orbitPosition(home, days);
  if (here === null) return { bodies, missing: [`${home.pl_name}: no orbit size or period`] };

  const towards = (name: string, kind: SkyBody['kind'], at: Vec3, radius: number) => {
    const offset = { x: at.x - here.x, y: at.y - here.y, z: at.z - here.z };
    const distanceKm = Math.hypot(offset.x, offset.y, offset.z);
    bodies.push({
      name,
      kind,
      direction: { x: offset.x / distanceKm, y: offset.y / distanceKm, z: offset.z / distanceKm },
      distanceKm,
      radiusKm: radius,
      sizeDeg: apparentSizeDeg(radius, distanceKm),
    });
  };

  const star = starRadiusKm(home);
  if (star === null) missing.push(`${home.hostname}: no star radius`);
  else towards(home.hostname, 'star', { x: 0, y: 0, z: 0 }, star);

  for (const sister of siblings(catalog, home)) {
    if (sister.pl_name === home.pl_name) continue;
    const at = orbitPosition(sister, days);
    const radius = radiusKm(sister);
    if (at === null) missing.push(`${sister.pl_name}: no orbit size or period`);
    else if (radius === null) missing.push(`${sister.pl_name}: no radius`);
    else towards(sister.pl_name, 'planet', at, radius);
  }
  return { bodies, missing };
}
