// The ship's log: where the player is, which jump runes they hold, and the
// rules of the jump. Team decisions: completing the ruins of a planet gives
// its jump rune; a rune fuels one jump, to the next planet; without one the
// ship still flies but does not get far; the jump to Earth needs only the
// mega-rune, won from the last boss.
//
// Pure data, no Three.js: the tests load this file in Node.

import { PLAYABLE, isPlayable, nextPlayable } from './playable.ts';

export interface ShipLog {
  /** The planet the ship is at. */
  at: string;
  /** Planets whose rune the player holds and has not spent. */
  runes: string[];
  /** Planets whose ruins already gave their rune: each gives it once. */
  earned: string[];
  /** Planets the ship has been to, in order. */
  visited: string[];
  megaRune: boolean;
}

/** A new game: at home, with no runes. */
export function newShip(): ShipLog {
  return { at: PLAYABLE[0], runes: [], earned: [], visited: [PLAYABLE[0]], megaRune: false };
}

/**
 * The rune for completing the ruins of `planet`. A planet's ruins give their
 * rune once: a second time changes nothing.
 */
export function grantRune(log: ShipLog, planet: string): ShipLog {
  if (!isPlayable(planet) || log.earned.includes(planet)) return log;
  return { ...log, runes: [...log.runes, planet], earned: [...log.earned, planet] };
}

/** The mega-rune, for defeating the last boss. */
export function grantMegaRune(log: ShipLog): ShipLog {
  return { ...log, megaRune: true };
}

export type JumpCheck = { ok: true; to: string } | { ok: false; reason: string };

/** Whether the ship can jump to the next planet, and if not, why. */
export function checkJump(log: ShipLog): JumpCheck {
  const to = nextPlayable(log.at);
  if (to === null) return { ok: false, reason: `${log.at} is the last world on the route. Only the mega-rune can take the ship further.` };
  if (!log.runes.includes(log.at)) {
    return { ok: false, reason: `No jump rune. Complete the ruins of ${log.at} to earn the one that reaches ${to}.` };
  }
  return { ok: true, to };
}

/** The jump to the next planet: it spends the rune of the planet left behind. */
export function jump(log: ShipLog): ShipLog {
  const check = checkJump(log);
  if (!check.ok) throw new Error(check.reason);
  return {
    ...log,
    at: check.to,
    runes: log.runes.filter((rune) => rune !== log.at),
    visited: [...log.visited, check.to],
  };
}

/** Whether the ship can make the jump to Earth: it needs only the mega-rune. */
export function checkJumpHome(log: ShipLog): JumpCheck {
  return log.megaRune
    ? { ok: true, to: 'Earth' }
    : { ok: false, reason: 'The jump home needs the mega-rune.' };
}

// Saving

/** The part of the browser's storage the log needs: tests pass a stand-in. */
export interface Storage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const SAVE_KEY = 'exo-space.ship';

export function saveShip(storage: Storage, log: ShipLog): void {
  storage.setItem(SAVE_KEY, JSON.stringify(log));
}

/** The saved log, or a new one when there is none or it cannot be read. */
export function loadShip(storage: Storage): ShipLog {
  const text = storage.getItem(SAVE_KEY);
  if (text === null) return newShip();
  try {
    const saved = JSON.parse(text) as Partial<ShipLog>;
    const names = (value: unknown) => (Array.isArray(value) ? value.filter((name): name is string => typeof name === 'string' && isPlayable(name)) : []);
    if (typeof saved.at !== 'string' || !isPlayable(saved.at)) return newShip();
    return {
      at: saved.at,
      runes: names(saved.runes),
      earned: names(saved.earned),
      visited: names(saved.visited),
      megaRune: saved.megaRune === true,
    };
  } catch {
    return newShip();
  }
}
