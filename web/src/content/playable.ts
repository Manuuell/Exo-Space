// Which planets can be landed on, and in what order they are visited. Team
// decision: three planets of the TRAPPIST-1 system, e (home), then b, then h.
// Every other planet of the catalog can be analysed but not visited.
//
// Pure data, no Three.js: the tests load this file in Node.

import type { Exoplanet } from '../data/exoplanets.ts';

/** The planets that can be landed on, in the order the story visits them. */
export const PLAYABLE = ['TRAPPIST-1 e', 'TRAPPIST-1 b', 'TRAPPIST-1 h'] as const;
export type PlayableName = (typeof PLAYABLE)[number];

export function isPlayable(name: string): name is PlayableName {
  return (PLAYABLE as readonly string[]).includes(name);
}

/** The planet a jump from this one leads to, or null from the last one. */
export function nextPlayable(name: string): PlayableName | null {
  const index = (PLAYABLE as readonly string[]).indexOf(name);
  return index < 0 || index + 1 >= PLAYABLE.length ? null : PLAYABLE[index + 1];
}

/** The catalog rows of the playable planets, in order. */
export function playablePlanets(catalog: readonly Exoplanet[]): Exoplanet[] {
  return PLAYABLE.map((name) => {
    const planet = catalog.find((candidate) => candidate.pl_name === name);
    if (!planet) throw new Error(`${name} is not in the catalog`);
    return planet;
  });
}
