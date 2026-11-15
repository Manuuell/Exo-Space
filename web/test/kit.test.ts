import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as THREE from 'three';
import { animation, box, countDrawCalls, exportable, glow, loop, model, node, part, poses, rig, sphere, toon } from '../src/models/kit.ts';

// The kit's own promises, which every model relies on.

test('the same colour gives the same material, and the same shape the same geometry', () => {
  assert.equal(toon('#ff0000'), toon(0xff0000));
  assert.notEqual(toon('#ff0000'), glow('#ff0000'));
  assert.equal(sphere(0.5), sphere(0.5));
});

test('parts of one colour in one node become one mesh with its outline', () => {
  const root = node('root', {},
    node('body', {},
      part(box(1, 1, 1), '#ff0000'),
      part(sphere(0.3), '#ff0000', { at: [0, 1, 0] }),
      part(sphere(0.2), '#0000ff', { at: [0, 2, 0], outline: false })));
  model(root, []);
  const body = root.getObjectByName('body')!;
  assert.equal(body.children.length, 2, 'one mesh per material');
  assert.equal(countDrawCalls(root), 3, 'red, its outline, and blue without one');
});

test('baking keeps where each part was', () => {
  const root = node('root', {}, node('body', {}, part(sphere(0.25), '#ffffff', { at: [2, 3, 4] })));
  model(root, []);
  const center = new THREE.Box3().setFromObject(root).getCenter(new THREE.Vector3());
  assert.ok(center.distanceTo(new THREE.Vector3(2, 3, 4)) < 0.05);
});

test('a loop ends on its first value', () => {
  const { times, values } = loop((phase) => [phase * 10, 0, 0]).sample(2);
  assert.equal(times[0], 0);
  assert.equal(times[times.length - 1], 2);
  assert.deepEqual(values[values.length - 1], values[0]);
});

test('poses hold before the first key and after the last', () => {
  const { times, values } = poses([0.5, 1], [1, 3]).sample(2);
  assert.equal(values[0], 1);
  assert.equal(values[values.length - 1], 3);
  assert.equal(times[times.length - 1], 2);
});

test('tracks are offsets from the rest pose', () => {
  const root = node('root', {}, node('arm', { at: [1, 2, 3], rot: [0, 0, 30] }));
  const { mov, rot } = rig(root);
  const clip = animation('Test', 1, [
    mov('arm', poses([0, [0, 0, 0]], [1, [0, 1, 0]])),
    rot('arm', poses([0, [0, 0, 0]], [1, [0, 0, 60]])),
  ]);
  const position = clip.tracks[0].values;
  assert.deepEqual(Array.from(position.slice(0, 3)), [1, 2, 3]);
  assert.deepEqual(Array.from(position.slice(-3)), [1, 3, 3]);
  const end = new THREE.Quaternion().fromArray(Array.from(clip.tracks[1].values.slice(-4)));
  const expected = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, THREE.MathUtils.degToRad(90)));
  assert.ok(Math.abs(Math.abs(end.dot(expected)) - 1) < 1e-6, 'rest 30° plus 60° should be 90°');
  assert.equal(clip.userData.loop, false);
});

test('a clip is marked as a loop only when every track loops', () => {
  const root = node('root', {}, node('a'), node('b'));
  const { scl } = rig(root);
  assert.equal(animation('Idle', 1, [scl('a', loop(() => 1)), scl('b', loop(() => 1))]).userData.loop, true);
  assert.equal(animation('Mixed', 1, [scl('a', loop(() => 1)), scl('b', poses([0, 1]))]).userData.loop, false);
});

test('the GLB copy has no outlines and no toon materials', () => {
  const root = node('root', {}, node('body', {}, part(box(1, 1, 1), '#ff0000'), part(sphere(0.2), glow('#00ff00'))));
  model(root, []);
  const copy = exportable(root);
  copy.traverse((object) => {
    assert.ok(!object.userData.outline, 'an outline was left in');
    const mesh = object as THREE.Mesh;
    if (mesh.isMesh) assert.ok(!(mesh.material instanceof THREE.MeshToonMaterial), 'a toon material was left in');
  });
  assert.ok(countDrawCalls(root) > countDrawCalls(copy), 'the original keeps its outlines');
});

test('a seeded sequence stays between 0 and 1, also for negative seeds', async () => {
  const { seeded } = await import('../src/models/kit.ts');
  for (const seed of [-12.5, -1, 0, 3, 1e6]) {
    const next = seeded(seed);
    for (let i = 0; i < 50; i++) {
      const value = next();
      assert.ok(value >= 0 && value < 1, `seed ${seed} gave ${value}`);
    }
  }
});
