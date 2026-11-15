// What the ship needs before it can leave the last valley of the planet, and
// where in the valley (or above it) each thing is found. The task bar shows
// it; once all of it is aboard she can leave, and the world ends behind her.
//
// Why each thing is needed is told with the planet's real values from the
// catalog when it has them, and without figures when it does not.
//
// Pure data, no DOM and no Three.js: the tests load this file in Node.

import { distanceLightYears, escapeVelocity, surfaceGravity } from '../data/derived.ts';
import type { Exoplanet } from '../data/exoplanets.ts';

export type TaskId = 'plates' | 'ore' | 'crystal' | 'solar' | 'beacons' | 'colonists';

export interface Task {
  id: TaskId;
  name: string;
  /** How many are needed. */
  need: number;
  unit: string;
  /** Where in the valley it is found. */
  where: string;
  /** What the ship needs it for. */
  why: string;
}

export type Progress = Record<TaskId, number>;

/** How many beacons and ruins the valley has, and how many folk ask for help. */
export interface ValleyCounts { ruins: number; beacons: number; folk: number }

export function wayHome(planet: Exoplanet | null, counts: ValleyCounts): Task[] {
  const gravity = planet ? surfaceGravity(planet) : null;
  const escape = planet ? escapeVelocity(planet) : null;
  const years = planet ? distanceLightYears(planet) : null;
  const flares = planet?.st_teff ? `a ${Math.round(planet.st_teff).toLocaleString('en-US')} K red dwarf` : 'a red dwarf';
  const light = planet?.pl_insol ? ` The valley gets ${Math.round(planet.pl_insol * 100)}% of the light Earth gets, so the panels alone are too slow.` : '';
  return [
    {
      id: 'plates', name: 'Hull plates', need: counts.ruins, unit: '',
      where: 'Guarded in the ruins: clear each dungeon and open its reward.',
      why: `The star is ${flares} that flares often: without shielding, the ship would not survive the way out.`,
    },
    {
      id: 'ore', name: 'Ore', need: 30, unit: '',
      where: 'Asteroids in orbit (fly up and shoot them), chests and dungeon rewards.',
      why: escape && gravity
        ? `Fuel and structure for lift-off: leaving a world of ${gravity.toFixed(2)} g takes ${escape.toFixed(1)} km/s.`
        : 'Fuel and structure for lift-off.',
    },
    {
      id: 'crystal', name: 'Crystal', need: 6, unit: '',
      where: 'Crystal asteroids in orbit, chests, dungeon rewards and the world boss.',
      why: 'The core of the jump drive is grown from it.',
    },
    {
      id: 'solar', name: 'Solar energy', need: 100, unit: ' kWh',
      where: 'Golden motes in orbit: fly the ship through them.',
      why: `The jump drive has to be charged before it fires.${light}`,
    },
    {
      id: 'beacons', name: 'Beacons lit', need: counts.beacons, unit: '',
      where: 'On the heights around the valley: climb to each one and light it.',
      why: years
        ? `Lit together they fix the ship’s place among the stars. Earth is ${years.toFixed(1)} light years away: a jump aimed blind is lost.`
        : 'Lit together they fix the ship’s place among the stars, to aim the jump.',
    },
    {
      id: 'colonists', name: 'Colonists', need: counts.folk, unit: '',
      where: 'The village: help each of its folk, and they come with you.',
      why: 'This valley is the last place on the planet where anyone can live. No one stays behind.',
    },
  ];
}

/** Everything aboard: the ship can leave. */
export function ready(tasks: readonly Task[], progress: Progress): boolean {
  return tasks.every((task) => progress[task.id] >= task.need);
}

/** The next thing still missing, in the order of the bar. */
export function nextTask(tasks: readonly Task[], progress: Progress): Task | null {
  return tasks.find((task) => progress[task.id] < task.need) ?? null;
}
