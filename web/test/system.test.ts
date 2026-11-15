import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { PLAYABLE, isPlayable, nextPlayable, playablePlanets } from '../src/content/playable.ts';
import { CEILING_LIMITS, EARTH_CEILING, EARTH_GRAVITY, GRAVITY_LIMITS, planetPhysics, scaleHeightKm } from '../src/content/planet-physics.ts';
import {
  AU_KM, MOON_FROM_EARTH_DEG, SUN_FROM_EARTH_DEG,
  apparentSizeDeg, closestApproachKm, orbitKm, orbitPosition, siblings, skyFrom, startingPhase,
} from '../src/content/system.ts';
import { parseCatalog } from '../src/data/exoplanets.ts';
import type { Exoplanet } from '../src/data/exoplanets.ts';

// The figures these tests expect are the ones section 7 of
// lore-and-mechanics.md gives for the TRAPPIST-1 system: the code has to
// reach them from the catalog alone.

const catalog = parseCatalog(readFileSync(new URL('../public/data/exoplanets.csv', import.meta.url), 'utf8'));
const planet = (name: string): Exoplanet => {
  const found = catalog.find((candidate) => candidate.pl_name === name);
  assert.ok(found, `${name} is not in the catalog`);
  return found;
};
const e = planet('TRAPPIST-1 e');
const near = (actual: number | null, expected: number, tolerance: number, what: string) =>
  assert.ok(actual !== null && Math.abs(actual - expected) <= tolerance, `${what}: ${actual}, expected about ${expected}`);

test('the three playable planets are in the catalog, in the order of the story', () => {
  assert.deepEqual(playablePlanets(catalog).map((p) => p.pl_name), [...PLAYABLE]);
  assert.equal(nextPlayable('TRAPPIST-1 e'), 'TRAPPIST-1 b');
  assert.equal(nextPlayable('TRAPPIST-1 b'), 'TRAPPIST-1 h');
  assert.equal(nextPlayable('TRAPPIST-1 h'), null);
  assert.equal(nextPlayable('Kepler-22 b'), null);
  assert.ok(isPlayable('TRAPPIST-1 h') && !isPlayable('TRAPPIST-1 d'));
});

test('the playable planets have every value the physics needs', () => {
  for (const p of playablePlanets(catalog)) assert.deepEqual(planetPhysics(p).missing, [], p.pl_name);
});

test('the TRAPPIST-1 system has seven planets and fits inside 0.062 au', () => {
  const system = siblings(catalog, e);
  assert.equal(system.length, 7);
  assert.deepEqual(system.map((p) => p.pl_name.slice(-1)), ['b', 'c', 'd', 'e', 'f', 'g', 'h']);
  near(orbitKm(system[6])! / AU_KM, 0.062, 0.0005, 'the widest orbit, in au');
});

test('from e, the neighbours come as close as the design document says', () => {
  near(closestApproachKm(e, planet('TRAPPIST-1 d'))! / 1e6, 1.0, 0.05, 'd, in millions of km');
  near(closestApproachKm(e, planet('TRAPPIST-1 f'))! / 1e6, 1.4, 0.05, 'f');
  near(closestApproachKm(e, planet('TRAPPIST-1 b'))! / 1e6, 2.65, 0.05, 'b');
  near(closestApproachKm(e, planet('TRAPPIST-1 h'))! / 1e6, 4.9, 0.05, 'h');
});

test('from e, the star looks four times wider than our Sun, and a year lasts 6.1 days', () => {
  const sky = skyFrom(e, catalog, 0);
  const star = sky.bodies.find((body) => body.kind === 'star');
  assert.ok(star);
  near(star.sizeDeg / SUN_FROM_EARTH_DEG, 4, 0.15, 'the star, in Suns');
  near(planetPhysics(e).yearDays, 6.1, 0.01, 'the year, in days');
});

test('at their closest, d and f look a little larger than the full Moon, b half as wide and h a fifth', () => {
  const widest = (name: string) => {
    const other = planet(name);
    return apparentSizeDeg(other.pl_rade! * 6378.1, closestApproachKm(e, other)!) / MOON_FROM_EARTH_DEG;
  };
  for (const name of ['TRAPPIST-1 d', 'TRAPPIST-1 f']) {
    assert.ok(widest(name) > 1 && widest(name) < 1.15, `${name} looks ${widest(name).toFixed(2)} Moons wide`);
  }
  near(widest('TRAPPIST-1 b'), 0.5, 0.1, 'b, in Moons');
  near(widest('TRAPPIST-1 h'), 0.2, 0.03, 'h, in Moons');
});

