// What the game computes from the real catalog values. Every function gives
// null when one of its inputs is missing: the game shows that the value is
// unknown instead of inventing it. These are derived values, never real data.
//
// Pure data, no Three.js: the tests load this file in Node.

import type { Exoplanet } from './exoplanets.ts';

/** Escape velocity of Earth, in km/s. */
export const EARTH_ESCAPE_VELOCITY = 11.19;
/** Light-years in one parsec. */
export const LIGHT_YEARS_PER_PARSEC = 3.26156;

/** Surface gravity in Earth g: mass / radius², both in Earth units. */
export function surfaceGravity(planet: Pick<Exoplanet, 'pl_bmasse' | 'pl_rade'>): number | null {
  const { pl_bmasse: mass, pl_rade: radius } = planet;
  if (mass === null || radius === null || radius <= 0) return null;
  return mass / (radius * radius);
}

/** Escape velocity in km/s: 11.19 × √(mass / radius), both in Earth units. */
export function escapeVelocity(planet: Pick<Exoplanet, 'pl_bmasse' | 'pl_rade'>): number | null {
  const { pl_bmasse: mass, pl_rade: radius } = planet;
  if (mass === null || radius === null || radius <= 0 || mass < 0) return null;
  return EARTH_ESCAPE_VELOCITY * Math.sqrt(mass / radius);
}

/** Rocky under 1.6 Earth radii, intermediate from 1.6 to 4, giant from 4. */
export type SizeClass = 'rocky' | 'intermediate' | 'giant';

export function sizeClass(planet: Pick<Exoplanet, 'pl_rade'>): SizeClass | null {
  const radius = planet.pl_rade;
  if (radius === null) return null;
  if (radius < 1.6) return 'rocky';
  if (radius < 4) return 'intermediate';
  return 'giant';
}

/**
 * Bands of equilibrium temperature: cold under 200 K, temperate from 200 to
 * 350 K, hot from 350 to 1,000 K and scorching from 1,000 K.
 */
export type ThermalBand = 'cold' | 'temperate' | 'hot' | 'scorching';

export function thermalBand(planet: Pick<Exoplanet, 'pl_eqt'>): ThermalBand | null {
  const temperature = planet.pl_eqt;
  if (temperature === null) return null;
  if (temperature < 200) return 'cold';
  if (temperature < 350) return 'temperate';
  if (temperature < 1000) return 'hot';
  return 'scorching';
}

/** Distance from Earth in light-years: parsecs × 3.26156. */
export function distanceLightYears(planet: Pick<Exoplanet, 'sy_dist'>): number | null {
  const parsecs = planet.sy_dist;
  if (parsecs === null) return null;
  return parsecs * LIGHT_YEARS_PER_PARSEC;
}

export interface Vector3Like {
  x: number;
  y: number;
  z: number;
}

/**
 * Position in space, in parsecs, with Earth at the origin. Equatorial axes:
 * +x towards right ascension 0 on the celestial equator, +y towards right
 * ascension 90°, +z towards the north celestial pole.
 */
export function positionParsecs(planet: Pick<Exoplanet, 'ra' | 'dec' | 'sy_dist'>): Vector3Like | null {
  const { ra, dec, sy_dist: distance } = planet;
  if (ra === null || dec === null || distance === null) return null;
  const alpha = (ra * Math.PI) / 180;
  const delta = (dec * Math.PI) / 180;
  return {
    x: distance * Math.cos(delta) * Math.cos(alpha),
    y: distance * Math.cos(delta) * Math.sin(alpha),
    z: distance * Math.sin(delta),
  };
}

/** A colour with channels from 0 to 1, in sRGB. */
export interface Rgb {
  r: number;
  g: number;
  b: number;
}

// Planck's law gives the light a blackbody emits at each wavelength; the CIE
// colour matching functions turn that spectrum into a colour the eye sees.
// The matching functions use the multi-lobe Gaussian fit of Wyman, Sloan and
// Shirley, "Simple Analytic Approximations to the CIE XYZ Color Matching
// Functions", Journal of Computer Graphics Techniques 2(2), 2013.

