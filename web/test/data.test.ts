import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

// The catalog is the base of the whole game: if it is missing or arrives
// changed, better to find out here than in the middle of a game.

const COLUMNS = [
  'pl_name', 'hostname', 'sy_pnum', 'discoverymethod', 'disc_year',
  'pl_rade', 'pl_bmasse', 'pl_dens', 'pl_eqt', 'pl_insol',
  'pl_orbper', 'pl_orbsmax', 'pl_orbeccen',
  'st_teff', 'st_rad', 'st_mass', 'st_spectype',
  'sy_dist', 'ra', 'dec',
];

const read = (name: string) => readFileSync(new URL(`../public/data/${name}`, import.meta.url), 'utf8');

test('the exoplanet catalog has the expected columns', () => {
  const lines = read('exoplanets.csv').trimEnd().split('\n');
  assert.equal(lines[0].trim(), COLUMNS.join(','));
  assert.ok(lines.length - 1 > 6000, `only ${lines.length - 1} planets`);
});

test('the source record matches the catalog', () => {
  const lines = read('exoplanets.csv').trimEnd().split('\n');
  const record = JSON.parse(read('exoplanets.meta.json'));
  assert.equal(record.planets, lines.length - 1);
  assert.equal(record.doi, '10.26133/NEA13');
  assert.deepEqual(record.columns, COLUMNS);
  assert.match(record.downloaded, /^\d{4}-\d{2}-\d{2}$/);
});