test('the sky holds the star and the six sisters, and never puts a planet closer than its orbit allows', () => {
  for (const days of [0, 1.3, 7, 40, 365]) {
    const sky = skyFrom(e, catalog, days);
    assert.deepEqual(sky.missing, []);
    assert.equal(sky.bodies.length, 7);
    assert.equal(sky.bodies.filter((body) => body.kind === 'star').length, 1);
    for (const body of sky.bodies) {
      near(Math.hypot(body.direction.x, body.direction.y, body.direction.z), 1, 1e-9, `${body.name}: direction length`);
      if (body.kind === 'planet') {
        const closest = closestApproachKm(e, planet(body.name))!;
        assert.ok(body.distanceKm >= closest - 1, `${body.name} is ${body.distanceKm} km away, closer than ${closest}`);
      }
    }
  }
});

test('a planet goes round once a year, and always starts from the same place', () => {
  const start = orbitPosition(e, 0)!;
  const year = orbitPosition(e, e.pl_orbper!)!;
  near(year.x, start.x, 1, 'x after one year');
  near(year.z, start.z, 1, 'z after one year');
  const half = orbitPosition(e, e.pl_orbper! / 2)!;
  near(half.x, -start.x, 1, 'x after half a year');
  assert.equal(startingPhase('TRAPPIST-1 e'), startingPhase('TRAPPIST-1 e'));
  assert.notEqual(startingPhase('TRAPPIST-1 e'), startingPhase('TRAPPIST-1 f'));
  near(Math.hypot(start.x, start.z), orbitKm(e)!, 1, 'the orbit radius');
});

test('gravity is the real one for the three planets: e and h lighter than Earth, b heavier', () => {
  near(planetPhysics(e).gravityG, 0.82, 0.01, 'e, in g');
  near(planetPhysics(planet('TRAPPIST-1 b')).gravityG, 1.1, 0.01, 'b');
  near(planetPhysics(planet('TRAPPIST-1 h')).gravityG, 0.57, 0.01, 'h');
  for (const p of playablePlanets(catalog)) {
    const physics = planetPhysics(p);
    assert.equal(physics.gravityCapped, false, p.pl_name);
    near(physics.gravity, physics.gravityG! * EARTH_GRAVITY, 1e-9, `${p.pl_name}: gravity in m/s²`);
  }
});

test('air like Earth\'s would thin out as fast as it does on Earth, and reach higher where it is hot or light', () => {
  near(scaleHeightKm(255, 1), 7.5, 0.1, 'Earth, in km');
  assert.ok(scaleHeightKm(400, 1) > scaleHeightKm(255, 1));
  assert.ok(scaleHeightKm(255, 0.5) > scaleHeightKm(255, 1));
  const ceilings = playablePlanets(catalog).map((p) => planetPhysics(p).ceiling);
  assert.equal(new Set(ceilings).size, 3, `the three ceilings are ${ceilings}`);
  for (const ceiling of ceilings) assert.ok(ceiling >= CEILING_LIMITS.min && ceiling <= CEILING_LIMITS.max);
  assert.ok(Math.abs(planetPhysics({ ...e, pl_eqt: 255, pl_bmasse: 1, pl_rade: 1 }).ceiling - EARTH_CEILING) <= 1);
});

test('a planet with values missing does not fail: it says which, and uses neutral ones', () => {
  const bare = planetPhysics({ ...e, pl_bmasse: null, pl_eqt: null, pl_orbper: null });
  assert.equal(bare.gravityG, null);
  assert.equal(bare.gravity, EARTH_GRAVITY);
  assert.equal(bare.scaleHeightKm, null);
  assert.equal(bare.ceiling, EARTH_CEILING);
  assert.equal(bare.missing.length, 2);
  const sky = skyFrom({ ...e, pl_orbsmax: null }, catalog, 0);
  assert.equal(sky.bodies.length, 0);
  assert.equal(sky.missing.length, 1);
});

test('gravity outside the playable range is capped, and says so', () => {
  const heavy = planetPhysics({ ...e, pl_bmasse: 300, pl_rade: 3 });
  assert.ok(heavy.gravityG! > GRAVITY_LIMITS.max);
  assert.equal(heavy.gravity, GRAVITY_LIMITS.max * EARTH_GRAVITY);
  assert.equal(heavy.gravityCapped, true);
  for (const p of catalog) {
    const physics = planetPhysics(p);
    assert.ok(physics.gravity >= GRAVITY_LIMITS.min * EARTH_GRAVITY && physics.gravity <= GRAVITY_LIMITS.max * EARTH_GRAVITY, p.pl_name);
    assert.ok(Number.isFinite(physics.ceiling), p.pl_name);
  }
});
