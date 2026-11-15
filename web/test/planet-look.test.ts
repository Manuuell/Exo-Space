// The look of a planet from its data: the same planet always looks the same,
// different figures give different looks, and missing values do not break it.

import assert from 'node:assert/strict';
import test from 'node:test';
import { TRAPPIST_1 } from '../src/models/contract.ts';
import { LANDING_FLAT, floraInCell, landWeights, planetFeatures, planetGround, planetScenery, propsInCell, wasteland, LAST_VALLEY } from '../src/models/planet-look.ts';

const { e, b, h } = TRAPPIST_1;

test('the same planet always gets the same scenery, land and props', () => {
  assert.deepEqual(planetScenery(e), planetScenery(e));
  const [one, two] = [planetGround(e), planetGround(e)];
  for (const [x, z] of [[500, 900], [-3000, 1200], [4100, -2700]]) assert.equal(one(x, z), two(x, z));
  assert.deepEqual(propsInCell(e, 3, -2), propsInCell(e, 3, -2));
});

test('the three planets of TRAPPIST-1 look different', () => {
  const looks = [e, b, h].map(planetScenery);
  const grounds = new Set(looks.map((look) => look.ground.low));
  assert.equal(grounds.size, 3);
  assert.equal(looks[0].liquid.kind, 'water');
  assert.equal(looks[1].liquid.kind, 'lava');
  assert.equal(looks[2].liquid.kind, 'ice');
  assert.ok(looks[1].liquid.glows && !looks[0].liquid.glows);
});

test('the palette is tinted continuously: close temperatures give close but different colours', () => {
  const a = planetScenery({ ...e, eqTempK: 250 }).ground.low;
  const c = planetScenery({ ...e, eqTempK: 252 }).ground.low;
  assert.notEqual(a, c);
  const weights = landWeights(260);
  assert.ok(Math.abs(weights.ice + weights.moss + weights.lava - 1) < 1e-9);
});

test('low gravity raises the land, high gravity flattens it', () => {
  assert.ok(planetScenery(h).relief > planetScenery(e).relief);
  assert.ok(planetScenery(e).relief > planetScenery(b).relief);
});

test('a bigger planet has a bigger globe', () => {
  assert.ok(planetScenery(b).globeRadius > planetScenery(e).globeRadius);
  assert.ok(planetScenery(e).globeRadius > planetScenery(h).globeRadius);
});

test('the landing site is flat and dry, and the land is finite everywhere', () => {
  for (const planet of [e, b, h]) {
    const ground = planetGround(planet);
    const level = planetScenery(planet).liquid.level;
    for (const [x, z] of [[0, 0], [30, -25], [-40, 15]]) assert.equal(ground(x, z), 0);
    assert.ok(ground(0, 0) > level);
    for (let i = 0; i < 200; i++) {
      const height = ground(i * 173 - 17_000, i * 211 - 21_000);
      assert.ok(Number.isFinite(height) && Math.abs(height) < 1000, `${planet.name}: ${height} m`);
    }
  }
});

test('props stay off the landing site and out of the liquid', () => {
  for (const planet of [e, b, h]) {
    const ground = planetGround(planet);
    const level = planetScenery(planet).liquid.level;
    let count = 0;
    for (let ci = -3; ci <= 3; ci++) {
      for (let ck = -3; ck <= 3; ck++) {
        for (const prop of propsInCell(planet, ci, ck, ground)) {
          count++;
          assert.ok(Math.hypot(prop.x, prop.z) >= LANDING_FLAT.inner, `${planet.name}: a prop on the landing site`);
          assert.ok(ground(prop.x, prop.z) >= level, `${planet.name}: a prop in the liquid`);
          assert.ok(prop.size > 0);
        }
      }
    }
    assert.ok(count > 40, `${planet.name}: only ${count} props`);
  }
});

