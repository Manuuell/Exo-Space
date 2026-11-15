import assert from 'node:assert/strict';
import { test } from 'node:test';
import { rgbToHex, starColor } from '../src/data/derived.ts';
import { TRAPPIST_1 } from '../src/models/contract.ts';
import { faunaLook } from '../src/models/fauna.ts';

// The team's table (2026-11-14): temperature → family, gravity → build,
// star colour → what glows, size class → size.

test('each planet gives its own family', () => {
  assert.equal(faunaLook(TRAPPIST_1.e).family, 'moss');
  assert.equal(faunaLook(TRAPPIST_1.b).family, 'lava');
  assert.equal(faunaLook(TRAPPIST_1.h).family, 'ice');
});

test('low gravity makes creatures taller, high gravity wider', () => {
  const light = faunaLook(TRAPPIST_1.h);
  const heavy = faunaLook(TRAPPIST_1.b);
  assert.ok(light.tall > heavy.tall);
  assert.ok(heavy.wide > light.wide);
});

test('what glows takes the colour of the star', () => {
  assert.equal(faunaLook(TRAPPIST_1.e).glow, rgbToHex(starColor({ st_teff: 2566 })!));
});

test('the three planets are rocky, so their fauna has the same overall size', () => {
  const sizes = Object.values(TRAPPIST_1).map((planet) => faunaLook(planet).size);
  assert.deepEqual(sizes, [1, 1, 1]);
});

test('the same planet always gives the same look', () => {
  assert.deepEqual(faunaLook(TRAPPIST_1.h), faunaLook(TRAPPIST_1.h));
});
