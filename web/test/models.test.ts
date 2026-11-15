import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import * as THREE from 'three';
import { CONTRACT, GUARDIAN_HEIGHT, LOOP_CLIPS, MAX_CLIP_SECONDS, TIMED_TYPES, TRAPPIST_1 } from '../src/models/contract.ts';
import type { PlanetLook } from '../src/models/contract.ts';
import { countTriangles, isKitMaterial } from '../src/models/kit.ts';
import type { ModelEntry } from '../src/models/kit.ts';
import { CATALOG } from '../src/models/index.ts';

// Every model in the catalog is checked against the naming contract
// (prompts-characters.md, section 2, and src/models/contract.ts). Models that
// change with the planet are checked on each of the three planets.

const finite = (values: ArrayLike<number>) => Array.prototype.every.call(values, Number.isFinite);

test('model ids are unique', () => {
  const ids = CATALOG.map((entry) => entry.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('the three planets match the catalog', () => {
  const csv = readFileSync(new URL('../public/data/exoplanets.csv', import.meta.url), 'utf8').split('\n');
  const columns = csv[0].trim().split(',');
  const field = (row: string[], name: string) => Number(row[columns.indexOf(name)]);
  for (const look of Object.values(TRAPPIST_1)) {
    const line = csv.find((candidate) => candidate.startsWith(`"${look.name}",`));
    assert.ok(line, `${look.name} is not in the catalog`);
    const row = line.split(',');
    assert.equal(look.eqTempK, field(row, 'pl_eqt'));
    assert.equal(look.starTeffK, field(row, 'st_teff'));
    assert.equal(look.radiusEarth, field(row, 'pl_rade'));
    const gravity = field(row, 'pl_bmasse') / field(row, 'pl_rade') ** 2;
    assert.ok(Math.abs(look.gravityG - gravity) < 0.01, `${look.name}: ${look.gravityG} g, catalog gives ${gravity.toFixed(3)}`);
  }
});

function variants(entry: ModelEntry): [string, PlanetLook | undefined][] {
  return entry.planetary ? Object.values(TRAPPIST_1).map((look) => [` on ${look.name}`, look]) : [['', undefined]];
}

for (const entry of CATALOG) {
  const contract = CONTRACT[entry.type];

  for (const [where, planet] of variants(entry)) {
    const name = `${entry.id}${where}`;
    const build = () => entry.create(planet);

    test(`${name}: every node has a name and no name repeats`, () => {
      const { root } = build();
      const seen = new Set<string>();
      root.traverse((object) => {
        if (!(object as THREE.Mesh).isMesh) assert.ok(object.name, 'a node has no name');
        if (!object.name) return;
        assert.ok(!seen.has(object.name), `"${object.name}" appears twice`);
        seen.add(object.name);
      });
    });

    if (!entry.draft) test(`${name}: has the nodes and clips of a ${entry.type}`, () => {
      const { root, clips } = build();
      for (const node of contract.nodes) assert.ok(root.getObjectByName(node), `node "${node}" is missing`);
      const names = clips.map((clip) => clip.name);
      assert.equal(new Set(names).size, names.length, 'two clips share a name');
      for (const clip of contract.clips) assert.ok(names.includes(clip), `clip "${clip}" is missing`);
    });

    test(`${name}: clips last ${MAX_CLIP_SECONDS} s at most and move existing nodes`, () => {
      const { root, clips } = build();
      for (const clip of clips) {
        assert.ok(clip.duration > 0 && clip.duration <= MAX_CLIP_SECONDS, `${clip.name} lasts ${clip.duration} s`);
        assert.ok(clip.validate(), `${clip.name} has invalid tracks`);
        for (const track of clip.tracks) {
          const { nodeName } = THREE.PropertyBinding.parseTrackName(track.name);
          const node = root.getObjectByName(nodeName);
          assert.ok(node && !(node as THREE.Mesh).isMesh, `${clip.name} moves "${nodeName}", which is not a node`);
          // Times are stored as float32, so 1.2 s may read 1.2000000477.
          assert.ok(track.times[0] >= 0 && track.times[track.times.length - 1] <= clip.duration + 1e-5, `${track.name} goes past the clip`);
        }
      }
    });

    test(`${name}: loops close with no jump`, () => {
      const { clips } = build();
      for (const clip of clips.filter((candidate) => LOOP_CLIPS.includes(candidate.name))) {
        assert.ok(clip.userData.loop, `${clip.name} has to be made with loop()`);
      }
      for (const clip of clips.filter((candidate) => candidate.userData.loop)) {
        for (const track of clip.tracks) {
          const size = track.getValueSize();
          const first = Array.from(track.values.slice(0, size));
          const last = Array.from(track.values.slice(-size));
          assert.equal(track.times[0], 0, `${clip.name}: ${track.name} does not start at 0`);
          assert.ok(Math.abs(track.times[track.times.length - 1] - clip.duration) < 1e-5, `${clip.name}: ${track.name} does not end with the clip`);
          first.forEach((value, i) => assert.ok(Math.abs(value - last[i]) < 1e-6, `${clip.name}: ${track.name} jumps when it loops`));
        }
      }
    });

    test(`${name}: within the triangle budget of a ${entry.type}`, () => {
      const triangles = countTriangles(build().root);
      assert.ok(triangles <= contract.maxTriangles, `${triangles} triangles, budget ${contract.maxTriangles}`);
    });

    test(`${name}: only kit materials`, () => {
      build().root.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.isMesh) assert.ok(isKitMaterial(mesh.material as THREE.Material), `a mesh in ${mesh.parent?.name} uses a material from outside the kit`);
      });
    });

    test(`${name}: no value that is not a number`, () => {
      const { root, clips } = build();
      root.traverse((object) => {
        assert.ok(finite(object.position.toArray()) && finite(object.quaternion.toArray()) && finite(object.scale.toArray()), `${object.name || 'a mesh'} has an invalid transform`);
        const mesh = object as THREE.Mesh;
        if (mesh.isMesh) assert.ok(finite(mesh.geometry.getAttribute('position').array), `a mesh in ${mesh.parent?.name} has invalid vertices`);
      });
      for (const clip of clips) {
        for (const track of clip.tracks) assert.ok(finite(track.times) && finite(track.values), `${clip.name}: ${track.name} has invalid keys`);
      }
    });

    // A shot has its origin at its centre: it is never set down.
    if (entry.type !== 'shot') test(`${name}: stands on the ground`, () => {
      const bounds = new THREE.Box3().setFromObject(build().root);
      // Flying models hover: nothing below the ground, but no need to touch it.
      const lowest = entry.flies ? Infinity : 0.06;
      assert.ok(bounds.min.y > -0.03 && bounds.min.y < lowest, `the lowest point is at ${bounds.min.y.toFixed(3)} m, not at 0`);
    });

    if (TIMED_TYPES.includes(entry.type)) {
      test(`${name}: every attack says when it warns and when it hits`, () => {
        const { clips, attacks } = build();
        for (const clip of clips.filter((candidate) => candidate.name.startsWith('Attack'))) {
          const timing = attacks[clip.name];
          assert.ok(timing, `${clip.name} has no timing`);
          assert.ok(timing.warn >= 0 && timing.warn < timing.hit, `${clip.name}: the warning has to come before the hit`);
          assert.ok(timing.hit <= timing.end && timing.end <= clip.duration + 1e-5, `${clip.name}: the hit has to end inside the clip`);
        }
      });
    }

    if (entry.type === 'weapon') {
      test(`${name}: held by its foot, and the shot leaves from the front`, () => {
        const { root } = build();
        root.updateMatrixWorld(true);
        const muzzle = root.getObjectByName('muzzle')!.getWorldPosition(new THREE.Vector3());
        const bounds = new THREE.Box3().setFromObject(root);
        assert.ok(Math.abs(muzzle.x) < 1e-6, 'the muzzle is off to one side');
        assert.ok(muzzle.z > 0.15, `the muzzle is only ${muzzle.z.toFixed(2)} m ahead of the grip`);
        assert.ok(bounds.max.z - muzzle.z < 0.08, 'something sticks out past the muzzle');
        assert.ok(bounds.min.z > -0.25, 'the back of the weapon would run into the forearm');
      });
    }

    if (entry.type === 'guardian') {
      test(`${name}: reads from the door, with a visible weak point`, () => {
        const { root } = build();
        const height = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3()).y;
        assert.ok(height >= GUARDIAN_HEIGHT.min && height <= GUARDIAN_HEIGHT.max, `${height.toFixed(2)} m tall`);
        let visible = false;
        root.getObjectByName('weak_point')?.traverse((object) => {
          if ((object as THREE.Mesh).isMesh) visible = true;
        });
        assert.ok(visible, 'weak_point has nothing to see');
      });
    }
  }
}
