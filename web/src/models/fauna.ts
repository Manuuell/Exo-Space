// How the fauna of a planet changes with the planet's real data. Table
// validated by the team on 2026-11-14:
//
// | Planet data            | What changes in the creature                 |
// |------------------------|----------------------------------------------|
// | Temperature (pl_eqt)   | Family: cold → ice, temperate → moss, hot → lava |
// | Gravity (derived)      | Build: high gravity short and wide, low gravity tall and light |
// | Star colour (st_teff)  | Colour of whatever glows: eyes, cracks, cores |
// | Size class (pl_rade)   | Overall size                                 |
//
// Pure data, no Three.js: the tests load this file in Node.

import { rgbToHex, sizeClass, starColor, thermalBand } from '../data/derived.ts';
import type { PlanetLook } from './contract.ts';

export type Family = 'ice' | 'moss' | 'lava';

export interface FamilyPalette {
  /** Main hide, a darker shade of it, and the belly. */
  skin: string;
  skinDark: string;
  belly: string;
  /** Spines, horns and plates. */
  spine: string;
  /** What grows on the creature: moss, crystals or cooling crust. */
  growth: string;
  /** Claws and teeth. */
  claw: string;
}

export const FAMILY_PALETTES: Record<Family, FamilyPalette> = {
  moss: { skin: '#4f7a3a', skinDark: '#3b5e2b', belly: '#c9b77a', spine: '#2f4a24', growth: '#7fae4a', claw: '#e8c35a' },
  lava: { skin: '#3a3034', skinDark: '#272024', belly: '#5a4a48', spine: '#1c1719', growth: '#6a3324', claw: '#c9a46a' },
  ice: { skin: '#a9c8e6', skinDark: '#86a9cc', belly: '#e8f0f8', spine: '#5fa8dc', growth: '#cfefff', claw: '#f2f6fb' },
};

export interface FaunaLook {
  family: Family;
  /** Multiplies heights: taller under low gravity. */
  tall: number;
  /** Multiplies widths: wider under high gravity. */
  wide: number;
  /** Overall scale, from the planet's size class. */
  size: number;
  /** Colour of whatever glows: the star's own colour. */
  glow: string;
  palette: FamilyPalette;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** The neutral look, for a model shown without a planet. */
export const NEUTRAL_PLANET: PlanetLook = { name: 'neutral', eqTempK: 280, gravityG: 1, starTeffK: 5772, radiusEarth: 1 };

export function faunaLook(planet: PlanetLook = NEUTRAL_PLANET): FaunaLook {
  const band = thermalBand({ pl_eqt: planet.eqTempK });
  const family: Family = band === 'cold' ? 'ice' : band === 'temperate' ? 'moss' : 'lava';
  const g = Math.max(planet.gravityG, 0.05);
  const sizeOf = { rocky: 1, intermediate: 1.25, giant: 1.5 } as const;
  const size = sizeOf[sizeClass({ pl_rade: planet.radiusEarth }) ?? 'rocky'];
  const star = starColor({ st_teff: planet.starTeffK });
  return {
    family,
    tall: clamp(1 / Math.sqrt(g), 0.8, 1.3),
    wide: clamp(Math.sqrt(g), 0.8, 1.2),
    size,
    glow: star ? rgbToHex(star) : '#ffffff',
    palette: FAMILY_PALETTES[family],
  };
}