test('missing values fall back to neutral ones', () => {
  const look = planetScenery({ name: 'Nowhere', eqTempK: Number.NaN, gravityG: 0, starTeffK: Number.NaN, radiusEarth: -1 });
  assert.ok(look.relief > 0 && look.globeRadius > 0);
  assert.match(look.ground.low, /^#[0-9a-f]{6}$/);
  assert.ok(Number.isFinite(planetGround({ name: 'Nowhere' })(1234, 5678)));
});

test('every planet has three dungeon gates on dry, flat ground, facing the landing site', () => {
  for (const planet of [e, b, h]) {
    const ground = planetGround(planet);
    const level = planetScenery(planet).liquid.level;
    const { gates } = planetFeatures(planet, ground);
    assert.equal(gates.length, 3, planet.name);
    for (const gate of gates) {
      assert.ok(Math.hypot(gate.x, gate.z) > LANDING_FLAT.outer, `${planet.name}: a gate on the landing site`);
      assert.ok(ground(gate.x, gate.z) > level, `${planet.name}: a gate in the liquid`);
      // The door (+Z turned by yaw) points back at the landing site.
      const door = { x: Math.sin(gate.yaw), z: Math.cos(gate.yaw) };
      assert.ok(door.x * -gate.x + door.z * -gate.z > 0, `${planet.name}: a gate faces away`);
    }
  }
});

test('the temperate home has giant trees, herds and flora; the cold and the scorched do not', () => {
  const home = planetFeatures(e);
  assert.ok(home.giants.length >= 10);
  assert.ok(home.giants.some((tree) => Math.hypot(tree.x, tree.z) < 400), 'no giant tree to see from the landing site');
  for (const species of ['mossback', 'puffhop', 'skyfin']) assert.ok(home.herds.some((herd) => herd.species === species), species);
  assert.ok(floraInCell(e, 3, 4).length > 10);
  for (const planet of [b, h]) {
    const features = planetFeatures(planet);
    assert.equal(features.giants.length + features.herds.length, 0, planet.name);
    assert.equal(floraInCell(planet, 3, 4).length, 0, planet.name);
  }
});

test('the landmarks are the same every time and keep apart', () => {
  assert.deepEqual(planetFeatures(e), planetFeatures(e));
  const { gates, giants } = planetFeatures(e);
  const spots = [...gates, ...giants];
  for (let i = 0; i < spots.length; i++) {
    for (let j = i + 1; j < spots.length; j++) assert.ok(Math.hypot(spots[i].x - spots[j].x, spots[i].z - spots[j].z) > 60);
  }
});

test('the open world: a village on the home planet, and camps, beacons, chests and shards on every planet', () => {
  for (const planet of [e, b, h]) {
    const ground = planetGround(planet);
    const level = planetScenery(planet).liquid.level;
    const features = planetFeatures(planet, ground);
    assert.ok(features.camps.length >= 4, `${planet.name}: ${features.camps.length} camps`);
    assert.ok(features.beacons.length >= 5, `${planet.name}: ${features.beacons.length} beacons`);
    assert.ok(features.chests.length >= 10, `${planet.name}: ${features.chests.length} chests`);
    assert.ok(features.shards.length >= 35, `${planet.name}: ${features.shards.length} shards`);
    for (const spot of [...features.camps, ...features.beacons, ...features.chests, ...features.shards]) {
      assert.ok(ground(spot.x, spot.z) > level, `${planet.name}: something in the liquid`);
    }
    // Every camp guards a chest at its middle.
    for (const camp of features.camps) assert.ok(features.chests.some((chest) => chest.x === camp.x && chest.z === camp.z));
  }
  const { village } = planetFeatures(e);
  assert.ok(village, 'the home planet has a village');
  assert.equal(village.huts.length, 6);
  assert.equal(village.folk.length, 4);
  assert.ok(Math.hypot(village.centre.x, village.centre.z) < 250, 'the village is near the landing site');
  // A small world: everything to do within about 650 m.
  const all = planetFeatures(e);
  for (const spot of [...all.gates, ...all.camps, ...all.beacons, ...all.chests, ...all.shards, ...all.packs]) assert.ok(Math.hypot(spot.x, spot.z) < 650);
  assert.ok(all.packs.length >= 20, `only ${all.packs.length} packs of enemies`);
  assert.equal(planetFeatures(b).village, null);
});

test('paths join the landing site to the village and every place to go; forests leave them clear', async () => {
  const { planetPaths, forestDensity } = await import('../src/models/planet-look.ts');
  const features = planetFeatures(e);
  const paths = planetPaths(e, features);
  assert.ok(paths.lines.length >= 1 + features.gates.length + features.camps.length);
  for (const spot of [features.village!.centre, ...features.gates, ...features.camps, ...features.beacons]) {
    assert.ok(paths.distance(spot.x, spot.z) < 1, 'a place with no path to it');
  }
  const forest = forestDensity(e, planetGround(e), paths);
  const [x, z] = paths.lines[1][Math.floor(paths.lines[1].length / 2)];
  assert.equal(forest(x, z), 0, 'trees on a path');
  assert.equal(forest(0, 0), 0, 'trees on the landing site');
  let wooded = 0;
  for (let i = 0; i < 400; i++) if (forest((i % 20) * 60 - 600, Math.floor(i / 20) * 60 - 600) > 0.3) wooded++;
  assert.ok(wooded > 40, `only ${wooded} of 400 points are wooded`);
  assert.equal(forestDensity(b)(500, 500), 0);
});

test('the valley is the last place alive: beyond its mountains the land is dead', async () => {
  const { forestDensity, FLORA_CELL } = await import('../src/models/planet-look.ts');
  const dead = wasteland(e);
  const all = planetFeatures(e);
  assert.equal(dead(0, 0), 0);
  for (const spot of [...all.gates, ...all.camps, ...all.beacons, ...all.chests, ...all.shards, ...all.packs]) assert.equal(dead(spot.x, spot.z), 0);
  // The dragon's nest is on the high rim of the valley, still inside it.
  assert.ok(all.nest, 'no nest');
  assert.equal(dead(all.nest.x, all.nest.z), 0);
  assert.ok(Math.hypot(all.nest.x, all.nest.z) > 400);
  const forest = forestDensity(e);
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
    const [x, z] = [Math.sin(a) * (LAST_VALLEY.outer + 200), Math.cos(a) * (LAST_VALLEY.outer + 200)];
    assert.equal(dead(x, z), 1);
    assert.equal(forest(x, z), 0);
    const ci = Math.floor(x / FLORA_CELL);
    const ck = Math.floor(z / FLORA_CELL);
    assert.ok(floraInCell(e, ci, ck).every((plant) => dead(plant.x, plant.z) <= 0.25));
  }
});