function lobe(lambda: number, mean: number, below: number, above: number): number {
  const t = (lambda - mean) / (lambda < mean ? below : above);
  return Math.exp(-0.5 * t * t);
}

function matchX(lambda: number): number {
  return 1.056 * lobe(lambda, 599.8, 37.9, 31.0) + 0.362 * lobe(lambda, 442.0, 16.0, 26.7) - 0.065 * lobe(lambda, 501.1, 20.4, 26.2);
}

function matchY(lambda: number): number {
  return 0.821 * lobe(lambda, 568.8, 46.9, 40.5) + 0.286 * lobe(lambda, 530.9, 16.3, 31.1);
}

function matchZ(lambda: number): number {
  return 1.217 * lobe(lambda, 437.0, 11.8, 36.0) + 0.681 * lobe(lambda, 459.0, 26.0, 13.8);
}

/** Spectral radiance of a blackbody, up to a constant factor. */
function planck(lambdaNm: number, kelvin: number): number {
  const lambda = lambdaNm * 1e-9;
  const c2 = 1.438777e-2; // h·c / k, in m·K
  return 1 / (lambda ** 5 * (Math.exp(c2 / (lambda * kelvin)) - 1));
}

/** CIE 1931 chromaticity (x, y) of a blackbody at this temperature. */
export function blackbodyChromaticity(kelvin: number): { x: number; y: number } {
  let X = 0;
  let Y = 0;
  let Z = 0;
  for (let lambda = 380; lambda <= 780; lambda += 5) {
    const power = planck(lambda, kelvin);
    X += power * matchX(lambda);
    Y += power * matchY(lambda);
    Z += power * matchZ(lambda);
  }
  const sum = X + Y + Z;
  return { x: X / sum, y: Y / sum };
}

function encodeSrgb(linear: number): number {
  const encoded = linear <= 0.0031308 ? 12.92 * linear : 1.055 * linear ** (1 / 2.4) - 0.055;
  return Math.min(1, encoded);
}

/**
 * Colour of a blackbody at this temperature, scaled so that its brightest
 * channel is 1. Colours the eye cannot see on a screen (the reddest stars)
 * are clipped to the closest one it can.
 */
export function blackbodyColor(kelvin: number): Rgb {
  const { x, y } = blackbodyChromaticity(kelvin);
  const X = x / y;
  const Z = (1 - x - y) / y;
  const linear = [
    3.2404542 * X - 1.5371385 - 0.4985314 * Z,
    -0.969266 * X + 1.8760108 + 0.041556 * Z,
    0.0556434 * X - 0.2040259 + 1.0572252 * Z,
  ].map((channel) => Math.max(0, channel));
  const brightest = Math.max(...linear);
  const [r, g, b] = linear.map((channel) => encodeSrgb(channel / brightest));
  return { r, g, b };
}

/** Colour of the host star, from its temperature. */
export function starColor(planet: Pick<Exoplanet, 'st_teff'>): Rgb | null {
  const temperature = planet.st_teff;
  if (temperature === null || temperature <= 0) return null;
  return blackbodyColor(temperature);
}

/** A colour as "#rrggbb". */
export function rgbToHex({ r, g, b }: Rgb): string {
  const hex = (channel: number) => Math.round(Math.min(1, Math.max(0, channel)) * 255).toString(16).padStart(2, '0');
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

/** Everything the game derives from one planet. */
export interface Derived {
  gravity: number | null;
  escapeVelocity: number | null;
  sizeClass: SizeClass | null;
  thermalBand: ThermalBand | null;
  starColor: Rgb | null;
  distanceLightYears: number | null;
  position: Vector3Like | null;
}

export function derive(planet: Exoplanet): Derived {
  return {
    gravity: surfaceGravity(planet),
    escapeVelocity: escapeVelocity(planet),
    sizeClass: sizeClass(planet),
    thermalBand: thermalBand(planet),
    starColor: starColor(planet),
    distanceLightYears: distanceLightYears(planet),
    position: positionParsecs(planet),
  };
}

/** True when every derived value could be computed. */
export function isComplete(derived: Derived): boolean {
  return Object.values(derived).every((value) => value !== null);
}
