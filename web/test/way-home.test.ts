import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { parseCatalog } from '../src/data/exoplanets.ts';
import { nextTask, ready, wayHome } from '../src/play/way-home.ts';
import type { Progress } from '../src/play/way-home.ts';

// What the ship needs before it can leave the last valley: told with the
// planet's real values when the catalog has them, without figures when not.

const catalog = parseCatalog(readFileSync(new URL('../public/data/exoplanets.csv', import.meta.url), 'utf8'));
const e = catalog.find((planet) => planet.pl_name === 'TRAPPIST-1 e') ?? null;
const counts = { ruins: 3, beacons: 6, folk: 4 };
const none: Progress = { plates: 0, ore: 0, crystal: 0, solar: 0, beacons: 0, colonists: 0 };

test('the ship needs six things, found all over the valley', () => {
  const tasks = wayHome(e, counts);
  assert.deepEqual(tasks.map((task) => task.id), ['plates', 'ore', 'crystal', 'solar', 'beacons', 'colonists']);
  assert.deepEqual(tasks.map((task) => task.need), [3, 30, 6, 100, 6, 4]);
  for (const task of tasks) assert.ok(task.where.length > 10 && task.why.length > 10, task.id);
});

test('the reasons use the catalog’s real values', () => {
  const text = wayHome(e, counts).map((task) => task.why).join(' ');
  assert.ok(text.includes('0.82 g'), text);
  assert.ok(text.includes('9.7 km/s'), text);
  assert.ok(text.includes('40.5 light years'), text);
  assert.ok(text.includes('2,566 K'), text);
  assert.ok(text.includes('65%'), text);
});

test('without the catalog the reasons carry no figures', () => {
  const text = wayHome(null, counts).map((task) => task.why).join(' ');
  assert.ok(!/[0-9]/.test(text), text);
});

test('she can leave only with everything aboard', () => {
  const tasks = wayHome(e, counts);
  assert.equal(ready(tasks, none), false);
  assert.equal(nextTask(tasks, none)?.id, 'plates');
  const almost: Progress = { plates: 3, ore: 31, crystal: 6, solar: 100, beacons: 6, colonists: 3 };
  assert.equal(ready(tasks, almost), false);
  assert.equal(nextTask(tasks, almost)?.id, 'colonists');
  assert.equal(ready(tasks, { ...almost, colonists: 4 }), true);
  assert.equal(nextTask(tasks, { ...almost, colonists: 4 }), null);
});
