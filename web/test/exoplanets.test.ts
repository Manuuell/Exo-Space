import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  blackbodyChromaticity,
  derive,
  distanceLightYears,
  escapeVelocity,
  positionParsecs,
  sizeClass,
  starColor,
  surfaceGravity,
  thermalBand,
} from '../src/data/derived.ts';
import { parseCatalog, parseCsv } from '../src/data/exoplanets.ts';

const catalog = parseCatalog(readFileSync(new URL('../public/data/exoplanets.csv', import.meta.url), 'utf8'));
const close = (actual: number | null, expected: number, tolerance: number) =>
  assert.ok(actual !== null && Math.abs(actual - expected) <= tolerance, `${actual} is not close to ${expected}`);

test('the catalog loads with more than 6,000 planets', () => {
  assert.ok(catalog.length > 6000, `only ${catalog.length} planets`);
  for (const planet of catalog) {
    assert.ok(planet.pl_name.length > 0);
    assert.ok(planet.hostname.length > 0);
  }
});

test('the catalog keeps names, numbers and empty cells', () => {
  const e = catalog.find((planet) => planet.pl_name === 'TRAPPIST-1 e');
  assert.ok(e, 'TRAPPIST-1 e is missing');
  assert.equal(e.hostname, 'TRAPPIST-1');
  assert.equal(e.st_spectype, 'M8.0 V');
  assert.equal(e.pl_rade, 0.92);
  assert.equal(e.st_teff, 2566);
  assert.ok(catalog.some((planet) => planet.st_spectype === null), 'empty cells should be null');
});

test('the nearest planet is 1.30 parsecs away', () => {
  const nearest = Math.min(...catalog.flatMap((planet) => (planet.sy_dist === null ? [] : [planet.sy_dist])));
  assert.equal(nearest.toFixed(2), '1.30');
});

test('the CSV reader handles quotes, commas and line endings', () => {
  assert.deepEqual(parseCsv('a,"b, c","say ""hi"""\r\n,2,\n'), [
    ['a', 'b, c', 'say "hi"'],
    ['', '2', ''],
  ]);
});

test('a catalog with other columns is refused', () => {
  assert.throws(() => parseCatalog('pl_name,hostname\n"x","y"\n'));
});

test('Earth gives gravity 1 and escape velocity 11.19 km/s', () => {
  const earth = { pl_bmasse: 1, pl_rade: 1 };
  assert.equal(surfaceGravity(earth), 1);
  assert.equal(escapeVelocity(earth), 11.19);
});

test('a planet with no mass has no gravity', () => {
  assert.equal(surfaceGravity({ pl_bmasse: null, pl_rade: 1 }), null);
  assert.equal(escapeVelocity({ pl_bmasse: null, pl_rade: 1 }), null);
});

test('a 3,000 K star is redder than a 6,500 K one', () => {
  const cool = starColor({ st_teff: 3000 });
  const hot = starColor({ st_teff: 6500 });
  assert.ok(cool && hot);
  assert.ok(cool.r / cool.b > hot.r / hot.b, `${JSON.stringify(cool)} vs ${JSON.stringify(hot)}`);
  assert.ok(cool.b < hot.b);
  assert.equal(starColor({ st_teff: null }), null);
});

test('blackbody colours follow the Planckian locus', () => {
  // CIE 1931 chromaticity of blackbodies at these temperatures.
  const locus: [number, number, number][] = [
    [2000, 0.5267, 0.4133],
    [3000, 0.4369, 0.4041],
    [6500, 0.3135, 0.3236],
    [10000, 0.2807, 0.2884],
  ];
  for (const [kelvin, x, y] of locus) {
    const chromaticity = blackbodyChromaticity(kelvin);
    close(chromaticity.x, x, 0.005);
    close(chromaticity.y, y, 0.005);
  }
});

test('size class and thermal band use the agreed limits', () => {
  assert.equal(sizeClass({ pl_rade: 1.59 }), 'rocky');
  assert.equal(sizeClass({ pl_rade: 1.6 }), 'intermediate');
  assert.equal(sizeClass({ pl_rade: 4 }), 'giant');
  assert.equal(sizeClass({ pl_rade: null }), null);
  assert.equal(thermalBand({ pl_eqt: 199 }), 'cold');
  assert.equal(thermalBand({ pl_eqt: 200 }), 'temperate');
  assert.equal(thermalBand({ pl_eqt: 350 }), 'hot');
  assert.equal(thermalBand({ pl_eqt: 1000 }), 'scorching');
  assert.equal(thermalBand({ pl_eqt: null }), null);
});

test('distance and position agree', () => {
  close(distanceLightYears({ sy_dist: 1 }), 3.26156, 1e-9);
  const north = positionParsecs({ ra: 0, dec: 90, sy_dist: 2 });
  assert.ok(north);
  close(north.z, 2, 1e-9);
  close(Math.hypot(north.x, north.y), 0, 1e-9);
  const equator = positionParsecs({ ra: 90, dec: 0, sy_dist: 3 });
  assert.ok(equator);
  close(equator.y, 3, 1e-9);
  assert.equal(positionParsecs({ ra: 10, dec: 10, sy_dist: null }), null);
  for (const planet of catalog) {
    const position = positionParsecs(planet);
    if (position && planet.sy_dist !== null) close(Math.hypot(position.x, position.y, position.z), planet.sy_dist, 1e-6);
  }
});

test('TRAPPIST-1 e derives sensible values', () => {
  const e = catalog.find((planet) => planet.pl_name === 'TRAPPIST-1 e');
  assert.ok(e);
  const derived = derive(e);
  close(derived.gravity, 0.692 / 0.92 ** 2, 1e-9);
  assert.equal(derived.sizeClass, 'rocky');
  assert.equal(derived.thermalBand, 'temperate');
  close(derived.distanceLightYears, 40.54, 0.01);
  assert.ok(derived.starColor, 'TRAPPIST-1 has a temperature');
  close(derived.starColor.r, 1, 1e-9);
  assert.ok(derived.starColor.b < 0.5, 'a 2,566 K star should be orange');
});
